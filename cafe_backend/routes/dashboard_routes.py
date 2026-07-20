from flask import Blueprint, jsonify, request
from db import get_connection
from utils.decorators import token_required

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


@dashboard_bp.route('/stats', methods=['GET'])
@token_required
def get_stats():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Today's Sales (sum of completed order totals today)
        cursor.execute('''
            SELECT COALESCE(SUM(total), 0) AS value FROM orders
            WHERE DATE(created_at) = CURDATE() AND status != 'cancelled'
        ''')
        todays_sales = cursor.fetchone()['value']

        # Monthly Sales
        cursor.execute('''
            SELECT COALESCE(SUM(total), 0) AS value FROM orders
            WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())
            AND status != 'cancelled'
        ''')
        monthly_sales = cursor.fetchone()['value']

        # Today's Orders count
        cursor.execute('SELECT COUNT(*) AS value FROM orders WHERE DATE(created_at) = CURDATE()')
        todays_orders = cursor.fetchone()['value']

        # Menu items count
        cursor.execute('SELECT COUNT(*) AS value FROM menu_items')
        menu_items_count = cursor.fetchone()['value']

        # Tables breakdown
        cursor.execute('''
            SELECT
                SUM(status = 'available') AS available,
                SUM(status = 'occupied') AS occupied,
                SUM(status = 'reserved') AS reserved,
                COUNT(*) AS total
            FROM cafe_tables
        ''')
        tables = cursor.fetchone()

        # Total revenue (all-time, non-cancelled orders)
        cursor.execute("SELECT COALESCE(SUM(total), 0) AS value FROM orders WHERE status != 'cancelled'")
        total_revenue = cursor.fetchone()['value']

        return jsonify({
            'success': True,
            'data': {
                'todays_sales': float(todays_sales),
                'monthly_sales': float(monthly_sales),
                'todays_orders': todays_orders,
                'menu_items_count': menu_items_count,
                'available_tables': int(tables['available'] or 0),
                'occupied_tables': int(tables['occupied'] or 0),
                'reserved_tables': int(tables['reserved'] or 0),
                'total_tables': int(tables['total'] or 0),
                'total_revenue': float(total_revenue),
            }
        }), 200
    finally:
        cursor.close()
        conn.close()


@dashboard_bp.route('/weekly-sales', methods=['GET'])
@token_required
def weekly_sales():
    """Sales & order count for the last 7 days (for the line chart)."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute('''
            SELECT
                DATE(created_at) AS date,
                DAYNAME(created_at) AS day,
                COALESCE(SUM(total), 0) AS sales,
                COUNT(*) AS orders
            FROM orders
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
              AND status != 'cancelled'
            GROUP BY DATE(created_at), DAYNAME(created_at)
            ORDER BY DATE(created_at) ASC
        ''')
        rows = cursor.fetchall()
        for r in rows:
            r['sales'] = float(r['sales'])
            r['date'] = r['date'].isoformat()

        return jsonify({'success': True, 'data': rows}), 200
    finally:
        cursor.close()
        conn.close()


@dashboard_bp.route('/monthly-revenue', methods=['GET'])
@token_required
def monthly_revenue():
    """Revenue per month for the current year (for the bar chart)."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute('''
            SELECT
                MONTH(created_at) AS month_num,
                MONTHNAME(created_at) AS month,
                COALESCE(SUM(total), 0) AS revenue
            FROM orders
            WHERE YEAR(created_at) = YEAR(CURDATE())
              AND status != 'cancelled'
            GROUP BY MONTH(created_at), MONTHNAME(created_at)
            ORDER BY MONTH(created_at) ASC
        ''')
        rows = cursor.fetchall()
        for r in rows:
            r['revenue'] = float(r['revenue'])

        return jsonify({'success': True, 'data': rows}), 200
    finally:
        cursor.close()
        conn.close()


@dashboard_bp.route('/recent-orders', methods=['GET'])
@token_required
def recent_orders():
    """Recent Orders widget - joins to invoice for bill number when available."""
    limit = request.args.get('limit', 5)
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute('''
            SELECT
                o.id, o.order_number, o.order_type, o.status, o.total, o.created_at,
                t.table_number,
                i.invoice_number
            FROM orders o
            LEFT JOIN cafe_tables t ON o.table_id = t.id
            LEFT JOIN invoices i ON i.order_id = o.id
            ORDER BY o.created_at DESC
            LIMIT %s
        ''', (int(limit),))
        rows = cursor.fetchall()
        for r in rows:
            r['total'] = float(r['total'])
        return jsonify({'success': True, 'data': rows}), 200
    finally:
        cursor.close()
        conn.close()


@dashboard_bp.route('/best-selling', methods=['GET'])
@token_required
def best_selling():
    """Best Selling Items widget - defaults to current month."""
    limit = request.args.get('limit', 5)
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute('''
            SELECT oi.item_name,
                   SUM(oi.quantity) AS units_sold,
                   SUM(oi.subtotal) AS revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled'
              AND MONTH(o.created_at) = MONTH(CURDATE())
              AND YEAR(o.created_at) = YEAR(CURDATE())
            GROUP BY oi.item_name
            ORDER BY units_sold DESC
            LIMIT %s
        ''', (int(limit),))
        rows = cursor.fetchall()
        for r in rows:
            r['revenue'] = float(r['revenue'])
            r['units_sold'] = int(r['units_sold'])
        return jsonify({'success': True, 'data': rows}), 200
    finally:
        cursor.close()
        conn.close()
