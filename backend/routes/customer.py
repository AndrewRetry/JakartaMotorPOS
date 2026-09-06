from flask import Blueprint, jsonify, request
from core.database import SupabaseEngine
from core.schema import CUSTOMER
from core.sync import get_mutation_time

customer_bp = Blueprint("customer", __name__)


db = SupabaseEngine(CUSTOMER)

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
    records, total = db.list_records(
        search = request.args.get('q', default='', type=str),
        limit = request.args.get('limit', type=int),
        offset = request.args.get('offset', type=int, default=0),
    )    
    
    return jsonify({
        "data": records,
        "total": total,
        "last_mutation_time": get_mutation_time("customer") 
    }), 200

@customer_bp.route('/api/customer/<customer_id>', methods=['GET'])
def get_customer_by_id(customer_id):
    """Fetch a single customer by id"""
    customer = db.get_record(customer_id)
    if not customer:
        return jsonify({
            "status": "error",
            "message": "Customer tidak ditemukan",
        }), 404
        
    return jsonify(customer), 200

@customer_bp.route('/api/customer/create', methods=['POST'])
def create_customer():
    """Create a customer"""
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({
            "status": "error", 
            "message": "Request body must be valid JSON"
        }), 400
        
    name = str(payload.get("name", "")).strip()
    if not name:
        return jsonify({
            "status": "error", 
            "message": "Missing required field: name"
        }), 400
    
    customer_data = {
        "name": name,
        "phone": payload.get("phone"),
        "address": payload.get("address"),
        "price_tier": _normalize_price_tier(payload.get("price_tier")),
    }

    result, status_code = db.create_record(customer_data)
    if status_code not in (200, 201):
        return jsonify(result), status_code

    return jsonify({
        "status": "success",
        "message": "Customer berhasil dibuat",
        "id": result.get("id"),
        "item": result
    }), 201

@customer_bp.route('/api/customer/update', methods=['POST'])
def update_customer():
    """Update a customer"""
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({
            "status": "error", 
            "message": "Request body must be valid JSON"
        }), 400
    
    customer_id = payload.get("id")
    if not customer_id:
        return jsonify({
            "status": "error", 
            "message": "Missing required field: id"
        }), 400

    if "price_tier" in payload:
        payload["price_tier"] = _normalize_price_tier(payload["price_tier"])

    result, status_code = db.update_record(customer_id, payload)
    if status_code != 200:
        return jsonify(result), status_code
    
    return jsonify({
        "status": "success",
        "message": "Customer berhasil diupdate",
        "item": result
    }), 200        
    
@customer_bp.route('/api/customer/<customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    """Delete a customer by id"""
    result, status_code = db.delete_record(customer_id)
    if status_code != 200:
        return jsonify(result), status_code
        
    return jsonify({
        "status": "success",
        "message": f"Customer {customer_id} berhasil didelete"
    }), 200