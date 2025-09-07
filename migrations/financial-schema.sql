-- Financial Database Schema for Cloudflare D1

-- Revenues Table
CREATE TABLE IF NOT EXISTS revenues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    documentNumber TEXT NOT NULL,
    documentType TEXT NOT NULL,
    amount REAL NOT NULL,
    discount REAL DEFAULT 0,
    totalAfterDiscount REAL NOT NULL,
    percentage REAL DEFAULT 0,
    date TEXT NOT NULL,
    paymentMethod TEXT NOT NULL,
    branchRevenue REAL DEFAULT 0,
    departmentRevenue REAL DEFAULT 0,
    notes TEXT,
    mismatchReason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    reason TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Daily Closings Table
CREATE TABLE IF NOT EXISTS daily_closings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    totalRevenue REAL NOT NULL,
    totalExpenses REAL NOT NULL,
    netProfit REAL NOT NULL,
    branchRevenue REAL DEFAULT 0,
    departmentRevenue REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_revenues_date ON revenues(date);
CREATE INDEX IF NOT EXISTS idx_revenues_document ON revenues(documentNumber);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_daily_closings_date ON daily_closings(date);