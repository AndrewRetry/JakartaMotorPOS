from flask import Blueprint, jsonify, request
from core.database import CSVEngine
from core.sync import get_mutation_time
from config import BARANG_CSV_PATH

barang_bp = Blueprint('barang', __name__)

# Instantiate table manager pointing to your self-healing data path
db = CSVEngine(BARANG_CSV_PATH, identity_col="id")

@barang_bp.route('/api/barang', methods=['GET'])
def get_items():
    """
    Fetches a paginated, server-side filtered chunk of items.
    Protects frontend DOM memory limits while handling 20k+ records.
    """
    # 1. Parse incoming UI pagination and search query parameters
    search_query = request.args.get('q', default='').lower().strip()
    limit = request.args.get('limit', type=int, default=50)
    offset = request.args.get('offset', type=int, default=0)

    # 2. Extract database records via your engine abstraction
    all_records = db.get_all() or []

    # 3. High-performance multi-term token filtering engine
    search_tokens = search_query.split()
    if search_tokens:
        filtered_records = []
        for item in all_records:
            # Safely stringify values to avoid attribute crash errors
            kode = str(item.get("kode", "")).lower()
            nama = str(item.get("nama", "")).lower()
            kategori = str(item.get("categoryId", item.get("kategori", ""))).lower()
            
            # Order-independent verification: every token must match somewhere
            if all(token in kode or token in nama or token in kategori for token in search_tokens):
                filtered_records.append(item)
    else:
        filtered_records = all_records

    total_matches = len(filtered_records)
    
    # 4. Apply clean array slicing for pagination boundaries
    paginated_chunk = filtered_records[offset : offset + limit]

    return jsonify({
        "data": paginated_chunk,
        "total": total_matches,
        "last_mutation_time": get_mutation_time("barang")
    }), 200

@barang_bp.route('/api/barang/<item_id>', methods=['GET'])
def get_item_by_id(item_id):
    """
    Fetch a single item by ID for the edit screen.
    Returns full item details including version for OCC.
    """
    try:
        all_records = db.get_all() or []
        item = next((record for record in all_records if record.get('id') == item_id), None)
        
        if not item:
            return jsonify({"status": "error", "message": "Item tidak ditemukan"}), 404
        
        return jsonify(item), 200
    except Exception as err:
        return jsonify({"status": "error", "message": str(err)}), 500

@barang_bp.route('/api/barang/update', methods=['POST'])
def update_item():
    """
    Update item without OCC (Optimistic Concurrency Control).
    Simply overwrites the row - no version checking.
    """
    body = request.json or {}
    target_id = body.get('id')
    
    if not target_id:
        return jsonify({"status": "error", "message": "Missing 'id'"}), 400
 
    # Capture all form fields
    updated_fields = {
        "kode": body.get('kode'),
        "nama": body.get('nama'),
        "categoryId": body.get('categoryId'),
        "mitra": body.get('mitra'),
        "tipe": body.get('tipe'),
        "stok": body.get('stok'),
        "modal": body.get('modal'),
        "p1": body.get('p1'),
        "p2": body.get('p2'),
        "p3": body.get('p3'),
        "p4": body.get('p4'),
        "lokasiItem": body.get('lokasiItem'),
        "lokasiStock": body.get('lokasiStock'),
        "notes": body.get('notes')
    }
    
    try:
        res, status_code = db.update_row_simple(target_id, updated_fields)
        return jsonify(res), status_code
    except Exception as err:
        return jsonify({"status": "error", "message": str(err)}), 500
    """Update item without version checking (no OCC)."""
    body = request.json or {}
    target_id = body.get('id')
    
    if not target_id:
        return jsonify({"status": "error", "message": "Missing 'id'"}), 400

    updated_fields = {
        "kode": body.get('kode'),
        "nama": body.get('nama'),
        "categoryId": body.get('categoryId'),
        "mitra": body.get('mitra'),
        "tipe": body.get('tipe'),
        "stok": body.get('stok'),
        "modal": body.get('modal'),
        "p1": body.get('p1'),
        "p2": body.get('p2'),
        "p3": body.get('p3'),
        "p4": body.get('p4'),
        "lokasiItem": body.get('lokasiItem'),
        "lokasiStock": body.get('lokasiStock'),
        "notes": body.get('notes')
    }
    
    try:
        res = db.update_row_simple(target_id, updated_fields)
        return jsonify(res), 200
    except Exception as err:
        return jsonify({"status": "error", "message": str(err)}), 500
    """Processes real-time form edits safely using version checking."""
    body = request.json or {}
    target_id = body.get('id')
    client_version = body.get('version')
    
    if not target_id or client_version is None:
        return jsonify({"status": "error", "message": "Missing 'id' or 'version'"}), 400

    # Capture and clean every UI form field
    updated_fields = {
        "kode": body.get('kode'),
        "nama": body.get('nama'),
        "categoryId": body.get('categoryId'),
        "mitra": body.get('mitra'),
        "tipe": body.get('tipe'),
        "stok": body.get('stok'),
        "modal": body.get('modal'),
        "p1": body.get('p1'),
        "p2": body.get('p2'),
        "p3": body.get('p3'),
        "p4": body.get('p4'),
        "lokasiItem": body.get('lokasiItem'),
        "lokasiStock": body.get('lokasiStock'),
        "notes": body.get('notes')
    }
    
    res, status_code = db.update_row(target_id, client_version, updated_fields)
    return jsonify(res), status_code