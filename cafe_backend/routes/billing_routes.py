import random
import string
import datetime
from flask import Blueprint, request, jsonify
from db import get_connection, run_query
from utils.decorators import token_required

billing_bp = Blueprint('billing', __name__, url_prefix='/api/billing')


def generate_invoice_number():
    ts = datetime.datetime.now().strftime('%y%m%d%H%M%S')
    rand = ''.join(random.choices(string.digits, k=3))
    return f'INV-{ts}{rand}'


@billing_bp.route('', methods=['GET'])
@token_required
def get_invoices():
    payment_status = request.args.get('payment_status')
    query = '''
        SELECT i.*, o.order_number, o.order_type, o.customer_name
        FROM invoices i
        JOIN orders o ON i.order_id = o.id
        WHERE 1=1
    '''
    params = []
    if payment_status:
        query += ' AND i.payment_status = %s'
        params.append(payment_status)
    query += ' ORDER BY i.created_at DESC'

    rows = run_query(query, tuple(params), fetch_all=True)
    return jsonify({'success': True, 'data': rows}), 200


@billing_bp.route('/<int:invoice_id>', methods=['GET'])
@token_required
def get_invoice(invoice_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            '''SELECT i.*, o.order_number, o.order_type, o.customer_name, o.customer_phone
               FROM invoices i JOIN orders o ON i.order_id = o.id WHERE i.id = %s''',
            (invoice_id,)
        )
        invoice = cursor.fetchone()
        if not invoice:
            return jsonify({'success': False, 'message': 'Invoice not found'}), 404

        cursor.execute('SELECT * FROM order_items WHERE order_id = %s', (invoice['order_id'],))
        invoice['items'] = cursor.fetchall()

        cursor.execute('SELECT * FROM payments WHERE invoice_id = %s', (invoice_id,))
        invoice['payments'] = cursor.fetchall()

        return jsonify({'success': True, 'data': invoice}), 200
    finally:
        cursor.close()
        conn.close()


@billing_bp.route('/generate/<int:order_id>', methods=['POST'])
@token_required
def generate_invoice(order_id):
    """Generate an invoice from an existing order."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute('SELECT * FROM orders WHERE id = %s', (order_id,))
        order = cursor.fetchone()
        if not order:
            return jsonify({'success': False, 'message': 'Order not found'}), 404

        cursor.execute('SELECT id FROM invoices WHERE order_id = %s', (order_id,))
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'Invoice already exists for this order'}), 409

        invoice_number = generate_invoice_number()
        cursor.execute(
            '''INSERT INTO invoices (order_id, invoice_number, subtotal, tax, discount, total, payment_status)
               VALUES (%s, %s, %s, %s, %s, %s, 'unpaid')''',
            (order_id, invoice_number, order['subtotal'], order['tax'], order['discount'], order['total'])
        )
        invoice_id = cursor.lastrowid
        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Invoice generated',
            'id': invoice_id,
            'invoice_number': invoice_number,
            'total': float(order['total'])
        }), 201
    finally:
        cursor.close()
        conn.close()


@billing_bp.route('/<int:invoice_id>/status', methods=['PATCH'])
@token_required
def update_payment_status(invoice_id):
    data = request.get_json() or {}
    payment_status = data.get('payment_status')

    if payment_status not in ('unpaid', 'paid', 'partial'):
        return jsonify({'success': False, 'message': 'Invalid payment_status'}), 400

    existing = run_query('SELECT id FROM invoices WHERE id = %s', (invoice_id,), fetch_one=True)
    if not existing:
        return jsonify({'success': False, 'message': 'Invoice not found'}), 404

    run_query('UPDATE invoices SET payment_status = %s WHERE id = %s', (payment_status, invoice_id), commit=True)
    return jsonify({'success': True, 'message': 'Payment status updated'}), 200
