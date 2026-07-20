from flask import Blueprint, request, jsonify
from db import run_query
from utils.decorators import token_required

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')


@settings_bp.route('', methods=['GET'])
@token_required
def get_settings():
    rows = run_query('SELECT setting_key, setting_value FROM settings', fetch_all=True)
    settings_dict = {row['setting_key']: row['setting_value'] for row in rows}
    return jsonify({'success': True, 'data': settings_dict}), 200


@settings_bp.route('', methods=['PUT'])
@token_required
def update_settings():
    """Accepts a flat JSON object: { "cafe_name": "...", "tax_rate": "5", ... }"""
    data = request.get_json() or {}

    for key, value in data.items():
        run_query(
            '''INSERT INTO settings (setting_key, setting_value) VALUES (%s, %s)
               ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)''',
            (key, str(value)), commit=True
        )

    return jsonify({'success': True, 'message': 'Settings updated'}), 200
