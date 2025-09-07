import { requirePermission } from '../utils/permissions';

export async function onRequestGet(context) {
  const { request, env } = context;
  const guard = requirePermission('revenues', 'edit');

  const result = await guard(request, env, {
    async next() {
      return new Response(JSON.stringify({ ok: true, action: 'edit' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });

  return result;
}
