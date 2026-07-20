from flask import Blueprint, request, jsonify
from db import run_query
from utils.decorators import token_required

categories_bp = Blueprint('categories', __name__, url_prefix='/api/categories')


@categories_bp.route('', methods=['GET'])
@token_required
def get_categories():
    search = request.args.get('search', '')
    query = '''
        SELECT c.*, COUNT(m.id) AS item_count
        FROM categories c
        LEFT JOIN menu_items m ON m.category_id = c.id
        WHERE c.name LIKE %s
        GROUP BY c.id
        ORDER BY c.created_at DESC
    '''
    rows = run_query(query, (f'%{search}%',), fetch_all=True)
    return jsonify({'success': True, 'data': rows}), 200


@categories_bp.route('/<int:category_id>', methods=['GET'])
@token_required
def get_category(category_id):
    row = run_query('SELECT * FROM categories WHERE id = %s', (category_id,), fetch_one=True)
    if not row:
        return jsonify({'success': False, 'message': 'Category not found'}), 404
    return jsonify({'success': True, 'data': row}), 200


@categories_bp.route('', methods=['POST'])
@token_required
def create_category():
    data = request.get_json() or {}
    name = data.get('name')
    description = data.get('description', '')
    status = data.get('status', 'active')

    if not name:
        return jsonify({'success': False, 'message': 'name is required'}), 400

    new_id = run_query(
        'INSERT INTO categories (name, description, status) VALUES (%s, %s, %s)',
        (name, description, status), commit=True
    )
    return jsonify({'success': True, 'message': 'Category created', 'id': new_id}), 201


@categories_bp.route('/<int:category_id>', methods=['PUT'])
@token_required
def update_category(category_id):
    data = request.get_json() or {}
    existing = run_query('SELECT id FROM categories WHERE id = %s', (category_id,), fetch_one=True)
    if not existing:
        return jsonify({'success': False, 'message': 'Category not found'}), 404

    name = data.get('name')
    description = data.get('description')
    status = data.get('status')

    run_query(
        '''UPDATE categories SET
           name = COALESCE(%s, name),
           description = COALESCE(%s, description),
           status = COALESCE(%s, status)
           WHERE id = %s''',
        (name, description, status, category_id), commit=True
    )
    return jsonify({'success': True, 'message': 'Category updated'}), 200


@categories_bp.route('/<int:category_id>', methods=['DELETE'])
@token_required
def delete_category(category_id):
    existing = run_query('SELECT id FROM categories WHERE id = %s', (category_id,), fetch_one=True)
    if not existing:
        return jsonify({'success': False, 'message': 'Category not found'}), 404

    run_query('DELETE FROM categories WHERE id = %s', (category_id,), commit=True)
    return jsonify({'success': True, 'message': 'Category deleted'}), 200
