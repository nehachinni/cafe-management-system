from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from db import run_query
from utils.decorators import token_required

employees_bp = Blueprint('employees', __name__, url_prefix='/api/employees')


@employees_bp.route('', methods=['GET'])
@token_required
def get_employees():
    search = request.args.get('search', '')
    role = request.args.get('role')

    query = '''SELECT id, full_name, email, phone, role, salary, joining_date, status, created_at
               FROM users WHERE full_name LIKE %s'''
    params = [f'%{search}%']
    if role:
        query += ' AND role = %s'
        params.append(role)
    query += ' ORDER BY created_at DESC'

    rows = run_query(query, tuple(params), fetch_all=True)
    return jsonify({'success': True, 'data': rows}), 200


@employees_bp.route('/<int:emp_id>', methods=['GET'])
@token_required
def get_employee(emp_id):
    row = run_query(
        '''SELECT id, full_name, email, phone, role, salary, joining_date, status, created_at
           FROM users WHERE id = %s''', (emp_id,), fetch_one=True
    )
    if not row:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404
    return jsonify({'success': True, 'data': row}), 200


@employees_bp.route('', methods=['POST'])
@token_required
def create_employee():
    data = request.get_json() or {}
    full_name = data.get('full_name')
    email = data.get('email')
    password = data.get('password') or 'cafe@123'
    phone = data.get('phone', '')
    role = data.get('role', 'staff')
    salary = data.get('salary', 0)
    joining_date = data.get('joining_date')

    if not full_name or not email:
        return jsonify({'success': False, 'message': 'full_name and email are required'}), 400

    existing = run_query('SELECT id FROM users WHERE email = %s', (email,), fetch_one=True)
    if existing:
        return jsonify({'success': False, 'message': 'Email already exists'}), 409

    hashed = generate_password_hash(password)
    new_id = run_query(
        '''INSERT INTO users (full_name, email, password, phone, role, salary, joining_date)
           VALUES (%s, %s, %s, %s, %s, %s, COALESCE(%s, CURDATE()))''',
        (full_name, email, hashed, phone, role, salary, joining_date), commit=True
    )
    return jsonify({'success': True, 'message': 'Employee created', 'id': new_id}), 201


@employees_bp.route('/<int:emp_id>', methods=['PUT'])
@token_required
def update_employee(emp_id):
    data = request.get_json() or {}
    existing = run_query('SELECT id FROM users WHERE id = %s', (emp_id,), fetch_one=True)
    if not existing:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404

    fields = ['full_name', 'phone', 'role', 'salary', 'joining_date', 'status']
    values = [data.get(f) for f in fields]
    set_clause = ', '.join([f'{f} = COALESCE(%s, {f})' for f in fields])

    run_query(f'UPDATE users SET {set_clause} WHERE id = %s', (*values, emp_id), commit=True)

    if data.get('password'):
        hashed = generate_password_hash(data['password'])
        run_query('UPDATE users SET password = %s WHERE id = %s', (hashed, emp_id), commit=True)

    return jsonify({'success': True, 'message': 'Employee updated'}), 200


@employees_bp.route('/<int:emp_id>', methods=['DELETE'])
@token_required
def delete_employee(emp_id):
    existing = run_query('SELECT id FROM users WHERE id = %s', (emp_id,), fetch_one=True)
    if not existing:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404

    run_query('DELETE FROM users WHERE id = %s', (emp_id,), commit=True)
    return jsonify({'success': True, 'message': 'Employee deleted'}), 200
