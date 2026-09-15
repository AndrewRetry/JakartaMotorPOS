import csv
import io

from core.schema import ColumnType, TableSpec, to_api_field

CSV_DELIMITER = ","
UTF8_BOM = "\ufeff"
FORMULA_TRIGGERS = ("=", "+", "-", "@", "\t", "\r")
FORMULA_GUARD = "'"

def escape_formula(text: str) -> str:
    # If the formula trigger in excel is present in text as leading characters to invoke a formula, invoke a stringifier (') in excel
    if text and text.startswith(FORMULA_TRIGGERS):
        return FORMULA_GUARD + text
    return text

def unescape_formula(text: str) -> str:
    # Undo escape formula
    if len(text) > 1 and text[0] == FORMULA_GUARD and text[1:].startswith(FORMULA_TRIGGERS):
        return text[1:]
    return text

def csv_field_names(spec: TableSpec) -> list[str]:
    # Header row: Id and then the other columns in camelCase
    return ["id"] + [to_api_field(column) for column in spec.columns]

def database_row_to_csv_row(row: dict, spec: TableSpec) -> list[str]:
    # Convert one database row to csv format
    cells = [str(row.get("id", ""))]
    
    for column, column_type in spec.columns.items():
        value = row.get(column)
        
        if value is None:
            cells.append("")
        elif column_type is ColumnType.BOOLEAN:
            cells.append("TRUE" if value else "FALSE")
        elif column_type is ColumnType.TEXT:
            cells.append(escape_formula(str(value)))
        else:
            cells.append(str(value))
    
    return cells

def write_csv_line(cells: list[str]) -> str:
    # Render one csv row using CLRF endings
    buffer = io.StringIO()
    csv.writer(buffer, delimiter=CSV_DELIMITER, lineterminator="\r\n").writerow(cells)  
    return buffer.getvalue()

