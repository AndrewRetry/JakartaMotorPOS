from flask import Blueprint, jsonify, request
from core.supabase_engine import SupabaseEngine
from core.schema import BARANG
from core.sync import get_mutation_time
from core.auth import login_required, owner_required

barang_bp = Blueprint("barang", __name__)


db = SupabaseEngine(BARANG)

def _safe_int(val, default=0):
    if val is None or str(val).strip() == "":
        return default
    try:
        return int(val)
    except (ValueError, TypeError):
        return default

def _normalize_barang_payload(payload: dict) -> dict:
    """Normalizes camelCase payload keys to DB snake_case columns."""
    normalized = {}
    
    # Map field aliases
    key_mapping = {
        "categoryId": "category_id",
        "lokasiItem": "lokasi_item",
        "lokasiStock": "lokasi_stock",
    }
    
    for key, value in payload.items():
        db_key = key_mapping.get(key, key)
        normalized[db_key] = value

    # Cast integer fields safely if present. category_id is a nullable
    # foreign key -- a blank value means "no category", not zero -- so it
    # is left out of _safe_int's zero-default and mapped to None instead.
    zero_default_fields = ["stok", "modal", "p1", "p2", "p3", "p4"]
    for field in zero_default_fields:
        if field in normalized and normalized[field] is not None:
            normalized[field] = _safe_int(normalized[field])

    if "category_id" in normalized:
        raw = normalized["category_id"]
        normalized["category_id"] = None if str(raw).strip() == "" else _safe_int(raw, default=None)
    return normalized

@barang_bp.route('/api/barang', methods=['GET'])
@login_required
def get_items():
    """
    Fetches a search-filtered list of items (barang), matched against kode,
    nama, or category.
    """
    records, total = db.list_records(
        search = request.args.get('q', default='', type=str),
        limit = request.args.get('limit', type=int),
        offset = request.args.get('offset', type=int, default=0),
    )    
    
    return jsonify({
        "data": records,
        "total": total,
        "last_mutation_time": get_mutation_time("barang") 
    }), 200

@barang_bp.route('/api/barang/<item_id>', methods=['GET'])
@login_required
def get_item_by_id(item_id):
    """Fetch a single item by id"""
    item = db.get_record(item_id)
    if not item:
        return jsonify({
            "status": "error",
            "message": "Item tidak ditemukan",
        }), 404
        
    return jsonify(item), 200

@barang_bp.route('/api/barang/create', methods=['POST'])
@login_required
def create_item():
    """Create a new barang (inventory item)"""
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({
            "status": "error", 
            "message": "Request body must be valid JSON"
        }), 400
        
    kode = str(payload.get("kode", "")).strip()
    nama = str(payload.get("nama", "")).strip()
    
    missing_fields = []
    if not kode:
        missing_fields.append("kode")
    if not nama:
        missing_fields.append("nama")
        
    if missing_fields:
        return jsonify({
            "status": "error", 
            "message": f"Missing required fields: {', '.join(missing_fields)}"
        }), 400

    normalized_payload = _normalize_barang_payload(payload)

    item_data = {
        "kode": kode,
        "nama": nama,
        "category_id": normalized_payload.get("category_id"),
        "mitra": normalized_payload.get("mitra"),
        "tipe": normalized_payload.get("tipe"),
        "stok": normalized_payload.get("stok", 0),
        "modal": normalized_payload.get("modal", 0),
        "p1": normalized_payload.get("p1", 0),
        "p2": normalized_payload.get("p2", 0),
        "p3": normalized_payload.get("p3", 0),
        "p4": normalized_payload.get("p4", 0),
        "lokasi_item": normalized_payload.get("lokasi_item"),
        "lokasi_stock": normalized_payload.get("lokasi_stock"),
        "notes": normalized_payload.get("notes"),
    }

    result, status_code = db.create_record(item_data)
    if status_code not in (200, 201):
        return jsonify(result), status_code

    return jsonify({
        "status": "success",
        "message": "Item berhasil dibuat",
        "id": result.get("id"),
        "item": result
    }), 201

@barang_bp.route('/api/barang/update', methods=['POST'])
@login_required
def update_item():
    """Update a barang item"""
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({
            "status": "error", 
            "message": "Request body must be valid JSON"
        }), 400
    
    item_id = payload.get("id")
    if not item_id:
        return jsonify({
            "status": "error", 
            "message": "Missing required field: id"
        }), 400

    update_fields = _normalize_barang_payload(payload)

    result, status_code = db.update_record(item_id, update_fields)
    if status_code != 200:
        return jsonify(result), status_code
    
    return jsonify({
        "status": "success",
        "message": "Item berhasil diupdate",
        "item": result
    }), 200        
    
@barang_bp.route('/api/barang/<item_id>', methods=['DELETE'])
@owner_required
def delete_item(item_id):
    """Delete an item by id"""
    result, status_code = db.delete_record(item_id)
    if status_code != 200:
        return jsonify(result), status_code
        
    return jsonify({
        "status": "success",
        "message": f"Item {item_id} berhasil didelete"
    }), 200