from flask import Blueprint, jsonify, request
from core.sync import MUTATION_STATES
from core.auth import login_required

common_bp = Blueprint('common', __name__)

@common_bp.route('/api/sync-check', methods=['GET'])
@login_required
def global_sync_check():
    """
    Lightweight multi-entity sync gate.
    Frontend passes its localized timestamps to determine what needs a reload.
    """
    return jsonify({
        "status": "success",
        "matrix": MUTATION_STATES
    }), 200

# ==============================================================================
# GLOBAL API ERROR HANDLERS (Forces clean JSON instead of default Flask HTML)
# ==============================================================================

@common_bp.app_errorhandler(404)
def handle_not_found(e):
    return jsonify({
        "status": "error",
        "message": "The requested API endpoint does not exist."
    }), 404

@common_bp.app_errorhandler(405)
def handle_method_not_allowed(e):
    return jsonify({
        "status": "error",
        "message": "HTTP method not allowed for this route."
    }), 405

@common_bp.app_errorhandler(500)
def handle_internal_server_error(e):
    return jsonify({
        "status": "error",
        "message": "An internal server error occurred. Check backend logs."
    }), 500