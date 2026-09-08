"""Login, logout, and current-user endpoints.

These three are deliberately NOT protected by login_required -- someone who
is not yet signed in has to be able to reach them.
"""

from flask import Blueprint, jsonify, request, session
from supabase import AuthError

from core.supabase_client import get_client

auth_bp = Blueprint('auth', __name__)


def _load_profile(client, user_id):
    """Return the profiles row for a user, or None if they have no profile."""
    result = (client.table("profiles")
              .select("full_name, role")
              .eq("id", user_id)
              .limit(1)
              .execute())
    return result.data[0] if result.data else None


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = payload.get("password", "")

    if not email or not password:
        return jsonify({
            "status": "error",
            "message": "Email dan password wajib diisi",
        }), 400

    client = get_client()

    try:
        result = client.auth.sign_in_with_password({
            "email": email,
            "password": password,
        })
    except AuthError:
        return jsonify({
            "status": "error",
            "message": "Email atau password salah",
        }), 401

    profile = _load_profile(client, result.user.id)
    if not profile:
        return jsonify({
            "status": "error",
            "message": "Akun belum memiliki profil",
        }), 403

    session.clear()                 # drop any previous session before granting a new one
    session.permanent = True        # opts into PERMANENT_SESSION_LIFETIME (12 hours)
    session["user_id"] = result.user.id
    session["email"] = email
    session["role"] = profile["role"]
    session["full_name"] = profile["full_name"]

    return jsonify({"user": {"email": email, **profile}}), 200


@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"status": "success"}), 200


@auth_bp.route('/api/auth/me', methods=['GET'])
def me():
    """Who is signed in? The frontend calls this on page load."""
    if "user_id" not in session:
        return jsonify({
            "status": "error",
            "message": "Belum login",
        }), 401

    return jsonify({"user": {
        "email": session.get("email"),
        "full_name": session.get("full_name"),
        "role": session.get("role"),
    }}), 200