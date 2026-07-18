from flask import Flask, jsonify, request
from routes.barang import barang_bp
from routes.kategori import kategori_bp
from routes.supplier import supplier_bp
from routes.customer import customer_bp
from routes.common import common_bp
from core.sync import get_mutation_time

def create_app():
    app = Flask(__name__)

    # Register modular entity blueprints
    app.register_blueprint(barang_bp)
    app.register_blueprint(kategori_bp)
    app.register_blueprint(supplier_bp)
    app.register_blueprint(customer_bp)
    app.register_blueprint(common_bp)

    # Lightweight global sync-check checkpoint
    @app.route('/api/barang/sync-check', methods=['GET'])
    def sync_check():
        client_sync_time = request.args.get('last_sync', type=float, default=0.0)
        current_server_time = get_mutation_time("barang")
        
        return jsonify({
            "needs_refresh": current_server_time > client_sync_time,
            "server_time": current_server_time
        }), 200

    return app

app = create_app()

if __name__ == "__main__":
    app.run(
        host="127.0.0.1", 
        port=5000, 
        debug=True, 
        threaded=True, 
        use_reloader=False
    )