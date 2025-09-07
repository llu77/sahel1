import { authenticate } from './auth';

// التحقق من الصلاحية
export function hasPermission(user, resource, action) {
  // Admin له كل الصلاحيات
  if (user.role === 'admin') return true;
  
  // تكوين permission id
  const permissionId = `${resource}_${action}`;
  
  // التحقق من وجود الصلاحية
  return user.permissions && user.permissions.includes(permissionId);
}

// التحقق من عزل الفروع
export function canAccessBranch(user, targetBranchId) {
  // Admin يمكنه الوصول لكل الفروع
  if (user.role === 'admin') return true;
  
  // المستخدمون الآخرون يمكنهم الوصول لفرعهم فقط
  return user.branch_id === targetBranchId;
}

// Middleware للصلاحيات
export function requirePermission(resource, action) {
  return async (request, env, ctx) => {
    const user = await authenticate(request, env);
    
    // التحقق من الصلاحية
    if (!hasPermission(user, resource, action)) {
      return new Response(JSON.stringify({
        error: 'Permission denied',
        required: `${resource}_${action}`
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // التحقق من الفرع إذا كان موجوداً في الطلب
    const url = new URL(request.url);
    const branchId = url.searchParams.get('branch_id');
    
    if (branchId && !canAccessBranch(user, branchId)) {
      return new Response(JSON.stringify({
        error: 'Cannot access this branch',
        userBranch: user.branch_id,
        requestedBranch: branchId
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // تمرير المستخدم للـ handler
    ctx.user = user;
    return ctx.next();
  };
}

// دالة لإضافة branch_id تلقائياً للـ queries
export function addBranchFilter(query, user, params = []) {
  if (user.role === 'admin') {
    return { query, params };
  }
  
  // إضافة WHERE clause أو AND حسب الحاجة
  const hasWhere = query.toLowerCase().includes('where');
  const branchClause = hasWhere 
    ? ' AND branch_id = ?' 
    : ' WHERE branch_id = ?';
  
  return {
    query: query + branchClause,
    params: [...params, user.branch_id]
  };
}
