# routes/admin_routes.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import generate_password_hash
from models import db, User

admin_bp = Blueprint('admin', __name__)

def is_admin_user():
    """
    Return True if the current JWT has is_admin=True.
    """
    claims = get_jwt()
    return claims.get('is_admin', False)


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    """
    Admin-only: List all users (id, email, is_admin).
    """
    if not is_admin_user():
        return jsonify({"error": "Only admins can view users"}), 403

    users = User.query.order_by(User.id.asc()).all()
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "email": u.email,
            "is_admin": u.is_admin
        })
    return jsonify({"users": result}), 200


@admin_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    """
    Admin-only: Create a new user.
    Expect JSON: { email, password, is_admin (boolean) }
    """
    if not is_admin_user():
        return jsonify({"error": "Only admins can create users"}), 403

    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    is_admin_flag = bool(data.get('is_admin', False))

    if not email or not password:
        return jsonify({"error": "Must include email and password"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already in use"}), 400

    hashed_pw = generate_password_hash(password)
    new_user = User(email=email, password=hashed_pw, is_admin=is_admin_flag)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "message": "User created",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "is_admin": new_user.is_admin
        }
    }), 201


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """
    Admin-only: Delete an existing user by ID.
    """
    if not is_admin_user():
        return jsonify({"error": "Only admins can delete users"}), 403

    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": f"User {user.email} deleted."}), 200
