from flask import Blueprint, request, jsonify
from db import run_query
from utils.decorators import token_required

tables_bp = Blueprint('tables', __name__, url_prefix='/api/tables')


@tables_bp.route('', methods=['GET'])
@token_required
def get_tables():
    status = request.args.get('status')
    query = 'SELECT * FROM cafe_tables'
    params = ()
    if status:
        query += ' WHERE status = %s'
        params = (status,)
    query += ' ORDER BY table_number ASC'
    rows = run_query(query, params, fetch_all=True)
    return jsonify({'success': True, 'data': rows}), 200


@tables_bp.route('/summary', methods=['GET'])
@token_required
def get_tables_summary():
    """Counts for the Available / Occupied / Reserved cards at the top of Table Management."""
    row = run_query('''
        SELECT
            SUM(status = 'available') AS available,
            SUM(status = 'occupied') AS occupied,
            SUM(status = 'reserved') AS reserved,
            COUNT(*) AS total
        FROM cafe_tables
    ''', fetch_one=True)
    return jsonify({'success': True, 'data': {
        'available': int(row['available'] or 0),
        'occupied': int(row['occupied'] or 0),
        'reserved': int(row['reserved'] or 0),
        'total': int(row['total'] or 0),
    }}), 200


@tables_bp.route('', methods=['POST'])
@token_required
def create_table():
    data = request.get_json() or {}
    table_number = data.get('table_number')
    capacity = data.get('capacity', 2)
    location = data.get('location', 'Indoor')
    status = data.get('status', 'available')

    if not table_number:
        return jsonify({'success': False, 'message': 'table_number is required'}), 400

    new_id = run_query(
        'INSERT INTO cafe_tables (table_number, capacity, location, status) VALUES (%s, %s, %s, %s)',
        (table_number, capacity, location, status), commit=True
    )
    return jsonify({'success': True, 'message': 'Table created', 'id': new_id}), 201


@tables_bp.route('/<int:table_id>', methods=['PUT'])
@token_required
def update_table(table_id):
    data = request.get_json() or {}
    existing = run_query('SELECT id FROM cafe_tables WHERE id = %s', (table_id,), fetch_one=True)
    if not existing:
        return jsonify({'success': False, 'message': 'Table not found'}), 404

    table_number = data.get('table_number')
    capacity = data.get('capacity')
    location = data.get('location')
    status = data.get('status')

    run_query(
        '''UPDATE cafe_tables SET
           table_number = COALESCE(%s, table_number),
           capacity = COALESCE(%s, capacity),
           location = COALESCE(%s, location),
           status = COALESCE(%s, status)
           WHERE id = %s''',
        (table_number, capacity, location, status, table_id), commit=True
    )
    return jsonify({'success': True, 'message': 'Table updated'}), 200


@tables_bp.route('/<int:table_id>/status', methods=['PATCH'])
@token_required
def update_table_status(table_id):
    """Quick status change - used by the inline dropdown on each table card."""
    data = request.get_json() or {}
    status = data.get('status')

    if status not in ('available', 'occupied', 'reserved'):
        return jsonify({'success': False, 'message': "status must be available, occupied, or reserved"}), 400

    existing = run_query('SELECT id FROM cafe_tables WHERE id = %s', (table_id,), fetch_one=True)
    if not existing:
        return jsonify({'success': False, 'message': 'Table not found'}), 404

    run_query('UPDATE cafe_tables SET status = %s WHERE id = %s', (status, table_id), commit=True)
    return jsonify({'success': True, 'message': 'Table status updated'}), 200


@tables_bp.route('/<int:table_id>', methods=['DELETE'])
@token_required
def delete_table(table_id):
    existing = run_query('SELECT id FROM cafe_tables WHERE id = %s', (table_id,), fetch_one=True)
    if not existing:
        return jsonify({'success': False, 'message': 'Table not found'}), 404

    run_query('DELETE FROM cafe_tables WHERE id = %s', (table_id,), commit=True)
    return jsonify({'success': True, 'message': 'Table deleted'}), 200
