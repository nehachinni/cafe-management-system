import jwt
from functools import wraps
from flask import request, jsonify
from config import Config


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')

        token = None
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'success': False, 'message': 'Token is missing'}), 401

        try:
            payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
            request.user = {
                'id': payload['id'],
                'email': payload['email'],
                'role': payload['role'],
            }
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'message': 'Invalid token'}), 401

        return f(*args, **kwargs)

    return decorated


def role_required(*allowed_roles):
    """Use AFTER @token_required. Example: @role_required('admin', 'manager')"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if request.user.get('role') not in allowed_roles:
                return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator
