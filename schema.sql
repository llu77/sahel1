-- إنشاء جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  branch TEXT,
  permissions TEXT, -- JSON string
  title TEXT,
  phone TEXT,
  avatar TEXT,
  isActive BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول الإيرادات
CREATE TABLE IF NOT EXISTS revenues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  documentNumber TEXT UNIQUE NOT NULL,
  documentType TEXT NOT NULL,
  amount REAL NOT NULL,
  discount REAL DEFAULT 0,
  totalAfterDiscount REAL NOT NULL,
  percentage REAL NOT NULL,
  date DATE NOT NULL,
  paymentMethod TEXT NOT NULL,
  branchRevenue REAL NOT NULL,
  departmentRevenue REAL NOT NULL,
  notes TEXT,
  mismatchReason TEXT,
  branch TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول المصروفات
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receiptNumber TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  date DATE NOT NULL,
  paymentMethod TEXT NOT NULL,
  branch TEXT,
  description TEXT,
  attachments TEXT, -- JSON array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول الإقفالات اليومية
CREATE TABLE IF NOT EXISTS daily_closings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  branch TEXT NOT NULL,
  actualCash REAL NOT NULL,
  actualBank REAL NOT NULL,
  systemCash REAL NOT NULL,
  systemBank REAL NOT NULL,
  difference REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('balanced', 'surplus', 'deficit')),
  notes TEXT,
  createdBy TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, branch)
);

-- إنشاء جدول الطلبات
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employeeId INTEGER NOT NULL,
  employeeName TEXT NOT NULL,
  employeeEmail TEXT NOT NULL,
  branch TEXT,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected')),
  notes TEXT,
  adminNotes TEXT,
  reviewedBy TEXT,
  reviewedAt TIMESTAMP,
  attachments TEXT, -- JSON array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employeeId) REFERENCES users(id)
);

-- إنشاء جدول طلبات المنتجات
CREATE TABLE IF NOT EXISTS product_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employeeId INTEGER NOT NULL,
  employeeName TEXT NOT NULL,
  employeeEmail TEXT NOT NULL,
  branch TEXT,
  productName TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  urgency TEXT DEFAULT 'normal',
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'ordered', 'delivered')),
  notes TEXT,
  adminNotes TEXT,
  reviewedBy TEXT,
  reviewedAt TIMESTAMP,
  deliveredAt TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employeeId) REFERENCES users(id)
);

-- إنشاء جدول المكافآت
CREATE TABLE IF NOT EXISTS bonuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employeeId INTEGER NOT NULL,
  employeeName TEXT NOT NULL,
  branch TEXT,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  reason TEXT,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  approvedBy TEXT,
  approvedAt TIMESTAMP,
  paidAt TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employeeId) REFERENCES users(id),
  UNIQUE(employeeId, month, year, type)
);

-- إنشاء جدول قواعد المكافآت
CREATE TABLE IF NOT EXISTS bonus_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  condition_value REAL NOT NULL,
  bonus_type TEXT NOT NULL,
  bonus_value REAL NOT NULL,
  branch TEXT,
  isActive BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_revenues_date ON revenues(date);
CREATE INDEX IF NOT EXISTS idx_revenues_branch ON revenues(branch);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_branch ON expenses(branch);
CREATE INDEX IF NOT EXISTS idx_daily_closings_date ON daily_closings(date);
CREATE INDEX IF NOT EXISTS idx_daily_closings_branch ON daily_closings(branch);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_employee ON requests(employeeId);
CREATE INDEX IF NOT EXISTS idx_product_requests_status ON product_requests(status);
CREATE INDEX IF NOT EXISTS idx_bonuses_employee ON bonuses(employeeId);
CREATE INDEX IF NOT EXISTS idx_bonuses_month_year ON bonuses(month, year);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch);