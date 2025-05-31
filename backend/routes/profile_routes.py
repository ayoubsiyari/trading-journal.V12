# backend/routes/profile_routes.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()
profile_bp = Blueprint('profile', __name__)


@profile_bp.route('', methods=['GET'])
@jwt_required()
def get_profile():
    """
    Returns the current user's profile: email and profile_image URL.
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "email": user.email,
        "profile_image": user.profile_image or ""
    }), 200


@profile_bp.route('', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Accepts JSON payload with:
      - email         (string, required)
      - password      (string, optional: if provided, re-hash and update)
      - profile_image (string URL, optional)
    Updates the current user's record.
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}

    # 1. Validate new email (must be unique if changed)
    new_email = data.get("email", "").strip().lower()
    if not new_email:
        return jsonify({"error": "Email is required"}), 400

    if new_email != user.email:
        # Ensure no other user has this email
        if User.query.filter_by(email=new_email).first():
            return jsonify({"error": "That email is already in use"}), 400
        user.email = new_email

    # 2. If password provided, re-hash and update
    new_password = data.get("password", "").strip()
    if new_password:
        # (you might enforce length/strength here)
        hashed = bcrypt.generate_password_hash(new_password).decode('utf-8')
        user.password = hashed

    # 3. If profile_image provided, store it (just a URL string for now)
    new_image = data.get("profile_image", "").strip()
    if new_image:
        user.profile_image = new_image

    db.session.commit()
    return jsonify({"msg": "Profile updated successfully"}), 200
