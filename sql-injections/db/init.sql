# db/init.sql
CREATE DATABASE IF NOT EXISTS ctf_db;
USE ctf_db;

-- Users table for authentication bypass
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(150),
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table for union-based injection
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    category VARCHAR(100),
    stock INT DEFAULT 0
);

-- Orders table for second-order injection
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_name VARCHAR(200),
    quantity INT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Logs table for time-based blind injection
CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255),
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments table for NoSQL-style injection (stored as JSON)
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT,
    author VARCHAR(100),
    content TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flags table (hidden)
CREATE TABLE flags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flag_name VARCHAR(100),
    flag_value VARCHAR(255),
    hint TEXT
);

-- Insert sample data
INSERT INTO users (username, password, email, role) VALUES
('admin', 'admin123', 'admin@ctf.local', 'admin'),
('user1', 'password123', 'user1@ctf.local', 'user'),
('guest', 'guest123', 'guest@ctf.local', 'user'),
('developer', 'dev456', 'dev@ctf.local', 'admin');

INSERT INTO products (name, description, price, category, stock) VALUES
('Laptop', 'High-performance laptop', 999.99, 'Electronics', 10),
('Mouse', 'Wireless mouse', 29.99, 'Electronics', 50),
('Keyboard', 'Mechanical keyboard', 79.99, 'Electronics', 25),
('Monitor', '27-inch 4K monitor', 349.99, 'Electronics', 15),
('Headphones', 'Noise-cancelling headphones', 199.99, 'Electronics', 30);

INSERT INTO orders (user_id, product_name, quantity) VALUES
(1, 'Laptop', 1),
(2, 'Mouse', 2),
(2, 'Keyboard', 1);

INSERT INTO logs (user_id, action, ip_address) VALUES
(1, 'LOGIN', '192.168.1.100'),
(2, 'PURCHASE', '192.168.1.101'),
(1, 'ADMIN_ACCESS', '192.168.1.100');

INSERT INTO comments (post_id, author, content, metadata) VALUES
(1, 'Alice', 'Great product!', '{"rating": 5, "verified": true}'),
(1, 'Bob', 'Could be better', '{"rating": 3, "verified": false}'),
(2, 'Charlie', 'Excellent service', '{"rating": 5, "verified": true}');

-- Insert flags
INSERT INTO flags (flag_name, flag_value, hint) VALUES
('classic_sqli', 'CTF{cl4ss1c_sql_1nj3ct10n_m4st3r}', 'Basic authentication bypass'),
('union_sqli', 'CTF{un10n_s3l3ct_h4ck3r_pr0}', 'Extract data using UNION'),
('blind_sqli', 'CTF{bl1nd_t1m3_b4s3d_n1nj4}', 'Time-based blind injection'),
('second_order', 'CTF{s3c0nd_0rd3r_1nj3ct10n_3xp3rt}', 'Second-order SQL injection'),
('json_sqli', 'CTF{j50n_sql_1nj3ct10n_w1z4rd}', 'JSON-based SQL injection'),
('error_sqli', 'CTF{3rr0r_b4s3d_1nf0rm4t10n_l34k}', 'Error-based information disclosure'),
('master_flag', 'CTF{sql_1nj3ct10n_gr4ndm4st3r_2024}', 'Complete all challenges');

-- Create a user with limited privileges for realistic scenario
CREATE USER 'app_user'@'%' IDENTIFIED BY 'app_password';
GRANT SELECT, INSERT, UPDATE ON ctf_db.* TO 'app_user'@'%';
FLUSH PRIVILEGES;

---