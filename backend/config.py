import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'secretkey')
    SQLALCHEMY_DATABASE_URI = 'sqlite:///journal.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwtsecret')
