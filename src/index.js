import { onRequestPost as login } from '../functions/api/login';
import { onRequestGet as testBranch } from '../functions/api/test-branch';
import { onRequestGet as testRevenueCreate } from '../functions/api/test-revenue-create';
import { onRequestGet as testRevenueEdit } from '../functions/api/test-revenue-edit';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/login' && request.method === 'POST') {
      return login({ request, env, ctx });
    }
    if (url.pathname === '/api/test-branch' && request.method === 'GET') {
      return testBranch({ request, env, ctx });
    }
    if (url.pathname === '/api/test-revenue-create' && request.method === 'GET') {
      return testRevenueCreate({ request, env, ctx });
    }
    if (url.pathname === '/api/test-revenue-edit' && request.method === 'GET') {
      return testRevenueEdit({ request, env, ctx });
    }

    return new Response('Not Found', { status: 404 });
  }
}
