import secrets

class Config:
    SQLALCHEMY_DATABASE_URI = "sqlite:///journal.db"
  # ✅ SQLite file DB
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'supersecret'  # or your chosen key
