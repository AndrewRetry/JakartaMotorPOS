import csv
import os
import threading
from core.sync import update_mutation_time

class CSVEngine:
    def __init__(self, file_path: str, identity_col: str = "id"):
        self.file_path = file_path
        self.id_col = identity_col
        self.lock = threading.Lock()

    def _read_rows(self):
        """Streams records from disk without retaining memory allocations."""
        if not os.path.exists(self.file_path):
            return []
        with open(self.file_path, mode='r', newline='', encoding='utf-8') as f:
            return list(csv.DictReader(f))

    def get_all(self):
        """Thread-safe fetch of all active entries."""
        with self.lock:
            return self._read_rows()

    def update_row(self, target_id: str, incoming_version: str, updated_fields: dict):
        """Generic OCC update processor that handles changes dynamically."""
        entity_name = os.path.basename(self.file_path).replace('.csv', '')
        
        with self.lock:
            rows = self._read_rows()
            if not rows:
                return {"status": "error", "message": "Table is empty or missing"}, 404

            headers = list(rows[0].keys())
            updated = False

            for row in rows:
                if str(row.get(self.id_col)) == str(target_id):
                    current_version = str(row.get('version', '0'))
                    if current_version != str(incoming_version):
                        return {
                            "status": "conflict", 
                            "message": f"Version mismatch. Server: {current_version}, Client: {incoming_version}"
                        }, 409
                    
                    for key, val in updated_fields.items():
                        if key in row and val is not None:
                            row[key] = str(val)
                    
                    row['version'] = str(int(current_version) + 1)
                    updated = True
                    break

            if not updated:
                return {"status": "error", "message": f"Record with ID {target_id} not found"}, 404

            with open(self.file_path, mode='w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=headers)
                writer.writeheader()
                writer.writerows(rows)

            update_mutation_time(entity_name)
            return {"status": "success", "new_version": row['version']}, 200
        
    def update_row_simple(self, target_id: str, updated_fields: dict):
        """
        Simple update without version checking (no OCC).
        Last-write-wins approach.
        """
        entity_name = os.path.basename(self.file_path).replace('.csv', '')
        
        with self.lock:
            rows = self._read_rows()
            if not rows:
                return {"status": "error", "message": "Table is empty or missing"}, 404

            headers = list(rows[0].keys())
            updated = False

            for row in rows:
                if str(row.get(self.id_col)) == str(target_id):
                    # Update only the provided fields
                    for key, val in updated_fields.items():
                        if key in row and val is not None:
                            row[key] = str(val)
                    
                    updated = True
                    break

            if not updated:
                return {"status": "error", "message": f"Record with ID {target_id} not found"}, 404

            # Write back to CSV
            with open(self.file_path, mode='w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=headers)
                writer.writeheader()
                writer.writerows(rows)

            update_mutation_time(entity_name)
            return {"status": "success", "message": "Item updated"}, 200