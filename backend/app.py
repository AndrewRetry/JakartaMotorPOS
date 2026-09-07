from flask import Flask, jsonify, request
from config import FLASK_DEBUG, SECRET_KEY
from routes.barang import barang_bp
from routes.kategori import kategori_bp
from routes.supplier import supplier_bp
from routes.customer import customer_bp
from routes.common import common_bp
from core.sync import get_mutation_time
from core.auth import login_required
from datetime import timedelta

def create_app():
    app = Flask(__name__)
    
    app.secret_key = SECRET_KEY
    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,   # JavaScript cannot read it (this is the point)
        SESSION_COOKIE_SAMESITE="Lax",  # not sent on cross-site requests -> blocks CSRF
        SESSION_COOKIE_SECURE=not FLASK_DEBUG,  # HTTPS-only outside local development
        PERMANENT_SESSION_LIFETIME=timedelta(hours=12),  # a shop shift; default is 31 days
    )

    # Register modular entity blueprints
    app.register_blueprint(barang_bp)
    app.register_blueprint(kategori_bp)
    app.register_blueprint(supplier_bp)
    app.register_blueprint(customer_bp)
    app.register_blueprint(common_bp)

    # Lightweight global sync-check checkpoint
    @app.route('/api/barang/sync-check', methods=['GET'])
    @login_required
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
        debug=FLASK_DEBUG,
        threaded=True,
        use_reloader=False,
    )