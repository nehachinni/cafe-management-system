import random
import string
import datetime
from flask import Blueprint, request, jsonify
from db import get_connection
from utils.decorators import token_required

orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')


def generate_order_number():
    ts = datetime.datetime.now().strftime('%y%m%d%H%M%S')
    rand = ''.join(random.choices(string.digits, k=3))
    return f'ORD-{ts}{rand}'


@orders_bp.route('', methods=['GET'])
@token_required
def get_orders():
    status = request.args.get('status')
    order_type = request.args.get('order_type')

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = '''
            SELECT o.*, t.table_number
            FROM orders o
            LEFT JOIN cafe_tables t ON o.table_id = t.id
            WHERE 1=1
        '''
        params = []
        if status:
            query += ' AND o.status = %s'
            params.append(status)
        if order_type:
            query += ' AND o.order_type = %s'
            params.append(order_type)
        query += ' ORDER BY o.created_at DESC'

        cursor.execute(query, tuple(params))
        orders = cursor.fetchall()

        # attach items to each order
        for order in orders:
            cursor.execute('SELECT * FROM order_items WHERE order_id = %s', (order['id'],))
            order['items'] = cursor.fetchall()

        return jsonify({'success': True, 'data': orders}), 200
    finally:
        cursor.close()
        conn.close()


@orders_bp.route('/<int:order_id>', methods=['GET'])
@token_required
def get_order(order_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            '''SELECT o.*, t.table_number FROM orders o
               LEFT JOIN cafe_tables t ON o.table_id = t.id WHERE o.id = %s''',
            (order_id,)
        )
        order = cursor.fetchone()
        if not order:
            return jsonify({'success': False, 'message': 'Order not found'}), 404

        cursor.execute('SELECT * FROM order_items WHERE order_id = %s', (order_id,))
        order['items'] = cursor.fetchall()

        return jsonify({'success': True, 'data': order}), 200
    finally:
        cursor.close()
        conn.close()


@orders_bp.route('', methods=['POST'])
@token_required
def create_order():
    """
    Expected payload:
    {
      "table_id": 1,               # optional (null for takeaway/delivery)
      "order_type": "dine-in",     # dine-in | takeaway | delivery
      "customer_name": "John",
      "customer_phone": "9999999999",
      "discount": 0,
      "tax_rate": 5,                # percentage
      "items": [
        {"menu_item_id": 1, "quantity": 2}
      ]
    }
    """
    data = request.get_json() or {}
    items = data.get('items', [])

    if not items:
        return jsonify({'success': False, 'message': 'Order must have at least one item'}), 400

    table_id = data.get('table_id')
    order_type = data.get('order_type', 'dine-in')
    customer_name = data.get('customer_name', '')
    customer_phone = data.get('customer_phone', '')
    discount = float(data.get('discount', 0))

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Fetch menu item details & compute subtotal/tax server-side (never trust client prices)
        subtotal = 0
        tax = 0
        resolved_items = []
        for item in items:
            menu_item_id = item.get('menu_item_id')
            quantity = int(item.get('quantity', 1))

            cursor.execute('SELECT * FROM menu_items WHERE id = %s', (menu_item_id,))
            menu_item = cursor.fetchone()
            if not menu_item:
                return jsonify({'success': False, 'message': f'Menu item {menu_item_id} not found'}), 400

            line_subtotal = float(menu_item['price']) * quantity
            line_tax = round(line_subtotal * (float(menu_item['gst_rate']) / 100), 2)
            subtotal += line_subtotal
            tax += line_tax
            resolved_items.append({
                'menu_item_id': menu_item_id,
                'item_name': menu_item['name'],
                'price': menu_item['price'],
                'quantity': quantity,
                'subtotal': line_subtotal
            })

        tax = round(tax, 2)
        total = round(subtotal + tax - discount, 2)
        order_number = generate_order_number()

        cursor.execute(
            '''INSERT INTO orders
               (order_number, table_id, order_type, customer_name, customer_phone,
                status, subtotal, tax, discount, total, created_by)
               VALUES (%s, %s, %s, %s, %s, 'pending', %s, %s, %s, %s, %s)''',
            (order_number, table_id, order_type, customer_name, customer_phone,
             subtotal, tax, discount, total, request.user['id'])
        )
        order_id = cursor.lastrowid

        for ri in resolved_items:
            cursor.execute(
                '''INSERT INTO order_items (order_id, menu_item_id, item_name, price, quantity, subtotal)
                   VALUES (%s, %s, %s, %s, %s, %s)''',
                (order_id, ri['menu_item_id'], ri['item_name'], ri['price'], ri['quantity'], ri['subtotal'])
            )

        # Mark table occupied if dine-in
        if order_type == 'dine-in' and table_id:
            cursor.execute('UPDATE cafe_tables SET status = %s WHERE id = %s', ('occupied', table_id))

        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Order created',
            'id': order_id,
            'order_number': order_number,
            'total': total
        }), 201
    finally:
        cursor.close()
        conn.close()


@orders_bp.route('/<int:order_id>/status', methods=['PATCH'])
@token_required
def update_order_status(order_id):
    data = request.get_json() or {}
    status = data.get('status')

    valid_statuses = ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled']
    if status not in valid_statuses:
        return jsonify({'success': False, 'message': f'status must be one of {valid_statuses}'}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute('SELECT * FROM orders WHERE id = %s', (order_id,))
        order = cursor.fetchone()
        if not order:
            return jsonify({'success': False, 'message': 'Order not found'}), 404

        cursor.execute('UPDATE orders SET status = %s WHERE id = %s', (status, order_id))

        # Free up the table when order is completed/cancelled
        if status in ('completed', 'cancelled') and order['table_id']:
            cursor.execute('UPDATE cafe_tables SET status = %s WHERE id = %s', ('available', order['table_id']))

        conn.commit()
        return jsonify({'success': True, 'message': 'Order status updated'}), 200
    finally:
        cursor.close()
        conn.close()


@orders_bp.route('/<int:order_id>', methods=['DELETE'])
@token_required
def delete_order(order_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute('SELECT id FROM orders WHERE id = %s', (order_id,))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Order not found'}), 404

        cursor.execute('DELETE FROM orders WHERE id = %s', (order_id,))
        conn.commit()
        return jsonify({'success': True, 'message': 'Order deleted'}), 200
    finally:
        cursor.close()
        conn.close()
