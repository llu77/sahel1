-- إدخال المستخدمين الأساسيين
INSERT INTO users (name, email, password, role, branch, permissions, title, phone, isActive) VALUES
('مدير النظام', 'admin@sahl.com', '$2b$10$bsPg9fQikp82Cml3l3YSau.497757oir1wx.GuakTG42f6WFWMiGG', 'admin', 'headquarters', '{"canViewRevenues":true,"canEditRevenues":true,"canViewExpenses":true,"canEditExpenses":true,"canViewBonus":true,"canEditBonus":true,"canViewReports":true,"canManageUsers":true,"canManageRequests":true,"canCreateRequests":true,"canApproveRequests":true,"canManageProducts":true}', 'مدير عام', '0501234567', 1),
('عبدالحي جلال', 'abdulhai@sahl.com', '$2b$10$O4OMxCeejzSQsXzztTZUKehctpgS/y2bVc.uUfKkzgODIfkpvUH.i', 'manager', 'laban', '{"canViewRevenues":true,"canEditRevenues":true,"canViewExpenses":true,"canEditExpenses":false,"canViewBonus":true,"canEditBonus":false,"canViewReports":true,"canManageUsers":false,"canManageRequests":true,"canCreateRequests":true,"canApproveRequests":false,"canManageProducts":true}', 'مشرف', '', 1),
('محمود عمارة', 'mahmoud@sahl.com', '$2b$10$O4OMxCeejzSQsXzztTZUKehctpgS/y2bVc.uUfKkzgODIfkpvUH.i', 'employee', 'laban', '{"canViewRevenues":true,"canEditRevenues":false,"canViewExpenses":true,"canEditExpenses":false,"canViewBonus":false,"canEditBonus":false,"canViewReports":false,"canManageUsers":false,"canManageRequests":false,"canCreateRequests":true,"canApproveRequests":false,"canManageProducts":false}', 'موظف مبيعات', '', 1),
('علاء ناصر', 'alaa@sahl.com', '$2b$10$O4OMxCeejzSQsXzztTZUKehctpgS/y2bVc.uUfKkzgODIfkpvUH.i', 'employee', 'laban', '{"canViewRevenues":true,"canEditRevenues":false,"canViewExpenses":true,"canEditExpenses":false,"canViewBonus":false,"canEditBonus":false,"canViewReports":false,"canManageUsers":false,"canManageRequests":false,"canCreateRequests":true,"canApproveRequests":false,"canManageProducts":false}', 'موظف مبيعات', '', 1),
('السيد', 'alsayed@sahl.com', '$2b$10$O4OMxCeejzSQsXzztTZUKehctpgS/y2bVc.uUfKkzgODIfkpvUH.i', 'manager', 'both', '{"canViewRevenues":true,"canEditRevenues":true,"canViewExpenses":true,"canEditExpenses":false,"canViewBonus":true,"canEditBonus":false,"canViewReports":true,"canManageUsers":false,"canManageRequests":true,"canCreateRequests":true,"canApproveRequests":true,"canManageProducts":true}', 'مدير فرع', '', 1),
('محمد إسماعيل', 'mohamed.ismail@sahl.com', '$2b$10$O4OMxCeejzSQsXzztTZUKehctpgS/y2bVc.uUfKkzgODIfkpvUH.i', 'employee', 'tuwaiq', '{"canViewRevenues":true,"canEditRevenues":false,"canViewExpenses":true,"canEditExpenses":false,"canViewBonus":false,"canEditBonus":false,"canViewReports":false,"canManageUsers":false,"canManageRequests":false,"canCreateRequests":true,"canApproveRequests":false,"canManageProducts":false}', 'موظف مبيعات', '', 1),
('محمد ناصر', 'mohamed.nasser@sahl.com', '$2b$10$O4OMxCeejzSQsXzztTZUKehctpgS/y2bVc.uUfKkzgODIfkpvUH.i', 'employee', 'tuwaiq', '{"canViewRevenues":true,"canEditRevenues":false,"canViewExpenses":true,"canEditExpenses":false,"canViewBonus":false,"canEditBonus":false,"canViewReports":false,"canManageUsers":false,"canManageRequests":false,"canCreateRequests":true,"canApproveRequests":false,"canManageProducts":false}', 'موظف مبيعات', '', 1),
('فارس', 'faris@sahl.com', '$2b$10$O4OMxCeejzSQsXzztTZUKehctpgS/y2bVc.uUfKkzgODIfkpvUH.i', 'employee', 'tuwaiq', '{"canViewRevenues":true,"canEditRevenues":false,"canViewExpenses":true,"canEditExpenses":false,"canViewBonus":false,"canEditBonus":false,"canViewReports":false,"canManageUsers":false,"canManageRequests":false,"canCreateRequests":true,"canApproveRequests":false,"canManageProducts":false}', 'موظف مبيعات', '', 1);

-- إدخال قواعد المكافآت الأساسية
INSERT INTO bonus_rules (name, type, condition_type, condition_value, bonus_type, bonus_value, branch, isActive) VALUES
('مكافأة المبيعات الشهرية', 'sales', 'revenue_target', 100000, 'percentage', 2, NULL, 1),
('مكافأة الأداء المتميز', 'performance', 'rating', 90, 'fixed', 1000, NULL, 1),
('مكافأة تحقيق الهدف الربعي', 'quarterly', 'revenue_target', 300000, 'percentage', 3, NULL, 1),
('مكافأة الحضور الكامل', 'attendance', 'days', 30, 'fixed', 500, NULL, 1),
('مكافأة فرع اللبن', 'branch', 'revenue_target', 80000, 'percentage', 1.5, 'laban', 1),
('مكافأة فرع الطويق', 'branch', 'revenue_target', 70000, 'percentage', 1.5, 'tuwaiq', 1);

-- إدخال بيانات تجريبية للإيرادات
INSERT INTO revenues (documentNumber, documentType, amount, discount, totalAfterDiscount, percentage, date, paymentMethod, branchRevenue, departmentRevenue, branch) VALUES
('REV001', 'فاتورة مبيعات', 5000, 100, 4900, 10, date('now'), 'cash', 4410, 490, 'laban'),
('REV002', 'فاتورة مبيعات', 7500, 0, 7500, 10, date('now'), 'bank', 6750, 750, 'tuwaiq'),
('REV003', 'فاتورة خدمات', 3000, 50, 2950, 10, date('now', '-1 day'), 'cash', 2655, 295, 'laban'),
('REV004', 'فاتورة مبيعات', 10000, 200, 9800, 10, date('now', '-1 day'), 'bank', 8820, 980, 'tuwaiq'),
('REV005', 'فاتورة استشارات', 15000, 0, 15000, 15, date('now', '-2 days'), 'bank', 12750, 2250, 'laban');

-- إدخال بيانات تجريبية للمصروفات
INSERT INTO expenses (receiptNumber, type, amount, date, paymentMethod, branch, description) VALUES
('EXP001', 'رواتب', 50000, date('now'), 'bank', 'both', 'رواتب الموظفين لشهر يناير'),
('EXP002', 'إيجار', 15000, date('now'), 'bank', 'laban', 'إيجار فرع اللبن'),
('EXP003', 'مستلزمات', 3500, date('now', '-1 day'), 'cash', 'tuwaiq', 'مستلزمات مكتبية'),
('EXP004', 'صيانة', 2000, date('now', '-2 days'), 'cash', 'laban', 'صيانة أجهزة الكمبيوتر'),
('EXP005', 'كهرباء', 1800, date('now', '-3 days'), 'bank', 'both', 'فاتورة الكهرباء');

-- إدخال إقفالات يومية تجريبية
INSERT INTO daily_closings (date, branch, actualCash, actualBank, systemCash, systemBank, difference, status, createdBy) VALUES
(date('now'), 'laban', 10000, 25000, 10100, 25000, -100, 'deficit', 'admin@sahl.com'),
(date('now', '-1 day'), 'tuwaiq', 8000, 20000, 8000, 20000, 0, 'balanced', 'admin@sahl.com'),
(date('now', '-2 days'), 'laban', 12000, 30000, 11900, 30000, 100, 'surplus', 'admin@sahl.com');

-- إدخال طلبات تجريبية
INSERT INTO requests (employeeId, employeeName, employeeEmail, branch, type, description, amount, priority, status, notes) VALUES
(3, 'محمود عمارة', 'mahmoud@sahl.com', 'laban', 'إجازة', 'طلب إجازة اضطرارية لمدة 3 أيام', NULL, 'high', 'pending', 'ظروف عائلية طارئة'),
(4, 'علاء ناصر', 'alaa@sahl.com', 'laban', 'سلفة', 'طلب سلفة من الراتب', 5000, 'medium', 'pending', 'احتياج عاجل'),
(6, 'محمد إسماعيل', 'mohamed.ismail@sahl.com', 'tuwaiq', 'تدريب', 'طلب حضور دورة تدريبية في المبيعات', 3000, 'low', 'approved', 'لتطوير المهارات');

-- إدخال طلبات منتجات تجريبية
INSERT INTO product_requests (employeeId, employeeName, employeeEmail, branch, productName, quantity, unit, urgency, reason, status) VALUES
(3, 'محمود عمارة', 'mahmoud@sahl.com', 'laban', 'أوراق طباعة A4', 10, 'رزمة', 'normal', 'نفاذ المخزون', 'pending'),
(7, 'محمد ناصر', 'mohamed.nasser@sahl.com', 'tuwaiq', 'أحبار طابعة', 5, 'علبة', 'urgent', 'الطابعة متوقفة', 'approved'),
(2, 'عبدالحي جلال', 'abdulhai@sahl.com', 'laban', 'أجهزة كمبيوتر', 2, 'جهاز', 'normal', 'لموظفين جدد', 'pending');