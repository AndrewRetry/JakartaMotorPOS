import csv
import sys
from pathlib import Path
from typing import Any, Dict, List

# 1. Define file path (takes from command line if provided, or uses default)
if len(sys.argv) > 1:
    csv_file_path = Path(sys.argv[1])
else:
    csv_file_path = Path("backend/data/your_file.csv")  # Replace with actual path

BATCH_SIZE = 500


def normalize_row(
    raw_row: Dict[str, Any], schema_spec: Any
) -> Dict[str, Any]:
    """Cleans CSV cell values and casts them to database-compatible types."""
    normalized_row: Dict[str, Any] = {}

    for api_field_name, raw_value in raw_row.items():
        db_column = to_db(api_field_name)
        cleaned_value = (raw_value or "").strip()

        # Handle empty/missing values
        if cleaned_value == "":
            normalized_row[db_column] = (
                0 if db_column in schema_spec.not_null_ints else None
            )
        # Type casting based on schema specification
        elif db_column in schema_spec.int_cols:
            normalized_row[db_column] = int(cleaned_value)
        elif db_column in schema_spec.bool_cols:
            normalized_row[db_column] = cleaned_value.upper() in (
                "TRUE",
                "1",
                "YES",
                "AKTIF",
            )
        else:
            normalized_row[db_column] = cleaned_value

    return normalized_row


# 2. Safely read and process the CSV file
if not csv_file_path.exists():
    raise FileNotFoundError(f"CSV file not found at: {csv_file_path.resolve()}")

with open(csv_file_path, newline="", encoding="utf-8") as csv_file:
    processed_rows: List[Dict[str, Any]] = [
        normalize_row(csv_row, schema_spec)
        for csv_row in csv.DictReader(csv_file)
    ]

total_rows = len(processed_rows)

# 3. Upsert to Supabase in batches
for batch_start in range(0, total_rows, BATCH_SIZE):
    batch = processed_rows[batch_start : batch_start + BATCH_SIZE]
    supabase_client.table(schema_spec.table).upsert(
        batch, on_conflict="id"
    ).execute()

    processed_count = min(batch_start + BATCH_SIZE, total_rows)
    print(f"Uploaded: {processed_count} / {total_rows}")