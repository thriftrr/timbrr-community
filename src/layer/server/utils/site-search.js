// What a visitor's site search asks the studio (docs/search.md in the studio,
// "Public API"), tidied so the same search is always the same address and
// is kept once at the edge: the words trimmed, lowercase and one space apart
// (100 characters), every list sorted, and anything that doesn't look like a
// key or a value dropped. The pop-up and /search send `v=2`; the old Site
// search blocks don't, and get `v=1`, the old shape, from a newer studio.

const KEY = /^[a-z][a-z0-9_]{0,39}$/;
const VALUE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const OWN = new Set(['q', 'v', 'kind', 'sort', 'page', 'per', 'facets', 'limit', 'p', 'collections']);

export const tidyWords = (value) =>
 String(typeof value === 'string' ? value : '')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 100);

const whole = (value, most) => Math.min(most, Math.max(1, Math.round(Number(value)) || 1));
// A parameter given once, many times, or comma-separated, as a sorted list of the ones that pass `test`.
const list = (value, test, most) => [...new Set([value].flat().flatMap((one) => (typeof one === 'string' ? one.split(',') : [])))].filter((one) => test.test(one)).sort().slice(0, most);

// The studio's parameters for a new-shape search, as URLSearchParams.
export function siteSearchParams(asked) {
 const params = new URLSearchParams({ q: tidyWords(asked.q) });
 for (const kind of list(asked.kind, KEY, 20)) params.append('kind', kind);
 const dimensions = Object.keys(asked)
  .filter((key) => KEY.test(key) && !OWN.has(key))
  .sort()
  .slice(0, 10);
 for (const key of dimensions) for (const value of list(asked[key], VALUE, 20)) params.append(key, value);
 if (asked.sort === 'newest') params.set('sort', 'newest');
 params.set('page', String(whole(asked.page, 50)));
 params.set('per', String(whole(asked.per ?? 20, 20)));
 if (asked.facets === 'false') params.set('facets', 'false');
 return params;
}

// The answer to a search too short to send: nothing found, without asking.
export const emptySiteSearch = (q) => ({ query: q, total: 0, page: 1, pages: 1, didYouMean: null, partial: false, hits: [], facets: {} });

// A settled search (`log`) or a result opened from one (`opened`), passed on
// to the studio's POST …/search/<action> as { q }. The studio counts it only
// on sites with Analytics and keeps nothing about the visitor; the visitor's
// address goes along only so its per-visitor limit holds, as with a form.
// Never throws: the browser sent it and forgot it. True when the studio took it.
export const SEARCH_NOTES = ['log', 'opened'];
export async function relaySearchNote({ api, site, action, q, visitor = '', relay = '', fetch = globalThis.fetch }) {
 const words = tidyWords(q);
 if (!SEARCH_NOTES.includes(action) || words.length < 2 || !site || !/^https?:\/\/[^/]/.test(api)) return false;
 try {
  const res = await fetch(`${api}/api/public/sites/${encodeURIComponent(site)}/search/${action}`, {
   method: 'POST',
   headers: { accept: 'application/json', 'content-type': 'application/json', ...(visitor ? { 'x-timbrr-visitor': visitor } : {}), ...(relay ? { 'x-timbrr-relay': relay } : {}) },
   body: JSON.stringify({ q: words }),
   signal: AbortSignal.timeout(5000),
  });
  return res.ok;
 } catch {
  return false;
 }
}
