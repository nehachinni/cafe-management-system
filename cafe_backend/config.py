import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
    DB_PORT = int(os.getenv('DB_PORT', '3307'))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'cafe_management')

    JWT_SECRET = os.getenv('JWT_SECRET', 'dev_secret_key')
    JWT_EXP_HOURS = int(os.getenv('JWT_EXP_HOURS', '24'))

    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'
    FLASK_PORT = int(os.getenv('FLASK_PORT', '5000'))
