"""
The db uses snake_case, due to postgres automatically converts camelCase into lowercase if unquoted
"""

from dataclasses import dataclass
from enum import Enum

# Only these five columns differ between the API and the database;
API_TO_DATABASE = {
    "categoryId": "category_id",
    "isActive": "is_active",
    "priceTier": "price_tier",
    "lokasiItem": "lokasi_item",
    "lokasiStock": "lokasi_stock",
}
DATABASE_TO_API = {database: api for api, database in API_TO_DATABASE.items()}


def to_database_column(api_field: str) -> str:
    return API_TO_DATABASE.get(api_field, api_field)


def to_api_field(database_column: str) -> str:
    return DATABASE_TO_API.get(database_column, database_column)


class ColumnType(str, Enum):
    """How a blank CSV/JSON value is stored, mirroring the DDL's nullability."""

    TEXT = "text"                           # blank -> NULL
    BOOLEAN = "boolean"                     # blank -> False
    NULLABLE_INTEGER = "nullable_integer"   # blank -> NULL
    INTEGER = "integer"                     # blank -> 0 (column is NOT NULL DEFAULT 0)


@dataclass(frozen=True)
class TableSpec:
    """Everything the engine needs to know about one table."""

    table_name: str
    entity_name: str                       # key used by core.sync.MUTATION_STATES
    columns: dict[str, ColumnType]         # database column name -> type
    searchable_columns: tuple[str, ...]    # columns the ?q= filter matches against
    default_page_size: int

    def column_type(self, database_column: str) -> ColumnType | None:
        return self.columns.get(database_column)


KATEGORI = TableSpec(
    table_name="kategori",
    entity_name="kategori",
    columns={
        "kode": ColumnType.TEXT,
        "nama": ColumnType.TEXT,
        "deskripsi": ColumnType.TEXT,
        "is_active": ColumnType.BOOLEAN,
    },
    searchable_columns=("kode", "nama"),
    default_page_size=200,
)

SUPPLIER = TableSpec(
    table_name="supplier",
    entity_name="supplier",
    columns={
        "name": ColumnType.TEXT,
        "contact": ColumnType.TEXT,
        "phone": ColumnType.TEXT,
        "address": ColumnType.TEXT,
        "is_active": ColumnType.BOOLEAN,
    },
    searchable_columns=("name",),
    default_page_size=200,
)

CUSTOMER = TableSpec(
    table_name="customer",
    entity_name="customer",
    columns={
        "name": ColumnType.TEXT,
        "phone": ColumnType.TEXT,
        "address": ColumnType.TEXT,
        "price_tier": ColumnType.TEXT,
    },
    searchable_columns=("name", "phone"),
    default_page_size=200,
)

BARANG = TableSpec(
    table_name="barang",
    entity_name="barang",
    columns={
        "kode": ColumnType.TEXT,
        "nama": ColumnType.TEXT,
        "category_id": ColumnType.NULLABLE_INTEGER,
        "mitra": ColumnType.TEXT,
        "tipe": ColumnType.TEXT,
        "stok": ColumnType.INTEGER,
        "modal": ColumnType.INTEGER,
        "p1": ColumnType.INTEGER,
        "p2": ColumnType.INTEGER,
        "p3": ColumnType.INTEGER,
        "p4": ColumnType.INTEGER,
        "lokasi_item": ColumnType.TEXT,
        "lokasi_stock": ColumnType.TEXT,
        "notes": ColumnType.TEXT,
    },
    searchable_columns=("kode", "nama", "mitra"),
    default_page_size=50,
)