from flask import Blueprint, request, jsonify
from db import get_connection
from utils.decorators import token_required

payment_bp = Blueprint('payment', __name__, url_prefix='/api/payments')


@payment_bp.route('', methods=['GET'])
@token_required
def get_payments():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute('''
            SELECT p.*, i.invoice_number, i.order_id
            FROM payments p
            JOIN invoices i ON p.invoice_id = i.id
            ORDER BY p.paid_at DESC
        ''')
        rows = cursor.fetchall()
        return jsonify({'success': True, 'data': rows}), 200
    finally:
        cursor.close()
        conn.close()


@payment_bp.route('', methods=['POST'])
@token_required
def create_payment():
    """
    Record a payment against an invoice. Marks the invoice paid/partial
    depending on total amount paid so far.
    """
    data = request.get_json() or {}
    invoice_id = data.get('invoice_id')
    amount = data.get('amount')
    method = data.get('method', 'cash')
    transaction_id = data.get('transaction_id', '')

    if not invoice_id or amount is None:
        return jsonify({'success': False, 'message': 'invoice_id and amount are required'}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute('SELECT * FROM invoices WHERE id = %s', (invoice_id,))
        invoice = cursor.fetchone()
        if not invoice:
            return jsonify({'success': False, 'message': 'Invoice not found'}), 404

        cursor.execute(
            '''INSERT INTO payments (invoice_id, amount, method, status, transaction_id)
               VALUES (%s, %s, %s, 'success', %s)''',
            (invoice_id, amount, method, transaction_id)
        )
        payment_id = cursor.lastrowid

        cursor.execute('SELECT COALESCE(SUM(amount), 0) AS paid FROM payments WHERE invoice_id = %s', (invoice_id,))
        total_paid = float(cursor.fetchone()['paid'])

        new_status = 'paid' if total_paid >= float(invoice['total']) else 'partial'
        cursor.execute('UPDATE invoices SET payment_status = %s WHERE id = %s', (new_status, invoice_id))

        conn.commit()
        return jsonify({
            'success': True,
            'message': 'Payment recorded',
            'id': payment_id,
            'invoice_payment_status': new_status
        }), 201
    finally:
        cursor.close()
        conn.close()
