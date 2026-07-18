from flask import Blueprint, jsonify, request
from core.database import CSVEngine
from core.sync import get_mutation_time
from config import KATEGORI_CSV_PATH

kategori_bp = Blueprint('kategori', __name__)

# Instantiate table manager pointing to your self-healing data path
db = CSVEngine(KATEGORI_CSV_PATH, identity_col="id")


def _normalize_bool_flag(raw_value, default="TRUE"):
    """Coerce incoming truthy/falsy values into the CSV's 'TRUE'/'FALSE' strings."""
    if raw_value is None:
        return default
    if isinstance(raw_value, bool):
        return "TRUE" if raw_value else "FALSE"
    return "TRUE" if str(raw_value).strip().upper() in ("TRUE", "1", "YES", "AKTIF") else "FALSE"


def _next_kode(existing_records):
    """Generate the next sequential KTG-XXX code from existing rows."""
    max_seq = 0
    for record in existing_records:
        kode = str(record.get("kode", ""))
        if kode.startswith("KTG-"):
            try:
                seq = int(kode.split("KTG-")[1])
                if seq > max_seq:
                    max_seq = seq
            except (ValueError, IndexError):
                pass
    return f"KTG-{max_seq + 1:03d}"


@kategori_bp.route('/api/kategori', methods=['GET'])
def get_categories():
    """
    Fetches a search-filtered list of categories.
    Category tables stay small, but limit/offset are kept for consistency
    with the barang endpoint's pagination contract.
    """
    search_query = request.args.get('q', default='').lower().strip()
    limit = request.args.get('limit', type=int, default=200)
    offset = request.args.get('offset', type=int, default=0)

    all_records = db.get_all() or []

    search_tokens = search_query.split()
    if search_tokens:
        filtered_records = []
        for cat in all_records:
            kode = str(cat.get("kode", "")).lower()
            nama = str(cat.get("nama", "")).lower()
            if all(token in kode or token in nama for token in search_tokens):
                filtered_records.append(cat)
    else:
        filtered_records = all_records

    total_matches = len(filtered_records)
    paginated_chunk = filtered_records[offset: offset + limit]

    return jsonify({
        "data": paginated_chunk,
        "total": total_matches,
        "last_mutation_time": get_mutation_time("kategori")
    }), 200


@kategori_bp.route('/api/kategori/<category_id>', methods=['GET'])
def get_category_by_id(category_id):
    """Fetch a single category by ID for the edit modal."""
    try:
        all_records = db.get_all() or []
        item = next((record for record in all_records if record.get('id') == category_id), None)

        if not item:
            return jsonify({"status": "error", "message": "Kategori tidak ditemukan"}), 404

        return jsonify(item), 200
    except Exception as err:
        return jsonify({"status": "error", "message": str(err)}), 500


@kategori_bp.route('/api/kategori/create', methods=['POST'])
def create_category():
    """
    Create a new kategori with an auto-generated ID and sequential kode
    (e.g. KTG-002). Only 'nama' is required; kode is derived server-side
    so the frontend never has to worry about collisions.

    Returns:
    - 201: Successfully created
    - 400: Missing required fields or malformed payload
    - 500: Server error during write
    """
    try:
        payload = request.get_json()

        if not payload:
            return jsonify({"status": "error", "message": "Request body must be valid JSON"}), 400

        if not str(payload.get("nama", "")).strip():
            return jsonify({"status": "error", "message": "Missing required field: nama"}), 400

        existing_records = db.get_all() or []

        # ==== GENERATE NEW ID ====
        max_id = 0
        for record in existing_records:
            try:
                record_id = int(record.get("id", "0"))
                if record_id > max_id:
                    max_id = record_id
            except (ValueError, TypeError):
                pass
        new_id = str(max_id + 1)

        # ==== GENERATE OR RESPECT SUPPLIED KODE ====
        supplied_kode = str(payload.get("kode", "")).strip()
        new_kode = supplied_kode if supplied_kode else _next_kode(existing_records)

        new_category = {
            "id": new_id,
            "kode": new_kode,
            "nama": str(payload.get("nama", "")).strip(),
            "deskripsi": str(payload.get("deskripsi", "")).strip(),
            "isActive": _normalize_bool_flag(payload.get("isActive"), default="TRUE")
        }

        result, status_code = db.create_row(new_category)

        if status_code == 201:
            return jsonify({
                "status": "success",
                "message": "Kategori berhasil dibuat",
                "id": new_id,
                "item": new_category
            }), 201
        else:
            return jsonify(result), status_code

    except Exception as err:
        return jsonify({"status": "error", "message": f"Unexpected error: {str(err)}"}), 500


@kategori_bp.route('/api/kategori/update', methods=['POST'])
def update_category():
    """
    Update a category. There is no version/OCC field in this table's schema,
    so writes go through update_row_simple (last-write-wins) - acceptable
    given how infrequently and by how few users the category list is edited.
    """
    try:
        payload = request.get_json()

        if not payload:
            return jsonify({"status": "error", "message": "Request body must be valid JSON"}), 400

        category_id = payload.get("id")
        if not category_id:
            return jsonify({"status": "error", "message": "Missing 'id'"}), 400

        update_fields = {k: v for k, v in payload.items() if k != "id"}
        if "isActive" in update_fields:
            update_fields["isActive"] = _normalize_bool_flag(update_fields["isActive"])

        if not update_fields:
            return jsonify({"status": "error", "message": "No fields to update"}), 400

        result, status_code = db.update_row_simple(str(category_id), update_fields)
        return jsonify(result), status_code

    except Exception as err:
        return jsonify({"status": "error", "message": str(err)}), 500


@kategori_bp.route('/api/kategori/<category_id>', methods=['DELETE'])
def delete_category(category_id):
    """Delete a category by ID (hard-delete from CSV)."""
    try:
        result, status_code = db.delete_row(category_id)
        return jsonify(result), status_code
    except Exception as err:
        return jsonify({"status": "error", "message": str(err)}), 500