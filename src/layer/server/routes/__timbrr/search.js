import { defineEventHandler, getQuery, setResponseHeaders, setResponseStatus } from 'h3';
import { fetchPublished } from '../../utils/studio.js';
import { visitorAddress } from '../../utils/visitor.js';

// /__timbrr/search?q=open&limit=10&p=1: a visitor's search of this site's
// published entries, exactly as the studio's public read API sends it
// (docs/README.md § Collections): { q, results, total, page, pages }, each
// result a title, an address, its collection's name and a few plain words. The
// Site search block asks for it. What was typed is tidied first (trimmed,
// lowercase, one space between words, 100 characters), so the same search
// is the same address and is kept a minute at the edge. Fewer than two
// characters finds nothing without asking. The studio failing is a 502. On
// a dev or staging address it's the working copies, never cached.
// `collections` (keys, comma-separated) keeps it to some collections: kept only when
// every key looks like one, sorted, so the same choice is one address.
//
// A visitor gets SEARCHES a minute; past that it's a 429 until the minute
// is up, and the studio isn't asked.
// shortcut: counted in this isolate's memory, by the address Cloudflare
// says the visitor has, so it's a ceiling for each isolate, not one for the
// whole edge. If a site's search gets hammered, put a Workers rate limit
// binding (or a WAF rate limiting rule on /__timbrr/search) in front.
const SEARCHES = 30;
const windows = new Map(); // visitor → { at, n }
function allowed(visitor) {
 const now = Date.now();
 const held = windows.get(visitor);
 if (!held || now - held.at >= 60_000) {
  if (windows.size > 5000) windows.clear();
  windows.set(visitor, { at: now, n: 1 });
  return true;
 }
 return ++held.n <= SEARCHES;
}

export default defineEventHandler(async (event) => {
 const asked = getQuery(event);
 const q = String(typeof asked.q === 'string' ? asked.q : '')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 100);
 const whole = (value, most) => Math.min(most, Math.max(1, Math.round(Number(value)) || 1));
 const limit = whole(asked.limit ?? 10, 20);
 const p = whole(asked.p, 50);
 const keys = typeof asked.collections === 'string' ? asked.collections.split(',').slice(0, 30) : [];
 const collections = keys.every((key) => /^[a-z][a-z0-9_]{0,39}$/.test(key)) ? [...new Set(keys)].sort().join(',') : '';

 if (!allowed(visitorAddress(event))) {
  setResponseStatus(event, 429);
  setResponseHeaders(event, { 'Cache-Control': 'no-store', 'Retry-After': '60', 'X-Robots-Tag': 'noindex' });
  return { statusCode: 429, message: 'Too many searches. Try again in a minute.' };
 }
 const answer = q.length < 2 ? { status: 200, data: { q, results: [], total: 0, page: 1, pages: 1 } } : await fetchPublished(event, `search?${new URLSearchParams({ q, limit: String(limit), p: String(p), ...(collections ? { collections } : {}) })}`);
 const status = answer.status === 200 ? 200 : answer.status === 404 || answer.status === 401 ? answer.status : 502;
 setResponseHeaders(event, {
  'Cache-Control': status === 502 || event.context.timbrrPreview ? 'no-store' : 'public, max-age=60',
  'X-Robots-Tag': 'noindex',
 });
 if (status === 200) return answer.data;
 setResponseStatus(event, status);
 return status === 404 ? { statusCode: 404, message: "This site has no search." } : { statusCode: status, message: status === 401 ? 'Sign in to see this site.' : "Couldn't search right now. Try again in a minute." };
});
