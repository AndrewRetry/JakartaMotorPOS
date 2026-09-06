from flask import Blueprint, jsonify, request
from core.schema import KATEGORI 
from core.supabase_engine import SupabaseEngine
from core.sync import get_mutation_time

kategori_bp = Blueprint('kategori', __name__)

# Instantiate table manager pointing to your self-healing data path
db = SupabaseEngine(KATEGORI)

def _next_kode(existing_records):
    """Generate next sequential KTG-XXX code from existing rows"""
    
    max_seq = 0
    for record in existing_records:
        kode = str(record.get("kode", ""))
        if kode.startswith("KTG-"):
            try: 
                seq = int(kode.split("KTG-")[1])
                
                if seq > max_seq:
                    max_seq = seq
            except (ValueError, IndexError):
                pass
            
    return f"KTG-{max_seq + 1:03d}"

@kategori_bp.route('/api/kategori', methods=['GET'])
def get_categories():
    """Fetch a search filtered and paginated list"""
    records, total = db.list_records(
        search = request.args.get('q', default='', type=str),
        limit = request.args.get('limit', type=int),
        offset = request.args.get('offset', type=int, default=0),
    )
    
    return jsonify({
        "data": records,
        "total": total,
        "last_mutation_time": get_mutation_time("kategori") 
    }), 200
    
@kategori_bp.route('/api/kategori/<category_id>', methods=['GET'])
def get_category_by_id(category_id):
    """Fetch a single category by id"""
    category = db.get_record(category_id)
    if not category:
        return jsonify({
            "status": "error",
            "message": "Kategori tidak ditemukan",
        }), 404
    
    return jsonify(category), 200

@kategori_bp.route('/api/kategori/create', methods=['POST'])
def create_category():
    """Create a category"""
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({
            "status": "error", 
            "message": "Request body must be valid JSON"
        }), 400
    if not str(payload.get("nama", "")).strip():
        return jsonify({
            "status": "error", 
            "message": "Missing required field: nama"
        }), 400
    if not str(payload.get("kode", "")).strip():
        existing_records, _ = db.list_records(limit = 1000)
        payload = {**payload, "kode": _next_kode(existing_records)}
        
    result, status_code = db.create_record(payload)
    if status_code != 201:
        return jsonify(result), status_code
        
    return jsonify({
        "status": "success",
        "message": "Kategori berhasil dibuat",
        "id": result["id"],
        "item": result
    }), 201
    
@kategori_bp.route('/api/kategori/update', methods=['POST'])
def update_category():
    """update a category"""
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({
            "status": "error", 
            "message": "Request body must be valid JSON"
        }), 400
    
    category_id = payload.get("id")
    if not category_id:
        return jsonify({
            "status": "error", 
            "message": "Missing required field: id"
        }), 400
        
    result, status_code = db.update_record(category_id, payload)
    if status_code != 200:
        return jsonify(result), status_code
    
    return jsonify({
        "status": "success",
        "message": "Kategori berhasil diupdate",
        "item": result
    }), 200
    
@kategori_bp.route('/api/kategori/<category_id>', methods=['DELETE'])
def delete_category(category_id):
    """delete a category by id"""
    result, status_code = db.delete_record(category_id)
    if status_code != 200:
        return jsonify(result), status_code
    
    return jsonify({
        "status": "success",
        "message": f"Kategori {category_id} berhasil didelete"
    }), 200