/* eslint-disable no-console */
const fetch = global.fetch || (await import('node-fetch')).default;

const BASE = 'http://127.0.0.1:8787';

async function login(email, password) {
  const res = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(json)}`);
  }
  return json.token;
}

async function authGet(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

(async () => {
  console.log('— بدء الاختبارات —');

  // 1) Admin
  const adminToken = await login('Admin@g.com', 'Admin1230');
  const adminViewLaban = await authGet('/api/test-branch?branch_id=laban', adminToken);
  const adminViewTuwaiq = await authGet('/api/test-branch?branch_id=tuwaiq', adminToken);
  console.log('Admin view laban:', adminViewLaban.status, adminViewLaban.body);
  console.log('Admin view tuwaiq:', adminViewTuwaiq.status, adminViewTuwaiq.body);

  // 2) Supervisor Tuwaiq
  const supToken = await login('m@g.com', 'Mm12341234');
  const supViewTuwaiq = await authGet('/api/test-branch?branch_id=tuwaiq', supToken);
  const supViewLaban = await authGet('/api/test-branch?branch_id=laban', supToken);
  console.log('Supervisor view tuwaiq (expected 200):', supViewTuwaiq.status, supViewTuwaiq.body);
  console.log('Supervisor view laban (expected 403):', supViewLaban.status, supViewLaban.body);

  // 3) Employee (tuwaiq) try create revenue
  const empToken = await login('mo@g.com', 'Mo12341234');
  const empCreate = await authGet('/api/test-revenue-create', empToken);
  console.log('Employee create revenue (expected 403):', empCreate.status, empCreate.body);

  // 4) Partner try edit revenue
  const partnerToken = await login('Aa@g.com', 'Aa12341234');
  const partnerEdit = await authGet('/api/test-revenue-edit', partnerToken);
  console.log('Partner edit revenue (expected 403):', partnerEdit.status, partnerEdit.body);

  console.log('— انتهاء الاختبارات —');
})().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
