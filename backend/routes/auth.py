import os
from flask import Blueprint, request, jsonify, session
from supabase import create_client, Client, AuthError

# Initialize the Authentication Blueprint
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = payload.get("password", "")
    
    if not email or not password:
        return jsonify({
            "status": "error",
            "message": "Email dan password wajib diisi"
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
                "message": "Email atau Password salah"
            }), 401
        
        profile = (client.table("profiles").select("full_name, role")
               .eq("id", result.user.id).limit(1).execute())
        
        if not profile.data:
            return jsonify({
                "status": "error",
                "message": "Akun belum memiliki profil"
            }), 403
        
        session.clear()
        # Drop prev. session before establishing new one
        session_permanent = True
        session["user_id"] = result.user.id
        session["role"] = profile.data[0]["role"]
        
        return jsonify({
            "user": {
                "email": email,
                **profile.data[0]
            }
        }), 200