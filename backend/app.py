# app.py

from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db
from config import Config

# 1️⃣ Import the Blueprint objects by name:
from routes.auth_routes import auth_bp
from routes.journal_routes import journal_bp
from routes.profile_routes import profile_bp
from routes.admin_routes import admin_bp  # <-- your new admin routes

import jwt as pyjwt

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'supersecret'
app.config.from_object(Config)

# JWT setup
jwt = JWTManager(app)

# DB setup
db.init_app(app)

# CORS setup - Very permissive configuration for development
app.config['CORS_HEADERS'] = 'Content-Type, Authorization'
app.config['CORS_ORIGINS'] = '*'
app.config['CORS_METHODS'] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
app.config['CORS_ALLOW_HEADERS'] = ['Content-Type', 'Authorization', 'X-Requested-With']
app.config['CORS_EXPOSE_HEADERS'] = ['Content-Type', 'X-Total-Count']
app.config['CORS_SUPPORTS_CREDENTIALS'] = True

cors = CORS()
cors.init_app(app, resources={r"/*": {"origins": "*"}})

# Register routes
app.register_blueprint(auth_bp,    url_prefix='/api/auth')
app.register_blueprint(journal_bp, url_prefix='/api/journal')
app.register_blueprint(profile_bp, url_prefix='/api/auth/profile')
app.register_blueprint(admin_bp,   url_prefix='/api/admin')   # ← register admin

@app.route('/', methods=['GET'])
def home():
    return {"status": "✅ Backend Running", "cors_configured": True, "environment": app.config.get('ENV', 'development')}

# JWT error handlers
@jwt.invalid_token_loader
def handle_invalid_token(e):
    print("❌ Invalid token error:", e)
    return jsonify({"error": "Invalid token"}), 422

@jwt.unauthorized_loader
def handle_missing_token(e):
    print("❌ Missing or malformed token")
    return jsonify({"error": "Missing or malformed token"}), 401

@app.route('/debug/verify-token', methods=['POST'])
def debug_verify_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "No token provided"}), 400

    token = auth_header.split(' ')[1]
    secret = app.config.get('JWT_SECRET_KEY')

    try:
        decoded = pyjwt.decode(token, secret, algorithms=["HS256"])
        return jsonify({
            "status": "valid",
            "decoded": decoded,
            "secret_used": secret
        })
    except pyjwt.InvalidSignatureError:
        return jsonify({
            "status": "invalid_signature",
            "secret_used": secret
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        })

@app.before_request
def log_request_info():
    app.logger.debug('Headers: %s', request.headers)
    app.logger.debug('Body: %s', request.get_data())

# Add a catch-all route to handle OPTIONS for all paths
@app.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    response = make_response()
    origin = request.headers.get('Origin', '*')
    response.headers['Access-Control-Allow-Origin'] = origin
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Max-Age'] = '600'
    response.headers['Vary'] = 'Origin'
    return response

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("✅ Tables created:", db.metadata.tables.keys())
    app.run(debug=True, host='0.0.0.0', port=5000)

