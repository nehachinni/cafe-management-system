-- ============================================================
-- Cafe Management System - Database Schema
-- Import this file in phpMyAdmin (XAMPP) to create the database
-- ============================================================

CREATE DATABASE IF NOT EXISTS cafe_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cafe_management;

-- ---------------------------------------------------------
-- Users (Admin / Manager / Staff / Employees / Login)
-- ---------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(30) NOT NULL DEFAULT 'staff',
    salary DECIMAL(10,2) DEFAULT 0,
    joining_date DATE,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- Categories
-- ---------------------------------------------------------
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- Menu Items
-- ---------------------------------------------------------
CREATE TABLE menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    gst_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    image_url VARCHAR(255),
    status ENUM('available', 'unavailable') NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------
-- Tables (dine-in tables)
-- ---------------------------------------------------------
CREATE TABLE cafe_tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_number VARCHAR(20) NOT NULL UNIQUE,
    capacity INT NOT NULL DEFAULT 2,
    location VARCHAR(30) NOT NULL DEFAULT 'Indoor',
    status ENUM('available', 'occupied', 'reserved') NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- Orders
-- ---------------------------------------------------------
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(30) NOT NULL UNIQUE,
    table_id INT NULL,
    order_type ENUM('dine-in', 'takeaway', 'delivery') NOT NULL DEFAULT 'dine-in',
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    status ENUM('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES cafe_tables(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------
-- Order Items
-- ---------------------------------------------------------
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NULL,
    item_name VARCHAR(150) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------
-- Invoices / Billing
-- ---------------------------------------------------------
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    invoice_number VARCHAR(30) NOT NULL UNIQUE,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_status ENUM('unpaid', 'paid', 'partial') NOT NULL DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- Payments
-- ---------------------------------------------------------
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method ENUM('cash', 'card', 'upi', 'online') NOT NULL DEFAULT 'cash',
    status ENUM('success', 'failed', 'pending') NOT NULL DEFAULT 'success',
    transaction_id VARCHAR(100),
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- Settings (cafe name, address, tax rate, currency, etc.)
-- ---------------------------------------------------------
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value MEDIUMTEXT
);

-- ---------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------

-- Default admin login: email=admin@cafe.com  password=admin123
INSERT INTO users (full_name, email, password, phone, role, salary, joining_date, status) VALUES
('Admin User', 'admin@cafe.com', 'scrypt:32768:8:1$50KxXKkiLW3YA2ZC$3c96d422240e45b293845aea40a31376677e976a454bdabec983803ac533f54f9caa13e9f5e8942947602ab14e3fd9e4d4aa749fd4c131883b5436fbe8562bd5', '9999999999', 'Admin', 0, CURDATE(), 'active');

INSERT INTO categories (name, description) VALUES
('Hot Beverages', 'Coffee, Tea, and more'),
('Cold Beverages', 'Smoothies, Cold Coffee'),
('Snacks', 'Light bites and finger food'),
('Main Course', 'Full meals and plates'),
('Desserts', 'Cakes, pastries, ice cream'),
('Sandwiches', 'Freshly made sandwiches');

INSERT INTO menu_items (category_id, name, description, price, gst_rate, status) VALUES
(1, 'Espresso', 'Rich, bold espresso shot', 80.00, 5.00, 'available'),
(1, 'Cappuccino', 'Creamy foam over espresso', 120.00, 5.00, 'available'),
(1, 'Latte', 'Smooth steamed milk with espresso', 130.00, 5.00, 'available'),
(2, 'Cold Brew', 'Slow-steeped cold coffee', 150.00, 5.00, 'available'),
(2, 'Mango Smoothie', 'Fresh mango blended smoothie', 160.00, 5.00, 'available'),
(3, 'Croissant', 'Buttery flaky French pastry', 90.00, 12.00, 'available'),
(6, 'Club Sandwich', 'Classic triple-decker sandwich', 180.00, 12.00, 'available'),
(4, 'Pasta Alfredo', 'Creamy white sauce pasta', 280.00, 12.00, 'unavailable'),
(5, 'Chocolate Cake', 'Rich dark chocolate slice', 120.00, 12.00, 'available'),
(5, 'Cheesecake', 'New York style cheesecake', 140.00, 12.00, 'available'),
(1, 'Masala Chai', 'Spiced Indian tea', 60.00, 5.00, 'available'),
(3, 'Caesar Salad', 'Classic Caesar with croutons', 220.00, 12.00, 'available');

INSERT INTO cafe_tables (table_number, capacity, location, status) VALUES
('T01', 2, 'Indoor', 'available'),
('T02', 4, 'Indoor', 'occupied'),
('T03', 4, 'Indoor', 'available'),
('T04', 6, 'Indoor', 'reserved'),
('T05', 2, 'Outdoor', 'available'),
('T06', 4, 'Outdoor', 'occupied'),
('T07', 8, 'Outdoor', 'available'),
('T08', 2, 'Indoor', 'available'),
('T09', 4, 'Indoor', 'reserved'),
('T10', 6, 'Outdoor', 'occupied');

INSERT INTO settings (setting_key, setting_value) VALUES
('cafe_name', 'Brew & Bite Cafe'),
('address', '123, MG Road, Bengaluru – 560001'),
('gst_number', '29AAABC1234D1Z5'),
('phone', '+91 98765 43210'),
('email', 'info@brewandbite.com'),
('logo_url', '');
