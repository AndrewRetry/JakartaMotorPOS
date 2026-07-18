from flask import Blueprint, jsonify, request
from core.database import CSVEngine
from core.sync import get_mutation_time
from config import CUSTOMER_CSV_PATH

customer_bp = Blueprint("customer", __name__)


db = CSVEngine(CUSTOMER_CSV_PATH, identity_col="id")

VALID_PRICE_TIERS = ["p1", "p2", "p3", "p4"]

def _normalize_price_tier(raw_value, default="p1"):
    if raw_value is None:
        return default
    val = str(raw_value).strip().lower()
    return val if val in VALID_PRICE_TIERS else default

@customer_bp.route('/api/customer', methods=['GET'])
def get_customers():
    """
    Fetches a search-filtered list of customers, matched against name or
    phone (mirrors the "Cari nama atau no. telepon" search bar in the UI).
    """
    search_query = request.args.get('q', default='').lower().strip()
    limit = request.args.get('limit', type=int, default=200)
    offset = request.args.get('offset', type=int, default=0)

    all_records = db.get_all() or []

    search_tokens = search_query.split()
    if search_tokens:
        filtered_records = []
        for cust in all_records:
            name = str(cust.get("name", "")).lower()
            phone = str(cust.get("phone", "")).lower()
            if all(token in name or token in phone for token in search_tokens):
                filtered_records.append(cust)
    else:
        filtered_records = all_records

    total_matches = len(filtered_records)
    paginated_chunk = filtered_records[offset: offset + limit]

    return jsonify({
        "data": paginated_chunk,
        "total": total_matches,
        "last_mutation_time": get_mutation_time("customer")
    }), 200


@customer_bp.route('/api/customer/<customer_id>', methods=['GET'])
def get_customer_by_id(customer_id):
    """Fetch a single customer by ID for the edit modal."""
    try:
        all_records = db.get_all() or []
        item = next((record for record in all_records if record.get('id') == customer_id), None)

        if not item:
            return jsonify({"status": "error", "message": "Pelanggan tidak ditemukan"}), 404

        return jsonify(item), 200
    except Exception as err:
        return jsonify({"status": "error", "message": str(err)}), 500


@customer_bp.route('/api/customer/create', methods=['POST'])
def create_customer():
    """
    Create a new customer with an auto-generated ID. Only 'name' is required;
    phone/address default to empty strings and priceTier defaults to p1.

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

        new_customer = {
            "id": new_id,
            "name": str(payload.get("name", "")).strip(),
            "phone": str(payload.get("phone", "")).strip(),
            "address": str(payload.get("address", "")).strip(),
            "priceTier": _normalize_price_tier(payload.get("priceTier"), default="p1")
        }

        result, status_code = db.create_row(new_customer)

        if status_code == 201:
            return jsonify({
                "status": "success",
                "message": "Pelanggan berhasil dibuat",
                "id": new_id,
                "item": new_customer
            }), 201
        else:
            return jsonify(result), status_code

    except Exception as err:
        return jsonify({"status": "error", "message": f"Unexpected error: {str(err)}"}), 500


@customer_bp.route('/api/customer/update', methods=['POST'])
def update_customer():
    """
    Update a customer. No version/OCC field exists in this table's schema,
    so writes go through update_row_simple (last-write-wins), same approach
    already used for kategori and supplier.
    """
    try:
        payload = request.get_json()

        if not payload:
            return jsonify({"status": "error", "message": "Request body must be valid JSON"}), 400

        customer_id = payload.get("id")
        if not customer_id:
            return jsonify({"status": "error", "message": "Missing 'id'"}), 400

        update_fields = {k: v for k, v in payload.items() if k != "id"}
        if "priceTier" in update_fields:
            update_fields["priceTier"] = _normalize_price_tier(update_fields["priceTier"])

        if not update_fields:
            return jsonify({"status": "error", "message": "No fields to update"}), 400

        result, status_code = db.update_row_simple(str(customer_id), update_fields)
        return jsonify(result), status_code

    except Exception as err:
        return jsonify({"status": "error", "message": str(err)}), 500


@customer_bp.route('/api/customer/<customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    """Delete a customer by ID (hard-delete from CSV)."""
    try:
        result, status_code = db.delete_row(customer_id)
        return jsonify(result), status_code
    except Exception as err:
        return jsonify({"status": "error", "message": str(err)}), 500