// Checks how the layer serves when it asks the studio, with no build, no
// server and no studio: the host a request names, one call at a time, and
// the edge copies (a day-long copy served while one refresh runs, and when
// the studio is down). fetch, caches.default and the runtime config are
// stand-ins.
//   node layer/scripts/check-serving.mjs
import { registerHooks } from 'node:module';
import { equal, ok } from 'node:assert/strict';

// '#imports' is Nuxt's; here it's just the runtime config on the event.
registerHooks({ resolve: (name, context, next) => (name === '#imports' ? { url: 'data:text/javascript,export const useRuntimeConfig = (e) => e.config;', shortCircuit: true } : next(name, context)) });

const { HOSTED_HOST_HEADER, hostedHost, siteForHost } = await import('../server/utils/hosted.js');
const { passHost } = await import('../server/utils/preview.js');
const { fetchPublished } = await import('../server/utils/studio.js');

const API = 'http://studio.test';
function event(host, headers = {}) {
 const later = [];
 return {
  node: { req: { headers: { host, ...headers }, url: '/', method: 'GET', connection: {} }, res: {} },
  path: '/',
  context: {},
  config: { public: { site: 'north' }, timbrr: { api: API, hosted: true, previewDomain: 'timbrr.app' } },
  later,
  waitUntil: (promise) => later.push(promise),
 };
}

// The studio: counts calls, answers from `pages`, can be down.
const calls = [];
let down = false;
let epoch = 1;
const pages = { '/': 'v1' };
const tick = () => new Promise((done) => setTimeout(done, 5));
globalThis.fetch = async (url) => {
 calls.push(String(url));
 await tick();
 if (down) return new Response('', { status: 503 });
 const { pathname, searchParams } = new URL(url);
 if (pathname.startsWith('/api/public/hosts/')) return decodeURIComponent(pathname.slice(18)) === 'gym.example.com' ? Response.json({ slug: 'north' }) : new Response('', { status: 404 });
 if (pathname.endsWith('/epoch')) return Response.json({ epoch });
 const body = pages[searchParams.get('path')];
 return body ? Response.json({ site: { name: 'North' }, page: { body } }) : new Response('{}', { status: 404 });
};

// The edge: copies by address, each with its max-age honored.
let now = Date.now();
Date.now = () => now;
const edge = new Map();
globalThis.caches = {
 default: {
  async match(url) {
   const kept = edge.get(url);
   return kept && kept.until > now ? new Response(kept.body, { status: kept.status }) : undefined;
  },
  async put(url, res) {
   const age = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control'))?.[1] ?? 0);
   edge.set(url, { body: await res.text(), status: res.status, until: now + age * 1000 });
  },
 },
};

// A visitor's own x-timbrr-hosted-host is ignored; the middleware's counts.
equal(hostedHost(event('gym.example.com', { [HOSTED_HOST_HEADER]: 'other.example.com' })), 'gym.example.com');
const inner = event('localhost');
passHost(inner, HOSTED_HOST_HEADER, 'gym.example.com');
equal(hostedHost(inner), 'gym.example.com');

// Something that can't be a domain never reaches the studio.
calls.length = 0;
equal(await siteForHost(event('x'), 'a'.repeat(16_000) + '.com'), null);
equal(await siteForHost(event('x'), 'localhost'), null);
equal(calls.length, 0);

// A burst on one host is one call; the studio down later leaves the last answer.
const burst = await Promise.all(Array.from({ length: 20 }, () => siteForHost(event('x'), 'gym.example.com')));
ok(burst.every((slug) => slug === 'north'));
equal(calls.length, 1);
now += 61_000;
down = true;
equal(await siteForHost(event('x'), 'gym.example.com'), 'north');
equal(await siteForHost(event('x'), 'never-seen.example.com'), undefined);
down = false;

// A burst on a cold page: one epoch call and one page call.
calls.length = 0;
const cold = await Promise.all(Array.from({ length: 20 }, () => fetchPublished(event('x'), 'page?path=%2F')));
ok(cold.every((answer) => answer.status === 200 && answer.data.page.body === 'v1'));
equal(calls.filter((url) => url.endsWith('/epoch')).length, 1);
equal(calls.filter((url) => url.includes('/page?')).length, 1);

// A publish moves the epoch: the day's copy is served at once, one refresh
// runs after the response, and the next visitor sees the new page.
pages['/'] = 'v2';
epoch = 2;
now += 6_000;
calls.length = 0;
const one = event('x');
const first = await fetchPublished(one, 'page?path=%2F');
equal(first.data.page.body, 'v1');
equal(one.later.length, 1);
await Promise.all(one.later);
equal((await fetchPublished(event('x'), 'page?path=%2F')).data.page.body, 'v2');
equal(calls.filter((url) => url.includes('/page?')).length, 1);

// The studio down for two minutes: the page still shows.
down = true;
now += 120_000;
const out = event('x');
equal((await fetchPublished(out, 'page?path=%2F')).data.page.body, 'v2');
await Promise.all(out.later);
// A page never kept is a 502, as before.
equal((await fetchPublished(event('x'), 'page?path=%2Fnew')).status, 502);
down = false;

// Five seconds of epoch at the edge: a fresh isolate (cleared map) wouldn't
// ask again, which this run can only see as the edge holding the copy.
ok([...edge.keys()].some((url) => url.endsWith('/epoch')));

console.log('check-serving: ok');
