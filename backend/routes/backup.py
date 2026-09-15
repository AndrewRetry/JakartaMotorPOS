from flask import Response, abort
from core.auth import login_required, owner_required
from core.schema import TableSpec 
from ..core.csv_backup import (
    write_csv_line, 
    csv_field_names, 
    database_row_to_csv_row, 
    UTF8_BOM
)

PAGE_SIZE = 1000

@barang_bp.route('/api/backup/export/<entity>', methods=['GET'])
@login_required
@owner_required
def _stream_table_csv(spec):
    """Yield CSV text one page at a time, starting with the header."""
    yield UTF8_BOM + write_csv_line(csv_field_names(spec))

    client = get_client()
    offset = 0
    while True:
        page = (client.table(spec.table_name).select("*")
                .order("id").range(offset, offset + PAGE_SIZE - 1).execute())
        if not page.data:
            return
        for row in page.data:
            yield write_csv_line(database_row_to_csv_row(row, spec))
        if len(page.data) < PAGE_SIZE:
            return
        offset += PAGE_SIZE