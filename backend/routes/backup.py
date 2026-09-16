import csv
import io
import uuid
from datetime import date

from flask import Blueprint, Response, jsonify, request
from core import schema
from core.auth import login_required, owner_required
from core.csv_backup import (
    CSV_DELIMITER,
    UTF8_BOM,
    csv_field_names,
    database_row_to_csv_row,
    unescape_formula,
    write_csv_line
)

from core.schema import ColumnType, TableSpec
from core.supabase_client import get_client
from core.sync import update_mutation_time

backup_bp = Blueprint("backup", __name__)

BACKUP_TABLES: dict[str, TableSpec] = {
    "barang": schema.BARANG,
    "kategori": schema.KATEGORI,
    "supplier": schema.SUPPLIER,
    "customer": schema.CUSTOMER,
}

READ_PAGE_SIZE = 1000
STAGING_BATCH_SIZE = 500
MAX_REPORTED_ERRORS = 50

def stream_table_as_csv(spec: TableSpec, client: None):
    # Yield a whole table as CSV Text, as this will pause the state of the function instead of return which will exit the function completely
    yield UTF8_BOM + write_csv_line(csv_field_names(spec))
    
    client = client or get_client()
    offset = 0
    
    while True:
        page = (client.table(spec.table_name)
                .select("*")
                .order("id")
                .range(offset, offset + READ_PAGE_SIZE - 1)
                .execute())
        
        for row in page.data:
            yield write_csv_line(database_row_to_csv_row(row, spec))

        if len(page.data) < READ_PAGE_SIZE:
            return
        offset += READ_PAGE_SIZE
        
@backup_bp.route("/api/backup/export/<entity>", methods=["GET"])
@login_required
def export_table(entity):
    spec = BACKUP_TABLES.get(entity)
    if spec is None:
        return jsonify({
            "status": "error",
            "message": f"Tabel '{entity} tidak dikenal"
        }), 404
    
    filename = f"{entity}-{date.today().isoformat()}.csv"
    
    return Response(
        stream_table_as_csv(spec),
        headers={
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
    
# import
def decode_upload(uploaded_file) -> str:
    # read uploaded file as text
    raw_bytes = uploaded_file.read()
    try:
        return raw_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        return raw_bytes.decode("cp1252")

def detect_delimiter(sample: str) -> str:
    # accept ; or , as delimiter
    try:
        return csv.Sniffer().sniff(sample, delimiters=";,").delimiter
    except csv.Error:
        return CSV_DELIMITER  

def csv_row_to_database_row(csv_row: dict, spec: TableSpec) -> dict:
    # convert a csv row to db row, if structure differ, raise ValueError
    row = {}

    for field, raw_value in csv_row.items():
        if field is None:
            raise ValueError("baris ini punya lebih banyak kolom daripada header")

        column = to_database_column(field.strip())
        text = unescape_formula((raw_value or "").strip())

        if column == "id":
            if not text:
                raise ValueError("kolom id wajib diisi")
            try:
                row["id"] = int(text)
            except ValueError:
                raise ValueError(f'id harus berupa angka, bukan "{text}"')
            continue

        column_type = spec.column_type(column)
        if column_type is None:
            continue  # present in the file but not in the table, so ignored

        if column_type is ColumnType.BOOLEAN:
            row[column] = text.upper() in ("TRUE", "1", "YES", "AKTIF")
        elif column_type is ColumnType.TEXT:
            row[column] = text or None
        elif not text:
            # NULLABLE_INTEGER means genuinely unknown; INTEGER is NOT NULL DEFAULT 0.
            row[column] = None if column_type is ColumnType.NULLABLE_INTEGER else 0
        else:
            try:
                row[column] = int(text)
            except ValueError:
                raise ValueError(f'{field} harus berupa bilangan bulat, bukan "{text}"')

    if "id" not in row:
        raise ValueError("kolom id tidak ditemukan")

    return row

def validate_rows(reader, spec: TableSpec) -> tuple[list[dict], list[str]]:
    # Convert every row and collecting errors instead of stopping at first error
    rows = []
    errors = []
    line_of_id = {}
    
    # data row start at row 2, row 1 is header
    for line_number, csv_row in enumerate(reader, start=2):
        try:
            row = csv_row_to_database_row(csv_row, spec)
        except ValueError as error:
            errors.append(f"Baris {line_number}: {error}")
            continue

        duplicate_of = line_of_id.get(row["id"])
        if duplicate_of:
            errors.append(
                f"Baris {line_number}: id {row['id']} sudah dipakai di baris {duplicate_of}"
            )
            continue

        line_of_id[row["id"]] = line_number
        rows.append(row)

    return rows, errors

def stage_and_commit(spec: TableSpec, rows: list[dict], replace_existing: bool, client=None) -> int:
    #Stage every row, then merge staging into the live table in one transaction.
    client = client or get_client()
    import_id = str(uuid.uuid4())

    staged_rows = [
        {"import_id": import_id, "table_name": spec.table_name, "row_data": row}
        for row in rows
    ]

    for start in range(0, len(staged_rows), STAGING_BATCH_SIZE):
        batch = staged_rows[start:start + STAGING_BATCH_SIZE]
        # returning="minimal" stops PostgREST echoing every staged row back.
        client.table("import_staging").insert(batch, returning="minimal").execute()

    response = client.rpc("commit_import", {
        "p_import_id": import_id,
        "p_table_name": spec.table_name,
        "p_replace": replace_existing,
    }).execute()

    return response.data if isinstance(response.data, int) else len(rows)

@backup_bp.route("/api/backup/import/<entity>", methods=["POST"])
@owner_required
def import_table(entity):
    spec = BACKUP_TABLES.get(entity)
    if spec is None:
        return jsonify({"status": "error", "message": f"Tabel '{entity}' tidak dikenal"}), 404

    uploaded_file = request.files.get("file")
    if uploaded_file is None or not uploaded_file.filename:
        return jsonify({"status": "error", "message": "Tidak ada file yang diunggah"}), 400

    replace_existing = request.form.get("mode") == "replace"

    text = decode_upload(uploaded_file)
    reader = csv.DictReader(io.StringIO(text), delimiter=detect_delimiter(text[:4096]))

    expected_header = csv_field_names(spec)
    actual_header = [name.strip() for name in (reader.fieldnames or [])]
    missing_columns = [name for name in expected_header if name not in actual_header]

    if missing_columns:
        return jsonify({
            "status": "error",
            "message": f"Format file tidak sesuai. Kolom hilang: {', '.join(missing_columns)}",
            "expectedHeader": CSV_DELIMITER.join(expected_header),
        }), 400

    rows, errors = validate_rows(reader, spec)

    if errors:
        return jsonify({
            "status": "error",
            "message": f"{len(errors)} baris bermasalah. Tidak ada data yang diubah.",
            "errors": errors[:MAX_REPORTED_ERRORS],
            "totalErrors": len(errors),
        }), 400

    if not rows:
        return jsonify({"status": "error", "message": "File tidak berisi data"}), 400

    rows_written = stage_and_commit(spec, rows, replace_existing)
    update_mutation_time(spec.entity_name)

    return jsonify({
        "status": "success",
        "message": f"{rows_written} baris berhasil diimpor",
        "rowsWritten": rows_written,
    }), 200