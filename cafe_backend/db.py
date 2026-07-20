import mysql.connector
from mysql.connector import pooling
from config import Config

# Connection pool so we don't open/close a raw connection on every request
_pool = pooling.MySQLConnectionPool(
    pool_name="cafe_pool",
    pool_size=10,
    host=Config.DB_HOST,
    port=Config.DB_PORT,
    user=Config.DB_USER,
    password=Config.DB_PASSWORD,
    database=Config.DB_NAME,
    charset='utf8mb4',
    collation='utf8mb4_unicode_ci',
    use_unicode=True,
)


def get_connection():
    """Get a connection from the pool. Caller must close() it (returns it to the pool)."""
    return _pool.get_connection()


def run_query(query, params=None, fetch_one=False, fetch_all=False, commit=False):
    """
    Generic raw-SQL helper.

    - fetch_one: returns a single row (dict) or None
    - fetch_all: returns a list of rows (dicts)
    - commit: for INSERT/UPDATE/DELETE. Returns lastrowid for INSERTs.
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, params or ())

        result = None
        if fetch_one:
            result = cursor.fetchone()
        elif fetch_all:
            result = cursor.fetchall()

        if commit:
            conn.commit()
            result = cursor.lastrowid

        return result
    finally:
        cursor.close()
        conn.close()
