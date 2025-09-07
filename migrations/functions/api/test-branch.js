import { requirePermission } from '../utils/permissions';

export async function onRequestGet(context) {
  const { request, env } = context;
  const guard = requirePermission('revenues', 'view');

  // محاكاة middleware عبر ctx.next
  const result = await guard(request, env, {
    async next() {
      const url = new URL(request.url);
      const branchId = url.searchParams.get('branch_id');
      return new Response(JSON.stringify({ ok: true, branchId }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });

  return result;
}
