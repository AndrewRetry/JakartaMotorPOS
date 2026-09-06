import itertools

from postgrest.exceptions import APIError


def _raise_api_error(code, message, details):
    raise APIError({"code": code, "message": message, "details": details, "hint": ""})


class TableData:
    """The stored rows for one table, plus the constraints we simulate."""

    def __init__(self, rows=(), next_id=1, unique_columns=(), required_columns=(),
                 defaults=None):
        self.rows = [dict(row) for row in rows]
        self.unique_columns = tuple(unique_columns)
        self.required_columns = tuple(required_columns)
        # Column defaults, as the DDL declares them. Postgres returns the whole
        # row after an INSERT, so a fake that omits them produces false failures.
        self.defaults = dict(defaults or {})
        self._ids = itertools.count(next_id)

    def insert(self, values):
        for column in self.required_columns:
            if values.get(column) is None:
                _raise_api_error("23502", f'null value in column "{column}"',
                                 f"Failing row contains a null {column}.")
        for column in self.unique_columns:
            if any(row.get(column) == values.get(column) for row in self.rows):
                _raise_api_error("23505", "duplicate key value violates unique constraint",
                                 f"Key ({column})=({values.get(column)}) already exists.")
        row = {"id": next(self._ids), **self.defaults, **values}
        self.rows.append(row)
        return row


class _Result:
    """Stands in for postgrest's APIResponse: just .data and .count."""

    def __init__(self, data, count=None):
        self.data = data
        self.count = count


class _Query:
    def __init__(self, table_data, operation, values=None, want_count=False):
        self._data = table_data
        self._operation = operation
        self._values = values
        self._want_count = want_count
        self._equals = []        # [(column, value)]
        self._not_equals = []
        self._or_groups = []     # each is [(column, operator, pattern), ...]
        self._start = None
        self._end = None

    # -- filters ------------------------------------------------------------
    def eq(self, column, value):
        self._equals.append((column, value))
        return self

    def neq(self, column, value):
        self._not_equals.append((column, value))
        return self

    def or_(self, filters, reference_table=None):
        self._or_groups.append([item.split(".", 2) for item in filters.split(",")])
        return self

    def order(self, column, **kwargs):
        return self

    def range(self, start, end, foreign_table=None):
        self._start, self._end = start, end
        return self

    def limit(self, size, **kwargs):
        self._start, self._end = 0, size - 1
        return self

    # -- execution ----------------------------------------------------------
    def _matching_rows(self):
        rows = sorted(self._data.rows, key=lambda row: row["id"])
        for column, value in self._equals:
            rows = [row for row in rows if str(row.get(column)) == str(value)]
        for column, value in self._not_equals:
            rows = [row for row in rows if str(row.get(column)) != str(value)]
        # Separate or_() calls are ANDed together, matching PostgREST.
        for group in self._or_groups:
            rows = [row for row in rows if _row_matches_any(row, group)]
        return rows

    def execute(self):
        if self._operation == "insert":
            return _Result([self._data.insert(self._values)])

        rows = self._matching_rows()

        if self._operation == "select":
            total = len(rows)
            if self._start is not None:
                rows = rows[self._start:self._end + 1]
            return _Result(rows, total if self._want_count else None)

        if self._operation == "update":
            for row in rows:
                row.update(self._values)
            return _Result(rows)

        for row in rows:
            self._data.rows.remove(row)
        return _Result(rows)


def _row_matches_any(row, group):
    for column, operator, pattern in group:
        value = str(row.get(column) or "").lower()
        if pattern.strip("*").lower() in value:
            return True
    return False


class _Table:
    def __init__(self, table_data):
        self._data = table_data

    def select(self, *columns, count=None, head=None):
        return _Query(self._data, "select", want_count=count == "exact")

    def insert(self, json, **kwargs):
        return _Query(self._data, "insert", values=json)

    def update(self, json, **kwargs):
        return _Query(self._data, "update", values=json)

    def delete(self, **kwargs):
        return _Query(self._data, "delete")


class FakeSupabaseClient:
    """Drop-in replacement for the object returned by get_client()."""

    def __init__(self, tables):
        self.tables = tables      # {table_name: TableData}

    def table(self, table_name):
        return _Table(self.tables[table_name])