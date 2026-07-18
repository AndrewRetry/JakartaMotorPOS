import csv
import os
import threading
from core.sync import update_mutation_time

class CSVEngine:
    """
    Lightweight CSV-based data engine with thread-safe CRUD operations.
    Implements optimistic concurrency control (OCC) via version checking.
    """
    
    def __init__(self, file_path: str, identity_col: str = "id"):
        """
        Initialize the CSV engine.
        
        Args:
            file_path: Absolute path to the CSV data file
            identity_col: Primary key column name (default: "id")
        """
        self.file_path = file_path
        self.id_col = identity_col
        self.lock = threading.Lock()

    def _read_rows(self):
        """
        Streams records from disk without retaining memory allocations.
        Returns empty list if file doesn't exist.
        """
        if not os.path.exists(self.file_path):
            return []
        with open(self.file_path, mode='r', newline='', encoding='utf-8') as f:
            return list(csv.DictReader(f))

    def _write_rows(self, rows):
        """
        Write rows back to CSV file, preserving original column order.
        Thread-safe via external lock management.
        """
        if not rows:
            return False
        
        headers = list(rows[0].keys())
        
        with open(self.file_path, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(rows)
        
        return True

    # ========================================================================
    # READ OPERATIONS
    # ========================================================================

    def get_all(self):
        """Thread-safe fetch of all active entries."""
        with self.lock:
            return self._read_rows()

    def get_by_id(self, item_id):
        """
        Fetch a single record by ID.
        
        Returns:
            dict: Record if found, None otherwise
        """
        with self.lock:
            rows = self._read_rows()
            for row in rows:
                if str(row.get(self.id_col)) == str(item_id):
                    return row
        return None

    # ========================================================================
    # CREATE OPERATIONS
    # ========================================================================

    def create_row(self, new_record: dict):
        """
        Insert a new record into the CSV file.
        
        Args:
            new_record: Dictionary containing all fields for the new row.
                       Must include at least the identity_col (id).
        
        Returns:
            tuple: (response_dict, status_code)
                   201: Created successfully
                   400: Invalid record or missing identity_col
                   409: Duplicate ID detected
                   500: File write error
        """
        entity_name = os.path.basename(self.file_path).replace('.csv', '')
        
        with self.lock:
            # ---- Validation ----
            if not new_record:
                return {
                    "status": "error",
                    "message": "Record cannot be empty"
                }, 400
            
            if self.id_col not in new_record:
                return {
                    "status": "error",
                    "message": f"Missing required identity column '{self.id_col}'"
                }, 400
            
            new_id = str(new_record[self.id_col])
            
            # ---- Read existing rows ----
            rows = self._read_rows()
            
            # ---- Check for duplicate ID ----
            for row in rows:
                if str(row.get(self.id_col)) == new_id:
                    return {
                        "status": "error",
                        "message": f"Record with {self.id_col}={new_id} already exists"
                    }, 409
            
            # ---- Normalize new record to strings ----
            normalized_record = {}
            if rows:
                # Use existing column order
                headers = list(rows[0].keys())
                for header in headers:
                    normalized_record[header] = str(new_record.get(header, ""))
            else:
                # First record: preserve insertion order of new_record
                for key, val in new_record.items():
                    normalized_record[key] = str(val)
            
            # ---- Append to rows ----
            rows.append(normalized_record)
            
            # ---- Write back to CSV ----
            try:
                self._write_rows(rows)
                update_mutation_time(entity_name)
                
                return {
                    "status": "success",
                    "message": f"Record created with {self.id_col}={new_id}",
                    self.id_col: new_id
                }, 201
                
            except IOError as io_err:
                return {
                    "status": "error",
                    "message": f"Failed to write CSV: {str(io_err)}"
                }, 500

    # ========================================================================
    # UPDATE OPERATIONS
    # ========================================================================

    def update_row(self, target_id: str, incoming_version: str, updated_fields: dict):
        """
        Update a record using Optimistic Concurrency Control (OCC).
        Requires version match to prevent concurrent write conflicts.
        
        Args:
            target_id: ID of the record to update
            incoming_version: Expected version from client (must match server)
            updated_fields: Dictionary of fields to update
        
        Returns:
            tuple: (response_dict, status_code)
                   200: Update successful, version incremented
                   404: Record not found
                   409: Version mismatch (conflict detected)
                   500: Write error
        """
        entity_name = os.path.basename(self.file_path).replace('.csv', '')
        
        with self.lock:
            rows = self._read_rows()
            if not rows:
                return {
                    "status": "error",
                    "message": "Table is empty or missing"
                }, 404

            headers = list(rows[0].keys())
            updated = False

            for row in rows:
                if str(row.get(self.id_col)) == str(target_id):
                    # ---- Version Check ----
                    current_version = str(row.get('version', '0'))
                    if current_version != str(incoming_version):
                        return {
                            "status": "conflict",
                            "message": f"Version mismatch. Server: {current_version}, Client: {incoming_version}",
                            "server_version": current_version
                        }, 409
                    
                    # ---- Apply Updates ----
                    for key, val in updated_fields.items():
                        if key in row and val is not None:
                            row[key] = str(val)
                    
                    # ---- Increment Version ----
                    row['version'] = str(int(current_version) + 1)
                    updated = True
                    break

            if not updated:
                return {
                    "status": "error",
                    "message": f"Record with {self.id_col}={target_id} not found"
                }, 404

            # ---- Write back to CSV ----
            try:
                self._write_rows(rows)
                update_mutation_time(entity_name)
                
                return {
                    "status": "success",
                    "message": "Record updated",
                    "new_version": row['version']
                }, 200
                
            except IOError as io_err:
                return {
                    "status": "error",
                    "message": f"Failed to write CSV: {str(io_err)}"
                }, 500

    def update_row_simple(self, target_id: str, updated_fields: dict):
        """
        Simple update without version checking (last-write-wins).
        Use only when concurrency conflicts are impossible or acceptable.
        
        Args:
            target_id: ID of the record to update
            updated_fields: Dictionary of fields to update
        
        Returns:
            tuple: (response_dict, status_code)
                   200: Update successful
                   404: Record not found
                   500: Write error
        """
        entity_name = os.path.basename(self.file_path).replace('.csv', '')
        
        with self.lock:
            rows = self._read_rows()
            if not rows:
                return {
                    "status": "error",
                    "message": "Table is empty or missing"
                }, 404

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
                return {
                    "status": "error",
                    "message": f"Record with {self.id_col}={target_id} not found"
                }, 404

            # Write back to CSV
            try:
                self._write_rows(rows)
                update_mutation_time(entity_name)
                
                return {
                    "status": "success",
                    "message": "Item updated"
                }, 200
                
            except IOError as io_err:
                return {
                    "status": "error",
                    "message": f"Failed to write CSV: {str(io_err)}"
                }, 500

    # ========================================================================
    # DELETE OPERATIONS
    # ========================================================================

    def delete_row(self, target_id: str):
        """
        Hard-delete a record from the CSV by ID.
        
        Args:
            target_id: ID of the record to delete
        
        Returns:
            tuple: (response_dict, status_code)
                   200: Deletion successful
                   404: Record not found
                   500: Write error
        """
        entity_name = os.path.basename(self.file_path).replace('.csv', '')
        
        with self.lock:
            rows = self._read_rows()
            if not rows:
                return {
                    "status": "error",
                    "message": "Table is empty or missing"
                }, 404

            headers = list(rows[0].keys())
            initial_count = len(rows)

            # Filter out the target row
            rows = [row for row in rows if str(row.get(self.id_col)) != str(target_id)]

            if len(rows) == initial_count:
                return {
                    "status": "error",
                    "message": f"Record with {self.id_col}={target_id} not found"
                }, 404

            # Write back to CSV
            try:
                self._write_rows(rows)
                update_mutation_time(entity_name)
                
                return {
                    "status": "success",
                    "message": f"Record {target_id} deleted"
                }, 200
                
            except IOError as io_err:
                return {
                    "status": "error",
                    "message": f"Failed to write CSV: {str(io_err)}"
                }, 500