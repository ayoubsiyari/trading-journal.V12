from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db
from config import Config
from routes.auth_routes import auth_bp
from routes.journal_routes import journal_bp
from routes.profile_routes import profile_bp  # <-- new
import jwt as pyjwt

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'supersecret'
app.config.from_object(Config)

# JWT setup
jwt = JWTManager(app)

# DB setup
db.init_app(app)

# CORS setup
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Register routes
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(journal_bp, url_prefix='/api/journal')
app.register_blueprint(profile_bp, url_prefix='/api/auth/profile')

@app.route('/')
def home():
    return {"status": "✅ Backend Running"}

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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("✅ Tables created:", db.metadata.tables.keys())
    app.run(debug=True)
