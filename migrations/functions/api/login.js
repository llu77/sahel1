import { verifyPassword, createToken, logLoginAttempt } from '../utils/auth';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { email, password } = await request.json();
    
    // Validation
    if (!email || !password) {
      return Response.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 });
    }
    
    // جلب المستخدم - تطابق غير حساس لحالة الأحرف
    const user = await env.DB.prepare(`
      SELECT * FROM users 
      WHERE lower(email) = lower(?) AND is_active = 1
    `).bind(email).first();
    
    if (!user) {
      // سجل محاولة فاشلة
      await logLoginAttempt(
        env.DB, 
        null, 
        request.headers.get('CF-Connecting-IP'), 
        request.headers.get('User-Agent'),
        false
      );
      
      return Response.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }
    
    // التحقق من كلمة المرور
    const validPassword = await verifyPassword(password, user.password_hash);
    
    if (!validPassword) {
      // سجل محاولة فاشلة
      await logLoginAttempt(
        env.DB,
        user.id,
        request.headers.get('CF-Connecting-IP'),
        request.headers.get('User-Agent'),
        false
      );
      
      return Response.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }
    
    // سجل دخول ناجح
    await logLoginAttempt(
      env.DB,
      user.id,
      request.headers.get('CF-Connecting-IP'),
      request.headers.get('User-Agent'),
      true
    );
    
    // تحديث آخر دخول
    await env.DB.prepare(`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(user.id).run();
    
    // إنشاء token
    const token = await createToken(user, env);
    
    // جلب صلاحيات المستخدم
    const permissions = await env.DB.prepare(`
      SELECT permission_id 
      FROM role_permissions 
      WHERE role_id = ?
    `).bind(user.role).all();
    
    // إرجاع البيانات
    return Response.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        branchId: user.branch_id,
        permissions: permissions.results.map(p => p.permission_id)
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({
      success: false,
      error: 'An error occurred during login'
    }, { status: 500 });
  }
}
