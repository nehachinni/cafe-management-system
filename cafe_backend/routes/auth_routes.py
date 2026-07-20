import jwt
import datetime
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from db import run_query
from config import Config
from utils.decorators import token_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    full_name = data.get('full_name')
    email = data.get('email')
    password = data.get('password')
    phone = data.get('phone')
    role = data.get('role', 'staff')

    if not full_name or not email or not password:
        return jsonify({'success': False, 'message': 'full_name, email and password are required'}), 400

    existing = run_query('SELECT id FROM users WHERE email = %s', (email,), fetch_one=True)
    if existing:
        return jsonify({'success': False, 'message': 'Email already registered'}), 409

    hashed = generate_password_hash(password)
    user_id = run_query(
        '''INSERT INTO users (full_name, email, password, phone, role, joining_date)
           VALUES (%s, %s, %s, %s, %s, CURDATE())''',
        (full_name, email, hashed, phone, role),
        commit=True
    )

    return jsonify({'success': True, 'message': 'User registered', 'user_id': user_id}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'success': False, 'message': 'email and password are required'}), 400

    user = run_query('SELECT * FROM users WHERE email = %s', (email,), fetch_one=True)

    if not user or not check_password_hash(user['password'], password):
        return jsonify({'success': False, 'message': 'Invalid email or password'}), 401

    if user['status'] != 'active':
        return jsonify({'success': False, 'message': 'Account is inactive'}), 403

    payload = {
        'id': user['id'],
        'email': user['email'],
        'role': user['role'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=Config.JWT_EXP_HOURS)
    }
    token = jwt.encode(payload, Config.JWT_SECRET, algorithm='HS256')

    user.pop('password', None)

    return jsonify({'success': True, 'token': token, 'user': user}), 200


@auth_bp.route('/me', methods=['GET'])
@token_required
def me():
    user = run_query(
        'SELECT id, full_name, email, phone, role, status, created_at FROM users WHERE id = %s',
        (request.user['id'],), fetch_one=True
    )
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    return jsonify({'success': True, 'user': user}), 200
