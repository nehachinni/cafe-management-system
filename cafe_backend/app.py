from flask import Flask, jsonify
from flask_cors import CORS
from config import Config

from routes.auth_routes import auth_bp
from routes.categories_routes import categories_bp
from routes.menu_routes import menu_bp
from routes.tables_routes import tables_bp
from routes.orders_routes import orders_bp
from routes.billing_routes import billing_bp
from routes.payment_routes import payment_bp
from routes.employees_routes import employees_bp
from routes.reports_routes import reports_bp
from routes.settings_routes import settings_bp
from routes.dashboard_routes import dashboard_bp

app = Flask(__name__)

# Allow the React (Vite) frontend to call this API.
# During development this allows all origins; restrict in production.
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.register_blueprint(auth_bp)
app.register_blueprint(categories_bp)
app.register_blueprint(menu_bp)
app.register_blueprint(tables_bp)
app.register_blueprint(orders_bp)
app.register_blueprint(billing_bp)
app.register_blueprint(payment_bp)
app.register_blueprint(employees_bp)
app.register_blueprint(reports_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(dashboard_bp)


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'success': True, 'message': 'Cafe Management API is running'}), 200


@app.errorhandler(404)
def not_found(e):
    return jsonify({'success': False, 'message': 'Endpoint not found'}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({'success': False, 'message': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(debug=Config.FLASK_DEBUG, port=Config.FLASK_PORT)
