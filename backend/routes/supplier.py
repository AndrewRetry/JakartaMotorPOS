from flask import Blueprint, jsonify, request
from core.supabase_engine import SupabaseEngine
from core.schema import SUPPLIER
from core.sync import get_mutation_time

supplier_bp = Blueprint("supplier", __name__)


db = SupabaseEngine(SUPPLIER)

def _normalize_bool(raw_value, default=True):
    if raw_value is None:
        return default
    if isinstance(raw_value, bool):
        return raw_value
    return str(raw_value).strip().upper() in ("TRUE", "1", "YES", "AKTIF")

@supplier_bp.route('/api/supplier', methods=['GET'])
def get_suppliers():
    """
    Fetches a search-filtered list of suppliers, matched against name
    (mirrors the "Cari nama supplier" search bar in the UI).
    """
    records, total = db.list_records(
        search = request.args.get('q', default='', type=str),
        limit = request.args.get('limit', type=int),
        offset = request.args.get('offset', type=int, default=0),
    )    
    
    return jsonify({
        "data": records,
        "total": total,
        "last_mutation_time": get_mutation_time("supplier") 
    }), 200

@supplier_bp.route('/api/supplier/<supplier_id>', methods=['GET'])
def get_supplier_by_id(supplier_id):
    """Fetch a single supplier by id"""
    supplier = db.get_record(supplier_id)
    if not supplier:
        return jsonify({
            "status": "error",
            "message": "Supplier tidak ditemukan",
        }), 404
        
    return jsonify(supplier), 200

@supplier_bp.route('/api/supplier/create', methods=['POST'])
def create_supplier():
    """Create a supplier"""
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
    
    raw_is_active = payload.get("is_active") if "is_active" in payload else payload.get("isActive")

    supplier_data = {
        "name": name,
        "contact": payload.get("contact"),
        "phone": payload.get("phone"),
        "address": payload.get("address"),
        "is_active": _normalize_bool(raw_is_active, default=True),
    }

    result, status_code = db.create_record(supplier_data)
    if status_code not in (200, 201):
        return jsonify(result), status_code

    return jsonify({
        "status": "success",
        "message": "Supplier berhasil dibuat",
        "id": result.get("id"),
        "item": result
    }), 201

@supplier_bp.route('/api/supplier/update', methods=['POST'])
def update_supplier():
    """Update a supplier"""
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({
            "status": "error", 
            "message": "Request body must be valid JSON"
        }), 400
    
    supplier_id = payload.get("id")
    if not supplier_id:
        return jsonify({
            "status": "error", 
            "message": "Missing required field: id"
        }), 400

    if "isActive" in payload:
        payload["is_active"] = _normalize_bool(payload.pop("isActive"))
    elif "is_active" in payload:
        payload["is_active"] = _normalize_bool(payload["is_active"])

    result, status_code = db.update_record(supplier_id, payload)
    if status_code != 200:
        return jsonify(result), status_code
    
    return jsonify({
        "status": "success",
        "message": "Supplier berhasil diupdate",
        "item": result
    }), 200        
    
@supplier_bp.route('/api/supplier/<supplier_id>', methods=['DELETE'])
def delete_supplier(supplier_id):
    """Delete a supplier by id"""
    result, status_code = db.delete_record(supplier_id)
    if status_code != 200:
        return jsonify(result), status_code
        
    return jsonify({
        "status": "success",
        "message": f"Supplier {supplier_id} berhasil didelete"
    }), 200