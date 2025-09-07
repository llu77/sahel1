import { requirePermission } from '../utils/permissions';

export async function onRequestGet(context) {
  const { request, env } = context;
  const guard = requirePermission('revenues', 'create');

  const result = await guard(request, env, {
    async next() {
      return new Response(JSON.stringify({ ok: true, action: 'create' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });

  return result;
}
