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

@barang_bp.route('/api/barang/create', methods=['POST'])
def create_item():
    """
    Create a new barang (inventory item) with auto-generated ID and version=0.
    
    Expected JSON payload:
    {
        "kode": "CODE-123",
        "nama": "Item Name",
        "categoryId": "1",
        "mitra": "Mitra Name",
        "tipe": "Barang",
        "stok": "100",
        "modal": "50000",
        "p1": "75000",
        "p2": "80000",
        "p3": "85000",
        "p4": "90000",
        "lokasiItem": "Rak A-1",
        "lokasiStock": "Box 12",
        "notes": "Optional notes"
    }
    
    Returns:
    - 201: Successfully created with new item ID and version 0
    - 400: Missing required fields or malformed payload
    - 500: Server error during write
    """
    try:
        payload = request.get_json()
        
        # ==== INPUT VALIDATION ====
        if not payload:
            return jsonify({
                "status": "error",
                "message": "Request body must be valid JSON"
            }), 400
        
        # Define required fields for item creation
        required_fields = ["kode", "nama"]
        missing_fields = [f for f in required_fields if not payload.get(f)]
        
        if missing_fields:
            return jsonify({
                "status": "error",
                "message": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400
        
        # ==== GENERATE NEW ID ====
        # Read existing records to find max ID for sequential assignment
        existing_records = db.get_all() or []
        max_id = 0
        
        for record in existing_records:
            try:
                record_id = int(record.get("id", "0"))
                if record_id > max_id:
                    max_id = record_id
            except (ValueError, TypeError):
                pass
        
        new_id = str(max_id + 1)
        
        # ==== BUILD NEW ITEM RECORD ====
        new_item = {
            "id": new_id,
            "kode": str(payload.get("kode", "")).strip(),
            "nama": str(payload.get("nama", "")).strip(),
            "categoryId": str(payload.get("categoryId", "")).strip(),
            "mitra": str(payload.get("mitra", "")).strip(),
            "tipe": str(payload.get("tipe", "")).strip(),
            "stok": str(payload.get("stok", "0")).strip(),
            "modal": str(payload.get("modal", "0")).strip(),
            "p1": str(payload.get("p1", "0")).strip(),
            "p2": str(payload.get("p2", "0")).strip(),
            "p3": str(payload.get("p3", "0")).strip(),
            "p4": str(payload.get("p4", "0")).strip(),
            "lokasiItem": str(payload.get("lokasiItem", "")).strip(),
            "lokasiStock": str(payload.get("lokasiStock", "")).strip(),
            "notes": str(payload.get("notes", "")).strip(),
            "version": "0"  # All new items start at version 0
        }
        
        # ==== WRITE TO CSV (THREAD-SAFE) ====
        result, status_code = db.create_row(new_item)
        
        if status_code == 201:
            return jsonify({
                "status": "success",
                "message": "Item berhasil dibuat",
                "id": new_id,
                "version": "0",
                "item": new_item
            }), 201
        else:
            return jsonify(result), status_code
            
    except Exception as err:
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(err)}"
        }), 500

@barang_bp.route('/api/barang/update', methods=['POST'])
def update_item():
    """
    Update item with OCC (Optimistic Concurrency Control).
    Requires matching version number for conflict detection.
    """
    try:
        payload = request.get_json()
        
        if not payload:
            return jsonify({"status": "error", "message": "Request body must be valid JSON"}), 400
        
        item_id = payload.get("id")
        version = payload.get("version")
        
        if not item_id or version is None:
            return jsonify({"status": "error", "message": "Missing 'id' or 'version'"}), 400
        
        # Extract fields to update (exclude id and version)
        update_fields = {k: v for k, v in payload.items() if k not in ("id", "version")}
        
        if not update_fields:
            return jsonify({"status": "error", "message": "No fields to update"}), 400
        
        result, status_code = db.update_row(str(item_id), str(version), update_fields)
        return jsonify(result), status_code
        
    except Exception as err:
        return jsonify({"status": "error", "message": str(err)}), 500

@barang_bp.route('/api/barang/<item_id>', methods=['DELETE'])
def delete_item(item_id):
    """
    Delete an item by ID (hard-delete from CSV).
    Returns 200 on success, 404 if not found.
    """
    try:
        result, status_code = db.delete_row(item_id)
        return jsonify(result), status_code
    except Exception as err:
        return jsonify({"status": "error", "message": str(err)}), 500