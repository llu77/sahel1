-- Database Schema for GASAH Financial System
-- Symbol AI Co. - All Rights Reserved

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'manager', 'employee')) NOT NULL,
    branch TEXT CHECK(branch IN ('laban', 'tuwaiq')) NOT NULL,
    title TEXT,
    avatar TEXT,
    permissions TEXT, -- JSON string
    active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Revenues table
CREATE TABLE IF NOT EXISTS revenues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_amount REAL NOT NULL,
    cash_amount REAL DEFAULT 0,
    network_amount REAL DEFAULT 0,
    date DATE NOT NULL,
    description TEXT,
    mismatch_reason TEXT,
    employee_contributions TEXT, -- JSON string
    branch TEXT CHECK(branch IN ('laban', 'tuwaiq')) NOT NULL,
    created_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    branch TEXT CHECK(branch IN ('laban', 'tuwaiq')) NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    vendor TEXT,
    invoice_number TEXT,
    approved_by TEXT REFERENCES users(id),
    created_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Product Requests table
CREATE TABLE IF NOT EXISTS product_requests (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    products TEXT NOT NULL, -- JSON string
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'completed')) DEFAULT 'pending',
    request_date DATE NOT NULL,
    employee_name TEXT NOT NULL,
    branch TEXT CHECK(branch IN ('laban', 'tuwaiq')) NOT NULL,
    total_amount REAL NOT NULL,
    notes TEXT,
    admin_notes TEXT,
    approved_by TEXT REFERENCES users(id),
    approved_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Bonus Rules table
CREATE TABLE IF NOT EXISTS bonus_rules (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    employee_name TEXT NOT NULL,
    branch TEXT CHECK(branch IN ('laban', 'tuwaiq')) NOT NULL,
    base_salary REAL NOT NULL,
    sales_target REAL NOT NULL,
    commission_percentage REAL NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK(type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Audit Log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_values TEXT, -- JSON string
    new_values TEXT, -- JSON string
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Sessions table (for authentication)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_revenues_branch_date ON revenues(branch, date);
CREATE INDEX IF NOT EXISTS idx_expenses_branch_date ON expenses(branch, date);
CREATE INDEX IF NOT EXISTS idx_product_requests_status ON product_requests(status);
CREATE INDEX IF NOT EXISTS idx_product_requests_branch ON product_requests(branch);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Insert default admin user (password: admin123 - should be changed immediately)
INSERT OR IGNORE INTO users (id, name, email, password, role, branch, title, permissions, active)
VALUES (
    'admin-001',
    'مدير النظام',
    'admin@gasah.com',
    '$2a$10$YourHashedPasswordHere', -- Replace with actual hashed password
    'admin',
    'laban',
    'مدير عام',
    '{"users": ["create", "read", "update", "delete"], "revenues": ["create", "read", "update", "delete"], "expenses": ["create", "read", "update", "delete"], "reports": ["read"], "requests": ["create", "read", "update", "delete"], "bonus": ["create", "read", "update", "delete"]}',
    true
);

-- Insert initial employees
INSERT OR IGNORE INTO users (name, email, password, role, branch, title, active) VALUES
('عبدالحي جلال', 'abdulhai@gasah.com', '$2a$10$YourHashedPasswordHere', 'manager', 'laban', 'مدير فرع', true),
('محمود عمارة', 'mahmoud@gasah.com', '$2a$10$YourHashedPasswordHere', 'employee', 'laban', 'موظف', true),
('علاء ناصر', 'alaa@gasah.com', '$2a$10$YourHashedPasswordHere', 'employee', 'laban', 'موظف', true),
('محمد إسماعيل', 'mohammed.i@gasah.com', '$2a$10$YourHashedPasswordHere', 'manager', 'tuwaiq', 'مدير فرع', true),
('محمد ناصر', 'mohammed.n@gasah.com', '$2a$10$YourHashedPasswordHere', 'employee', 'tuwaiq', 'موظف', true),
('فارس', 'faris@gasah.com', '$2a$10$YourHashedPasswordHere', 'employee', 'tuwaiq', 'موظف', true);

-- Triggers for updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_revenues_timestamp
AFTER UPDATE ON revenues
BEGIN
    UPDATE revenues SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_expenses_timestamp
AFTER UPDATE ON expenses
BEGIN
    UPDATE expenses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_product_requests_timestamp
AFTER UPDATE ON product_requests
BEGIN
    UPDATE product_requests SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_bonus_rules_timestamp
AFTER UPDATE ON bonus_rules
BEGIN
    UPDATE bonus_rules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;