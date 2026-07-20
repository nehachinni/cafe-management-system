from flask import Blueprint, request, jsonify
from db import get_connection
from utils.decorators import token_required

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')


@reports_bp.route('/sales', methods=['GET'])
@token_required
def sales_report():
    """Query params: start_date, end_date (YYYY-MM-DD)"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = '''
            SELECT DATE(created_at) AS date, DAYNAME(created_at) AS day,
                   COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue,
                   COALESCE(AVG(total), 0) AS avg_order
            FROM orders
            WHERE status != 'cancelled'
        '''
        params = []
        if start_date:
            query += ' AND DATE(created_at) >= %s'
            params.append(start_date)
        if end_date:
            query += ' AND DATE(created_at) <= %s'
            params.append(end_date)
        query += ' GROUP BY DATE(created_at), DAYNAME(created_at) ORDER BY DATE(created_at) DESC'

        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        for r in rows:
            r['revenue'] = float(r['revenue'])
            r['avg_order'] = float(r['avg_order'])
            r['date'] = r['date'].isoformat()

        return jsonify({'success': True, 'data': rows}), 200
    finally:
        cursor.close()
        conn.close()


@reports_bp.route('/top-items', methods=['GET'])
@token_required
def top_selling_items():
    limit = request.args.get('limit', 10)
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute('''
            SELECT oi.item_name, SUM(oi.quantity) AS total_quantity, SUM(oi.subtotal) AS total_revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled'
            GROUP BY oi.item_name
            ORDER BY total_quantity DESC
            LIMIT %s
        ''', (int(limit),))
        rows = cursor.fetchall()
        for r in rows:
            r['total_revenue'] = float(r['total_revenue'])

        return jsonify({'success': True, 'data': rows}), 200
    finally:
        cursor.close()
        conn.close()


@reports_bp.route('/bill-history', methods=['GET'])
@token_required
def bill_history():
    """Bill History tab - list of invoices with search/date filters."""
    search = request.args.get('search', '')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = '''
            SELECT i.id, i.invoice_number, i.subtotal, i.tax, i.discount, i.total,
                   i.payment_status, i.created_at,
                   o.order_type, o.customer_name,
                   t.table_number,
                   u.full_name AS cashier,
                   (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
                   (SELECT p.method FROM payments p WHERE p.invoice_id = i.id ORDER BY p.paid_at DESC LIMIT 1) AS payment_method
            FROM invoices i
            JOIN orders o ON i.order_id = o.id
            LEFT JOIN cafe_tables t ON o.table_id = t.id
            LEFT JOIN users u ON o.created_by = u.id
            WHERE (i.invoice_number LIKE %s OR o.customer_name LIKE %s OR u.full_name LIKE %s)
        '''
        params = [f'%{search}%', f'%{search}%', f'%{search}%']
        if start_date:
            query += ' AND DATE(i.created_at) >= %s'
            params.append(start_date)
        if end_date:
            query += ' AND DATE(i.created_at) <= %s'
            params.append(end_date)
        query += ' ORDER BY i.created_at DESC'

        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        for r in rows:
            r['subtotal'] = float(r['subtotal'])
            r['tax'] = float(r['tax'])
            r['discount'] = float(r['discount'])
            r['total'] = float(r['total'])
            r['item_count'] = int(r['item_count'])

        return jsonify({'success': True, 'data': rows}), 200
    finally:
        cursor.close()
        conn.close()


@reports_bp.route('/monthly-sales', methods=['GET'])
@token_required
def monthly_sales_report():
    """Monthly Sales tab - grouped by month for the selected/current year."""
    year = request.args.get('year')
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = '''
            SELECT MONTH(created_at) AS month_num, MONTHNAME(created_at) AS month,
                   COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
            FROM orders
            WHERE status != 'cancelled'
        '''
        params = []
        if year:
            query += ' AND YEAR(created_at) = %s'
            params.append(year)
        else:
            query += ' AND YEAR(created_at) = YEAR(CURDATE())'
        query += ' GROUP BY MONTH(created_at), MONTHNAME(created_at) ORDER BY MONTH(created_at) ASC'

        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        for r in rows:
            r['revenue'] = float(r['revenue'])

        return jsonify({'success': True, 'data': rows}), 200
    finally:
        cursor.close()
        conn.close()
@token_required
def category_wise_sales():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute('''
            SELECT c.name AS category, SUM(oi.subtotal) AS revenue, SUM(oi.quantity) AS quantity
            FROM order_items oi
            JOIN menu_items m ON oi.menu_item_id = m.id
            JOIN categories c ON m.category_id = c.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled'
            GROUP BY c.name
            ORDER BY revenue DESC
        ''')
        rows = cursor.fetchall()
        for r in rows:
            r['revenue'] = float(r['revenue'])

        return jsonify({'success': True, 'data': rows}), 200
    finally:
        cursor.close()
        conn.close()
