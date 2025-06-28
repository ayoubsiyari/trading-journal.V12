# routes/auth_routes.py

from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login_user():
    """
    Expect JSON: { "email": "...", "password": "..." }
    If credentials match, returns { token, user: { id, email } }.
    """
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"error": "Must include email and password"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    try:
        pw_matches = check_password_hash(user.password, password)
    except ValueError:
        return jsonify({"error": "Invalid credentials"}), 401

    if not pw_matches:
        return jsonify({"error": "Invalid credentials"}), 401

    # ❗ Make sure to convert user.id to a string here:
    token = create_access_token(identity=str(user.id))

    return jsonify({
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email
        }
    }), 200


@auth_bp.route('/register', methods=['POST'])
def register_user():
    """
    Expect JSON: { "email": "...", "password": "..." }
    Creates a new user.
    """
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"error": "Must include email and password"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already in use"}), 400

    hashed_pw = generate_password_hash(password)

    new_user = User(
        email=email,
        password=hashed_pw,
        profile_image=None
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered"}), 201


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id_str = get_jwt_identity()               # → this is a string
    user_id = int(user_id_str)                     # ← convert it to int
    data = request.get_json()
    user = User.query.get_or_404(user_id)

    if data.get('email'):
        user.email = data['email']
    if data.get('password'):
        user.password = generate_password_hash(data['password'])
    if data.get('profile_image') is not None:
        user.profile_image = data['profile_image']

    db.session.commit()
    return jsonify({
        'msg': 'Profile updated',
        'email': user.email,
        'profile_image': user.profile_image
    }), 200


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id_str = get_jwt_identity()
    user_id = int(user_id_str)
    user = User.query.get_or_404(user_id)
    return jsonify({
        'email': user.email,
        'profile_image': user.profile_image or ""
    }), 200
