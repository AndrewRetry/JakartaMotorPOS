"""One-off import of backend/data/*.csv into Supabase.

Safe to re-run: rows are upserted on their primary key, so running this again
after fixing the schema converges to the CSV instead of failing on duplicates.

    python -m scripts.import_csv

Afterwards run backend/db/02_fix_sequences.sql, or the first record created
through the UI will collide with an existing id.
"""

import csv
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core import schema
from core.schema import ColumnType, TableSpec, to_database_column
from core.supabase_client import get_client

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

# One request per 500 rows: a single 20,000-row body would time out.
BATCH_SIZE = 500

# kategori before barang, which references it.
IMPORTS = [
    ("kategori.csv", schema.KATEGORI),
    ("supplier.csv", schema.SUPPLIER),
    ("customer.csv", schema.CUSTOMER),
    ("barang.csv", schema.BARANG),
]

def to_database_row(csv_row: dict, spec: TableSpec) -> dict:
    "Convert one csv row string into typed db row"
    
    row = {}
    for field, raw_value in csv_row.items():
        column = to_database_column(field)
        text = (raw_value or "").strip()
        
        if column == "id":
            row["id"] = int(text)
            continue
        
        column_type = spec.column_type(column)
        if column_type is None:
            continue #if column exists in csv but not in table, skipped
        
        if column_type is ColumnType.BOOLEAN:
            row[column] = text.upper() in ("TRUE", "1", "YES", "AKTIF")
        elif column_type is ColumnType.TEXT:
            row[column] = text or None
        elif not text:
            # NULLABLE_INTEGER is genuinely unknown; INTEGER is NOT NULL DEFAULT 0.
            row[column] = None if column_type is ColumnType.NULLABLE_INTEGER else 0
        else:
            row[column] = int(text)
    return row

def read_csv(filename: str, spec: TableSpec) -> list[dict]:
    """Parse a CSV file into database rows.

    csv.DictReader handles quoted fields containing commas, which 140 rows of
    barang.csv rely on.
    """
    
    path = os.path.join(DATA_DIR, filename)
    with open(path, newline="", encoding='utf-8') as csv_file:
        return [to_database_row(row, spec) for row in csv.DictReader(csv_file)]

def import_table(client, filename: str, spec: TableSpec) -> int:
    rows = read_csv(filename, spec)
    print(f"{spec.table_name}: importing {len(rows)} rows from {filename}")
    
    for start in range(0, len(rows), BATCH_SIZE):
        batch = rows[start:start + BATCH_SIZE]
        client.table(spec.table_name).upsert(batch, on_conflict="id").execute()
        print(f"  {min(start + BATCH_SIZE, len(rows))}/{len(rows)}")
        
    return len(rows)

def main():
    client = get_client()
    for filename, spec in IMPORTS:
        import_table(client, filename, spec)
    print("\nDone. Now run backend/db/02_fix_sequences.sql in the Supabase SQL Editor.")


if __name__ == "__main__":
    main()