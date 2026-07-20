from flask import Blueprint, request, jsonify
from db import run_query
from utils.decorators import token_required

menu_bp = Blueprint('menu', __name__, url_prefix='/api/menu')


@menu_bp.route('', methods=['GET'])
@token_required
def get_menu_items():
    search = request.args.get('search', '')
    category_id = request.args.get('category_id')

    query = '''
        SELECT m.*, c.name AS category_name
        FROM menu_items m
        LEFT JOIN categories c ON m.category_id = c.id
        WHERE m.name LIKE %s
    '''
    params = [f'%{search}%']

    if category_id:
        query += ' AND m.category_id = %s'
        params.append(category_id)

    query += ' ORDER BY m.created_at DESC'

    rows = run_query(query, tuple(params), fetch_all=True)
    return jsonify({'success': True, 'data': rows}), 200


@menu_bp.route('/<int:item_id>', methods=['GET'])
@token_required
def get_menu_item(item_id):
    row = run_query(
        '''SELECT m.*, c.name AS category_name FROM menu_items m
           LEFT JOIN categories c ON m.category_id = c.id WHERE m.id = %s''',
        (item_id,), fetch_one=True
    )
    if not row:
        return jsonify({'success': False, 'message': 'Menu item not found'}), 404
    return jsonify({'success': True, 'data': row}), 200


@menu_bp.route('', methods=['POST'])
@token_required
def create_menu_item():
    data = request.get_json() or {}
    name = data.get('name')
    price = data.get('price')
    category_id = data.get('category_id')
    description = data.get('description', '')
    image_url = data.get('image_url', '')
    status = data.get('status', 'available')
    gst_rate = data.get('gst_rate', 5.00)

    if not name or price is None:
        return jsonify({'success': False, 'message': 'name and price are required'}), 400

    new_id = run_query(
        '''INSERT INTO menu_items (category_id, name, description, price, gst_rate, image_url, status)
           VALUES (%s, %s, %s, %s, %s, %s, %s)''',
        (category_id, name, description, price, gst_rate, image_url, status), commit=True
    )
    return jsonify({'success': True, 'message': 'Menu item created', 'id': new_id}), 201


@menu_bp.route('/<int:item_id>', methods=['PUT'])
@token_required
def update_menu_item(item_id):
    data = request.get_json() or {}
    existing = run_query('SELECT id FROM menu_items WHERE id = %s', (item_id,), fetch_one=True)
    if not existing:
        return jsonify({'success': False, 'message': 'Menu item not found'}), 404

    fields = ['category_id', 'name', 'description', 'price', 'gst_rate', 'image_url', 'status']
    values = [data.get(f) for f in fields]

    set_clause = ', '.join([f'{f} = COALESCE(%s, {f})' for f in fields])
    run_query(
        f'UPDATE menu_items SET {set_clause} WHERE id = %s',
        (*values, item_id), commit=True
    )
    return jsonify({'success': True, 'message': 'Menu item updated'}), 200


@menu_bp.route('/<int:item_id>', methods=['DELETE'])
@token_required
def delete_menu_item(item_id):
    existing = run_query('SELECT id FROM menu_items WHERE id = %s', (item_id,), fetch_one=True)
    if not existing:
        return jsonify({'success': False, 'message': 'Menu item not found'}), 404

    run_query('DELETE FROM menu_items WHERE id = %s', (item_id,), commit=True)
    return jsonify({'success': True, 'message': 'Menu item deleted'}), 200
