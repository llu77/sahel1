-- إنشاء جدول الفروع
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول الأدوار
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

-- إنشاء جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  branch_id TEXT,
  phone TEXT,
  base_salary DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (role) REFERENCES roles(id)
);

-- إنشاء جدول الصلاحيات
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT
);

-- إنشاء جدول ربط الصلاحيات بالأدوار
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

-- إنشاء جدول سجل الدخول
CREATE TABLE IF NOT EXISTS login_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- إدخال الفروع
INSERT INTO branches (id, name) VALUES 
('laban', 'لبن'),
('tuwaiq', 'طويق');

-- إدخال الأدوار
INSERT INTO roles (id, name, description) VALUES
('admin', 'مدير عام', 'صلاحيات كاملة على كل الفروع'),
('supervisor', 'مشرف', 'إدارة فرع واحد'),
('employee', 'موظف', 'صلاحيات محدودة'),
('partner', 'شريك', 'مشاهدة فقط');

-- إدخال الصلاحيات
INSERT INTO permissions (id, resource, action, description) VALUES
-- إيرادات
('revenues_create', 'revenues', 'create', 'إضافة إيرادات'),
('revenues_view', 'revenues', 'view', 'مشاهدة إيرادات'),
('revenues_edit', 'revenues', 'edit', 'تعديل إيرادات'),
('revenues_delete', 'revenues', 'delete', 'حذف إيرادات'),
-- مصروفات
('expenses_create', 'expenses', 'create', 'إضافة مصروفات'),
('expenses_view', 'expenses', 'view', 'مشاهدة مصروفات'),
('expenses_approve', 'expenses', 'approve', 'موافقة مصروفات'),
-- طلبات
('requests_create', 'requests', 'create', 'إنشاء طلبات'),
('requests_view', 'requests', 'view', 'مشاهدة طلبات'),
('requests_approve', 'requests', 'approve', 'موافقة طلبات'),
-- مسيرات رواتب
('payroll_create', 'payroll', 'create', 'إنشاء مسير رواتب'),
('payroll_view', 'payroll', 'view', 'مشاهدة مسير رواتب'),
('payroll_approve', 'payroll', 'approve', 'موافقة مسير رواتب'),
-- تقارير
('reports_view', 'reports', 'view', 'مشاهدة تقارير'),
('reports_create', 'reports', 'create', 'إنشاء تقارير'),
('reports_export', 'reports', 'export', 'تصدير تقارير'),
-- بونص
('bonus_view', 'bonus', 'view', 'مشاهدة بونص'),
('bonus_create', 'bonus', 'create', 'صرف بونص'),
-- منتجات
('products_request', 'products', 'request', 'طلب منتجات'),
-- طباعة
('print_approved', 'print', 'approved', 'طباعة المستندات المعتمدة'),
-- إدارة المستخدمين
('users_manage', 'users', 'manage', 'إدارة المستخدمين');

-- ربط الصلاحيات بالأدوار
-- Admin - كل الصلاحيات
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'admin', id FROM permissions;

-- Supervisor صلاحيات
INSERT INTO role_permissions (role_id, permission_id) VALUES
('supervisor', 'revenues_create'),
('supervisor', 'revenues_view'),
('supervisor', 'expenses_create'),
('supervisor', 'expenses_view'),
('supervisor', 'requests_create'),
('supervisor', 'requests_view'),
('supervisor', 'payroll_create'),
('supervisor', 'payroll_view'),
('supervisor', 'reports_view'),
('supervisor', 'bonus_view'),
('supervisor', 'products_request'),
('supervisor', 'print_approved');

-- Employee صلاحيات
INSERT INTO role_permissions (role_id, permission_id) VALUES
('employee', 'requests_create'),
('employee', 'payroll_view'),
('employee', 'bonus_view');

-- Partner صلاحيات - مشاهدة فقط
INSERT INTO role_permissions (role_id, permission_id) VALUES
('partner', 'revenues_view'),
('partner', 'expenses_view'),
('partner', 'reports_view'),
('partner', 'payroll_view');

-- إدخال المستخدمين
-- ملاحظة: هذه كلمات المرور المشفرة بـ bcrypt للكلمات المذكورة
INSERT INTO users (email, password_hash, name, role, branch_id) VALUES
-- Admin
('Admin@g.com', '$2b$10$K7L1OvYQ8eKoOH3JZc0zFOAGTqPLbdXPJp3wqKQKhMdRm1YxZyXJa', 'المدير العام', 'admin', NULL),

-- فرع طويق
('m@g.com', '$2b$10$eXamPl3Ha5h3dF0rMm12341234', 'محمد إسماعيل', 'supervisor', 'tuwaiq'),
('mo@g.com', '$2b$10$eXamPl3Ha5h3dF0rMo12341234', 'محمد ناصر', 'employee', 'tuwaiq'),
('fa@g.com', '$2b$10$eXamPl3Ha5h3dF0rFa12341234', 'فارس', 'employee', 'tuwaiq'),
('sa@g.com', '$2b$10$eXamPl3Ha5h3dF0rSa12341234', 'السيد', 'employee', 'tuwaiq'),

-- فرع لبن  
('a@g.com', '$2b$10$eXamPl3Ha5h3dF0rAb12341234', 'عبدالحي جلال', 'supervisor', 'laban'),
('mh@g.com', '$2b$10$eXamPl3Ha5h3dF0rmh12341234', 'محمود عمارة', 'employee', 'laban'),
('sae@g.com', '$2b$10$eXamPl3Ha5h3dF0rSa123412342', 'السيد', 'employee', 'laban'),
('am@g.com', '$2b$10$eXamPl3Ha5h3dF0rAm12341234', 'عمرو', 'employee', 'laban'),

-- الشركاء
('Aa@g.com', '$2b$10$eXamPl3Ha5h3dF0rAa12341234', 'عبدالله المطيري', 'partner', 'laban'),
('Sl@g.com', '$2b$10$eXamPl3Ha5h3dF0rSl12341234', 'سالم الوادعي', 'partner', 'laban'),
('Sa@g.com', '$2b$10$eXamPl3Ha5h3dF0rSa123412343', 'سعود الجريسي', 'partner', 'tuwaiq');

-- إنشاء indexes للأداء
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_login_logs_user ON login_logs(user_id);
