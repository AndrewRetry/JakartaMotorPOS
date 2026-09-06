import logging

from postgrest.exceptions import APIError

from core.schema import ColumnType, TableSpec, to_api_field, to_database_column
from core.supabase_client import get_client
from core.sync import update_mutation_time

logger = logging.getLogger(__name__)

# PostgREST encodes a multi-column search as `or=(kode.ilike.*x*,nama.ilike.*x*)`,
# so these characters would break out of the filter expression. `*` and `%` are
# ILIKE wildcards and are stripped so a search term cannot inject its own.

FILTER_UNSAFE_CHARACTERS = ',()"\'\\*%'
_STRIP_UNSAFE = str.maketrans({character: " " for character in FILTER_UNSAFE_CHARACTERS})

#Postgres SQLSTATE -> (HTTP Status code, human readable message)

POSTGRES_ERROR_RESPONSES = {
    "23502": (400, "A required field is missing"),
    "23503": (400, "Referenced record does not exist"),
    "23505": (409, "A record with that value already exists"),
    "23514": (400, "A field failed a validation rule"),
}

def search_tokens(search: str) -> list[str]:
    """Split a user's search box input into filter-safe lowercase tokens."""
    return (search or "").lower().translate(_STRIP_UNSAFE).split()

def to_api_record(row: dict) -> dict:
    """Convert a database row into the all-strings shape the frontend expects."""
    record = {}
    for column, value in row.items():
        if value is None:
            record[to_api_field(column)] = ""
        elif isinstance(value, bool):
            record[to_api_field(column)] = "TRUE" if value else "FALSE"
        else:
            record[to_api_field(column)] = str(value)
    return record

def to_database_record(payload: dict, spec: TableSpec) -> dict:
    """Convert JSON payload from frontend into typed db columns
    
    unknown fields dropped with warning
    'id' is always ignored as its managed by Postgres
    ValueError raised if value cannot be converted
    """
    
    record = {}
    for field, value in payload.items():
        column = to_database_column(field)
        if column == "id":
            continue
        column_type = spec.column_type(column)
        if column_type is None:
            logger.warning("Ignoring unknown field %r for table %r", field, spec.table_name)
            continue
        
        text = "" if value is None else str(value).strip()
        
        if column_type is ColumnType.BOOLEAN:
            record[column] = text.upper() in ("TRUE", "1", "YES", "AKTIF")
        elif column_type is ColumnType.TEXT:
            record[column] = text or None
        elif not text:
            record[column] = None if column_type is ColumnType.NULLABLE_INTEGER else 0
        else:
            try:
                record[column] = int(text)
            except ValueError:
                raise ValueError(f"Field '{field}' must be a whole number, got {value!r}")
    return record

class SupabaseEngine:
    """CRUD operations for single SB table"""
    def __init__(self, spec: TableSpec, client=None):
        self.spec = spec
        self._client = client
    
    @property
    def client(self):
        """Resolved on first use, importing route module dont need key"""
        if self._client is None:
            self._client = get_client()
        return self._client

    @property
    def _table(self):
        return self.client.table(self.spec.table_name)

    # ------------------------------------------------------------------ reads

    def list_records(self, search: str = "", limit: int | None = None, offset: int = 0):
        """Return ``(records, total_matches)``. 
        Searching, counting and pagination all happen in Postgres. 
        Every token must match at least one searchable column
        """        
        
        page_size = limit if limit is not None else self.spec.default_page_size
        query = self._table.select("*", count= "exact")
        
        for token in search_tokens(search):
            query = query.or_(
                ",".join(f"{column}.ilike.*{token}*" for column in self.spec.searchable_columns)
            )
        # range() is inclusive of both ends, subtract one to fetch page_size rows
        response = query.order("id").range(offset, offset + page_size - 1).execute()
        return [to_api_record(row) for row in response.data], response.count or 0
    
    def get_record(self, record_id):
        """Return one record if id matches db, None if id doesnt"""
        response = self._table.select("*").eq("id", record_id).limit(1).execute()
        return to_api_record(response.data[0]) if response.data else None
    
# ----------------------------------------------------------------- writes

    def create_record(self, payload: dict):
        """Insert a record, id is assigned by postgres
        Returns (record, 201)"""

        try: 
            values = to_database_record(payload, self.spec)
        except ValueError as error:
            return {"status": "error", "message": str(error)}, 400
        
        try:
            response = self._table.insert(values).execute()
        except APIError as error:
            return self._error_response(error, "insert")
        
        update_mutation_time(self.spec.entity_name)
        return to_api_record(response.data[0]), 201
    
    def update_record(self, record_id, changes: dict):
        """Apply partial changes to one record. Returns (record, 200)."""
        try:
            values = to_database_record(changes, self.spec)
        except ValueError as error:
            return {"status": "error", "message": str(error)}, 400
        
        if not values:
            return {"status": "error", "message": "No fields to update"}, 400

        try:
            response = self._table.update(values).eq("id", record_id).execute()
        except APIError as error:
            return self._error_response(error, "update")
        
        if not response.data:
            return self._not_found(record_id)

        update_mutation_time(self.spec.entity_name)
        return to_api_record(response.data[0]), 200

    def delete_record(self, record_id):
        """Delete one record. Returns (deleted_record, 200)"""
        try:
            response = self._table.delete().eq("id", record_id).execute()
        except APIError as error:
            return self._error_response(error, "delete")
        
        if not response.data:
            return self._not_found(record_id)
        
        update_mutation_time(self.spec.entity_name)
        return to_api_record(response.data[0]), 200
    
# ---------------------------------------------------------------- helpers
    def _not_found(self, record_id):
        return {
            "status": "error",
            "message": f"Record with id={record_id} not found",
        }, 404
    
    def _error_response(self, error: APIError, operation: str):
        status, message = POSTGRES_ERROR_RESPONSES.get(error.code, (500, "Database error"))
        
        if status == 500:
            logger.exception("%s on %s failed: %s", operation, self.spec.table_name, error.message)
        
        detail = error.details or error.message
        return {"status": "error", "message": f"{message}: {detail}" if detail else message}, status
    
    