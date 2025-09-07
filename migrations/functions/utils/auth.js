import bcrypt from 'bcryptjs';
import jwt from '@tsndr/cloudflare-worker-jwt';

// إنشاء JWT token
export async function createToken(user, env) {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    branchId: user.branch_id,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  return await jwt.sign(payload, env.JWT_SECRET);
}

// التحقق من JWT token
export async function verifyToken(token, env) {
  try {
    const isValid = await jwt.verify(token, env.JWT_SECRET);
    if (!isValid) throw new Error('Invalid token');
    
    const decoded = jwt.decode(token);
    return decoded.payload;
  } catch (error) {
    throw new Error('Token verification failed');
  }
}

// التحقق من كلمة المرور
export async function verifyPassword(password, hash) {
  // في production، استخدم bcrypt الحقيقي
  // هنا للتوضيح فقط
  return await bcrypt.compare(password, hash);
}

// Middleware للمصادقة
export async function authenticate(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No token provided');
  }
  
  const payload = await verifyToken(token, env);
  
  // جلب المستخدم من قاعدة البيانات
  const user = await env.DB.prepare(`
    SELECT u.*, GROUP_CONCAT(rp.permission_id) as permissions
    FROM users u
    LEFT JOIN role_permissions rp ON u.role = rp.role_id
    WHERE u.id = ? AND u.is_active = 1
    GROUP BY u.id
  `).bind(payload.userId).first();
  
  if (!user) {
    throw new Error('User not found or inactive');
  }
  
  // تحويل الصلاحيات إلى array
  user.permissions = user.permissions ? user.permissions.split(',') : [];
  
  return user;
}

// سجل محاولات الدخول
export async function logLoginAttempt(db, userId, ip, userAgent, success) {
  await db.prepare(`
    INSERT INTO login_logs (user_id, ip_address, user_agent, success)
    VALUES (?, ?, ?, ?)
  `).bind(userId, ip, userAgent, success).run();
}
