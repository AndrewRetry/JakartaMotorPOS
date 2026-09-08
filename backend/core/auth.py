"""Session-based authentication and role checks."""

from functools import wraps
from flask import jsonify, session

OWNER_ROLE = "owner"

def login_required(view):
    # Reject requests without valid session cookie
    @wraps(view)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({
                "status": "error",
                "message": "Silahkan login terlebih dahulu"
            }), 401
        return view(*args, **kwargs)
    return wrapper

def owner_required(view):
    # Reject any request not coming from role: "owner"
    @wraps(view)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({
                "status": "error",
                "message": "Silahkan login terlebih dahulu"
            }), 401
        if session.get("role") != OWNER_ROLE:
            return jsonify({
                "status": "error",
                "message": "Hanya pemilik yang dapat menghapus data"                
            }), 403
        return view(*args, **kwargs)
    return wrapper