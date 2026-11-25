// node src/layer/scripts/check-community.mjs — the public layer's routes, up.
// The members pages are the add-on's front door: a 500 there is a visitor who
// cannot sign in, join or see their account (the async-context bug of
// 2026-11-25). This checks the statuses, the sign-in box, and the account's
// redirect, against a running dev server or deployed site.
//
//   BASE=http://localhost:3001 node src/layer/scripts/check-community.mjs
//   BASE=https://yourshop.example node src/layer/scripts/check-community.mjs
const BASE = (process.env.BASE ?? 'http://localhost:3001').replace(/\/$/, '');
const ROUTES = [
  ['/', 200, 'the site home'],
  ['/members', 200, 'the members sign-in'],
  ['/join', 200, 'the plans'],
  ['/account', 302, 'the account (signed out: to /members)'],
];

let failed = 0;
for (const [path, want, what] of ROUTES) {
  let status = 0;
  let body = '';
  try {
    const res = await fetch(`${BASE}${path}`, { redirect: 'manual' });
    status = res.status;
    body = await res.text();
  } catch (error) {
    console.log(`✘ ${path} ${what}: ${error.message}`);
    failed += 1;
    continue;
  }
  const ok = status === want;
  console.log(`${ok ? '✓' : '✘'} ${path} ${status} ${what}`);
  if (!ok) failed += 1;
  if (path === '/members' && status === 200 && !/Sign in|member/i.test(body)) {
    console.log('  ✘ /members answered but has no sign-in box');
    failed += 1;
  }
  if (path === '/account' && status === 302) {
    const location = (await fetch(`${BASE}${path}`, { redirect: 'manual' })).headers.get('location') ?? '';
    console.log(`${location.includes('/members') ? '✓' : '✘'} redirects to ${location || '(none)'}`);
    if (!location.includes('/members')) failed += 1;
  }
}
console.log(failed ? `\n✘ ${failed} problem(s)` : '\n✓ the public layer answers');
process.exit(failed ? 1 : 0);
