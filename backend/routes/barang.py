from flask import Blueprint, jsonify, request
from core.database import CSVEngine
from core.sync import get_mutation_time
from config import BARANG_CSV_PATH

barang_bp = Blueprint('barang', __name__)

# Instantiate table manager pointing to your self-healing data path
db = CSVEngine(BARANG_CSV_PATH, identity_col="id")

@barang_bp.route('/api/barang', methods=['GET'])
def get_items():
    """Fetches all items alongside the latest table mutation time."""
    data = db.get_all()
    return jsonify({
        "data": data,
        "last_mutation_time": get_mutation_time("barang")
    }), 200

@barang_bp.route('/api/barang/update', methods=['POST'])
def update_item():
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