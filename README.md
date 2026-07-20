# Brew & Bite - Cafe Management Backend

Flask + **raw SQL** (no SQLAlchemy/ORM) backend for your React (Vite) cafe management frontend, built to run against **XAMPP's MySQL**.

## 1. Setup XAMPP / MySQL

1. Open **XAMPP Control Panel** → Start **MySQL** (and Apache if you want phpMyAdmin).
2. Open **phpMyAdmin** (`http://localhost/phpmyadmin`).
3. Click **Import** → choose `schema.sql` from this project → Go.
   This creates the `cafe_management` database with all tables and seed data (categories, menu items, tables matching your UI). phpMyAdmin handles the character encoding automatically.
4. Note the port MySQL is running on in XAMPP (Control Panel → MySQL → Admin, or check `xampp/mysql/bin/my.ini` for `port=`). Default is `3306`. If you changed it (e.g. to `3307` because Skype/another app used 3306), note that number.

## 2. Setup Python backend

```bash
cd cafe_backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
```

Copy `.env.example` to `.env` and edit the DB settings to match your XAMPP setup:

```
DB_HOST=127.0.0.1
DB_PORT=3306          # or 3307 if that's what your XAMPP uses
DB_USER=root
DB_PASSWORD=           # usually blank for XAMPP by default
DB_NAME=cafe_management
JWT_SECRET=change_this_to_something_random
```

Run the server:

```bash
python app.py
```

API will be live at `http://127.0.0.1:5000`. Test it: `http://127.0.0.1:5000/api/health`

## 3. Connect your React frontend

In your frontend's `src/services/api.js`, point the base URL at `http://127.0.0.1:5000/api`, and send the JWT token (returned from login) as a header on every request:

```js
Authorization: Bearer <token>
```

Store the token from the login response (e.g. in `useAuth.jsx`) and attach it to all API calls. CORS is already enabled on the backend for all origins during development.

## 4. First login

Demo admin account is seeded for you:

```
Email: admin@cafe.com
Password: admin123
```

(matches the demo credentials shown on your login screen). You can also register additional staff/cashier accounts via `POST /api/auth/register` or the Employees page once wired up.

## Project structure

```
cafe_backend/
├── app.py                 # Flask entry point, registers all routes
├── config.py               # Reads .env
├── db.py                   # Raw SQL connection pool + run_query() helper
├── schema.sql               # Import this into phpMyAdmin
├── requirements.txt
├── .env.example
├── utils/
│   └── decorators.py       # @token_required, @role_required (JWT)
└── routes/
    ├── auth_routes.py       # register, login, /me
    ├── dashboard_routes.py  # stats, weekly-sales, monthly-revenue
    ├── categories_routes.py
    ├── menu_routes.py
    ├── tables_routes.py
    ├── orders_routes.py     # order creation computes GST/total server-side
    ├── billing_routes.py    # invoice generation from an order
    ├── payment_routes.py    # record payments against an invoice
    ├── employees_routes.py
    ├── reports_routes.py
    └── settings_routes.py
```

## API Reference

All endpoints (except `/api/auth/register` and `/api/auth/login`) require:
`Authorization: Bearer <token>`

### Auth
| Method | Endpoint | Body |
|---|---|---|
| POST | `/api/auth/register` | `full_name, email, password, phone?, role?` |
| POST | `/api/auth/login` | `email, password` |
| GET | `/api/auth/me` | — |

### Dashboard
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/dashboard/stats` | today's sales, monthly sales, today's orders, menu item count, table breakdown, total revenue |
| GET | `/api/dashboard/weekly-sales` | last 7 days — for the line chart |
| GET | `/api/dashboard/monthly-revenue` | current year, per month — for the bar chart |
| GET | `/api/dashboard/recent-orders?limit=` | for the "Recent Orders" table |
| GET | `/api/dashboard/best-selling?limit=` | for the "Best Selling Items" widget (current month) |

### Categories
| Method | Endpoint |
|---|---|
| GET | `/api/categories` (returns `item_count` per category) |
| GET | `/api/categories/<id>` |
| POST | `/api/categories` — `name, description?, status?` |
| PUT | `/api/categories/<id>` |
| DELETE | `/api/categories/<id>` |

### Menu
| Method | Endpoint |
|---|---|
| GET | `/api/menu?search=&category_id=` |
| GET | `/api/menu/<id>` |
| POST | `/api/menu` — `name, price, category_id?, description?, gst_rate?, image_url?, status?` |
| PUT | `/api/menu/<id>` |
| DELETE | `/api/menu/<id>` |

### Tables
| Method | Endpoint |
|---|---|
| GET | `/api/tables?status=` |
| GET | `/api/tables/summary` — `{available, occupied, reserved, total}` counts for the top cards |
| POST | `/api/tables` — `table_number, capacity?, location? (indoor/outdoor), status?` |
| PUT | `/api/tables/<id>` |
| PATCH | `/api/tables/<id>/status` — quick status change from the dropdown on each table card |
| DELETE | `/api/tables/<id>` |

### Orders
| Method | Endpoint |
|---|---|
| GET | `/api/orders?status=&order_type=` |
| GET | `/api/orders/<id>` |
| POST | `/api/orders` — `table_id?, order_type, customer_name?, customer_phone?, discount?, items: [{menu_item_id, quantity}]`. Price/GST/total computed server-side; auto-marks table `occupied` for dine-in. |
| PATCH | `/api/orders/<id>/status` — `status: pending\|preparing\|ready\|served\|completed\|cancelled`. Frees the table on `completed`/`cancelled`. |
| DELETE | `/api/orders/<id>` |

### Billing
| Method | Endpoint |
|---|---|
| GET | `/api/billing?payment_status=` |
| GET | `/api/billing/<id>` (includes items + payments) |
| POST | `/api/billing/generate/<order_id>` — generates an invoice from an order |
| PATCH | `/api/billing/<id>/status` — `payment_status: unpaid\|paid\|partial` |

### Payments
| Method | Endpoint |
|---|---|
| GET | `/api/payments` |
| POST | `/api/payments` — `invoice_id, amount, method?, transaction_id?`. Auto-updates invoice to `paid`/`partial`. |

### Employees
| Method | Endpoint |
|---|---|
| GET | `/api/employees?search=&role=` |
| GET | `/api/employees/<id>` |
| POST | `/api/employees` — `full_name, email, password, phone?, role?, salary?, joining_date?` |
| PUT | `/api/employees/<id>` |
| DELETE | `/api/employees/<id>` |

### Reports
| Method | Endpoint |
|---|---|
| GET | `/api/reports/sales?start_date=&end_date=` — daily, includes `avg_order` |
| GET | `/api/reports/monthly-sales?year=` |
| GET | `/api/reports/top-items?limit=` |
| GET | `/api/reports/category-wise` |
| GET | `/api/reports/bill-history?search=&start_date=&end_date=` |

### Settings
| Method | Endpoint |
|---|---|
| GET | `/api/settings` — returns key/value object |
| PUT | `/api/settings` — accepts any `{key: value}` pairs (cafe_name, address, tax_rate, currency, etc.) |

## Notes

- **No ORM used** — every query in `routes/*.py` is raw SQL executed through `mysql-connector-python`, via the shared connection pool in `db.py`.
- **Every write the frontend makes goes straight to MySQL** — there is no mock/dummy layer on the backend, so once the frontend's `api.js`/`useAuth.jsx` point here, dashboard, categories, menu, orders, etc. will reflect real database state immediately.
- Menu items carry their own **`gst_rate`** (matches the per-product "GST 5%/12%" badges in your UI) — order totals are computed by summing each line's own GST, not one flat rate.
- Passwords are hashed with Werkzeug's `generate_password_hash`/`check_password_hash` — never stored in plain text.
- This was smoke-tested end-to-end locally (schema import, register, login, category/menu fetch with correct item counts, order creation with correct GST math, invoice generation, and table auto-occupy) before being handed to you.
