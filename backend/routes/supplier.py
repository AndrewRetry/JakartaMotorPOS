from flask import Blueprint, jsonify, request
from core.database import CSVEngine
from core.sync import get_mutation_time
from config import SUPPLIER_CSV_PATH

supplier_bp = Blueprint('supplier', __name__)

# Instantiate table manager pointing to your self-healing data path
db = CSVEngine(SUPPLIER_CSV_PATH, identity_col="id")


def _normalize_bool_flag(raw_value, default="TRUE"):
    """Coerce incoming truthy/falsy values into the CSV's 'TRUE'/'FALSE' strings."""
    if raw_value is None:
        return default
    if isinstance(raw_value, bool):
        return "TRUE" if raw_value else "FALSE"
    return "TRUE" if str(raw_value).strip().upper() in ("TRUE", "1", "YES", "AKTIF") else "FALSE"


@supplier_bp.route('/api/supplier', methods=['GET'])
def get_suppliers():
    """
    Fetches a search-filtered list of suppliers, matched against name only
    (mirrors the "Cari nama supplier" search bar in the UI).
    """
    search_query = request.args.get('q', default='').lower().strip()
    limit = request.args.get('limit', type=int, default=200)
    offset = request.args.get('offset', type=int, default=0)

    all_records = db.get_all() or []

    search_tokens = search_query.split()
    if search_tokens:
        filtered_records = []
        for sup in all_records:
            name = str(sup.get("name", "")).lower()
            if all(token in name for token in search_tokens):
                filtered_records.append(sup)
    else:
        filtered_records = all_records

    total_matches = len(filtered_records)
    paginated_chunk = filtered_records[offset: offset + limit]

    return jsonify({
        "data": paginated_chunk,
        "total": total_matches,
        "last_mutation_time": get_mutation_time("supplier")
    }), 200


@supplier_bp.route('/api/supplier/<supplier_id>', methods=['GET'])
def get_supplier_by_id(supplier_id):
    """Fetch a single supplier by ID for the edit modal."""
    try:
        all_records = db.get_all() or []
        item = next((record for record in all_records if record.get('id') == supplier_id), None)

        if not item:
            return jsonify({"status": "error", "message": "Supplier tidak ditemukan"}), 404

        return jsonify(item), 200
    except Exception as err:
        return jsonify({"status": "error", "message": str(err)}), 500


@supplier_bp.route('/api/supplier/create', methods=['POST'])
def create_supplier():
    """
    Create a new supplier with an auto-generated ID. Only 'name' is required;
    contact/phone/address default to empty strings and isActive defaults TRUE.

    Returns:
    - 201: Successfully created
    - 400: Missing required fields or malformed payload
    - 500: Server error during write
    """
    try:
        payload = request.get_json()

        if not payload:
            return jsonify({"status": "error", "message": "Request body must be valid JSON"}), 400

        if not str(payload.get("name", "")).strip():
            return jsonify({"status": "error", "message": "Missing required field: name"}), 400

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

        new_supplier = {
            "id": new_id,
            "name": str(payload.get("name", "")).strip(),
            "contact": str(payload.get("contact", "")).strip(),
            "phone": str(payload.get("phone", "")).strip(),
            "address": str(payload.get("address", "")).strip(),
            "isActive": _normalize_bool_flag(payload.get("isActive"), default="TRUE")
        }

        result, status_code = db.create_row(new_supplier)

        if status_code == 201:
            return jsonify({
                "status": "success",
                "message": "Supplier berhasil dibuat",
                "id": new_id,
                "item": new_supplier
            }), 201
        else:
            return jsonify(result), status_code

    except Exception as err:
        return jsonify({"status": "error", "message": f"Unexpected error: {str(err)}"}), 500


@supplier_bp.route('/api/supplier/update', methods=['POST'])
def update_supplier():
    """
    Update a supplier. No version/OCC field exists in this table's schema,
    so writes go through update_row_simple (last-write-wins), same approach
    already used for kategori.
    """
    try:
        payload = request.get_json()

        if not payload:
            return jsonify({"status": "error", "message": "Request body must be valid JSON"}), 400

        supplier_id = payload.get("id")
        if not supplier_id:
            return jsonify({"status": "error", "message": "Missing 'id'"}), 400

        update_fields = {k: v for k, v in payload.items() if k != "id"}
        if "isActive" in update_fields:
            update_fields["isActive"] = _normalize_bool_flag(update_fields["isActive"])

        if not update_fields:
            return jsonify({"status": "error", "message": "No fields to update"}), 400

        result, status_code = db.update_row_simple(str(supplier_id), update_fields)
        return jsonify(result), status_code

    except Exception as err:
        return jsonify({"status": "error", "message": str(err)}), 500


@supplier_bp.route('/api/supplier/<supplier_id>', methods=['DELETE'])
def delete_supplier(supplier_id):
    """Delete a supplier by ID (hard-delete from CSV)."""
    try:
        result, status_code = db.delete_row(supplier_id)
        return jsonify(result), status_code
    except Exception as err:
        return jsonify({"status": "error", "message": str(err)}), 500