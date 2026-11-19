import { getRequestURL } from 'h3';
import { useRuntimeConfig } from '#imports';
import { previewToken, studioApi } from './preview.js';

// This site's published pages, from the studio's public read API
// (docs/manifest.md § 6). Only the site's own server asks (/__timbrr/page,
// /sitemap.xml); the browser only ever talks to the site. Each answer is
// kept for a minute at the edge (Cloudflare's caches.default, in the data
// center that asked), so a page published in the studio is live within a
// minute and the studio hears about each page about once a minute. A
// day-long copy stands behind it, served while a fresh one is fetched, so a
// studio that's down for a while takes no page down. In
// development (plain Node) there's no edge cache, and every request asks.
//
// Nuxt hands these to a site's own server code too, for anything else it
// builds from its pages.

const KEEP = 60; // seconds a copy stays at the edge
const STALE = 86_400; // seconds the epoch-less fallback copy stays at the edge
const WAIT = 8000; // ms the studio gets to answer
const EPOCH_FOR = 5000; // ms a site's cache epoch is trusted before asking again
const EPOCH_WAIT = 2000;

// One studio call per key per isolate at a time: a burst of visitors on a
// copy that just ran out waits on the same answer instead of each asking.
const flying = new Map(); // key -> promise
function once(key, work) {
 if (!flying.has(key)) flying.set(key, work().finally(() => flying.delete(key)));
 return flying.get(key);
}

// A site's cache epoch, from the studio: it moves when a page or the whole
// site is taken down or put back, and the copies kept here are keyed by it,
// so something taken down is gone from this site within seconds, not when a
// copy runs out. Asked at most every EPOCH_FOR ms per isolate, and kept at
// the edge for as long, so a data center asks about once every five seconds
// however many isolates it runs. A studio that can't be reached, or is too
// old to know, leaves the last one standing.
const epochs = new Map(); // site → { epoch, at }
async function siteEpoch(api, site, cache) {
 const known = epochs.get(site);
 if (known && Date.now() - known.at < EPOCH_FOR) return known.epoch;
 return once(`epoch:${api}:${site}`, async () => {
  const url = `${api}/api/public/sites/${encodeURIComponent(site)}/epoch`;
  let epoch = known?.epoch ?? 0;
  try {
   const kept = cache ? await cache.match(url).catch(() => undefined) : undefined;
   const res = kept ?? (await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(EPOCH_WAIT) }));
   if (res.ok) {
    const text = await res.text();
    epoch = Number(JSON.parse(text)?.epoch) || 0;
    if (cache && !kept) await cache.put(url, new Response(text, { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${EPOCH_FOR / 1000}` } })).catch(() => {});
   }
  } catch {
   // keep what we had
  }
  if (epochs.size > 5000) epochs.clear();
  epochs.set(site, { epoch, at: Date.now() });
  return epoch;
 });
}

// The studio's rule for a domain, and the hosts that are this computer.
export const DOMAIN = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const LOCAL = /^(?:localhost|127\.0\.0\.1|\[::1\])$/;

// A page's address the way the studio looks one up: from the root,
// lowercase, no trailing slash (but '/'), at most 512 characters, and no
// '//', '..', query or hash. Anything else can't be a page: null.
export function normalizePagePath(value) {
 if (typeof value !== 'string' || !value.startsWith('/') || value.length > 512) return null;
 if (value.includes('//') || value.includes('..') || /[?#]/.test(value)) return null;
 const path = value.toLowerCase();
 return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

// Where this site lives: https://<its domain> once the studio has one, or
// else the host this request came in on (https, except on this computer).
export function siteOrigin(event, domain) {
 if (typeof domain === 'string' && DOMAIN.test(domain)) return `https://${domain.toLowerCase()}`;
 const url = getRequestURL(event);
 return LOCAL.test(url.hostname) ? url.origin : `https://${url.host}`;
}

// What a dev or staging address shows of the page at `path`, as a short
// string that changes when the page does (the studio's draftStamp), for the
// live preview's two-second check. { status, stamp? }: 401 once the token no
// longer opens the site, 404 off those addresses.
export async function fetchStamp(event, path) {
 const preview = event.context.timbrrPreview;
 if (!preview) return { status: 404 };
 try {
  const res = await fetch(`${studioApi(event)}/api/preview/sites/${encodeURIComponent(preview.slug)}/stamp?path=${encodeURIComponent(path)}`, {
   headers: { accept: 'application/json', authorization: `Bearer ${previewToken(event)}` },
   signal: AbortSignal.timeout(WAIT),
  });
  if (res.status !== 200) return { status: [401, 404, 429].includes(res.status) ? res.status : 502 };
  return { status: 200, stamp: String((await res.json()).stamp ?? '') };
 } catch {
  return { status: 502 };
 }
}

// A draft for a dev or staging address, from the studio's token-checked
// reads. Never kept: every read is checked, and what it says can change on
// the next keystroke. { status: 401 } when the token no longer opens the
// site. There's no list of pages here, so no sitemap.
async function fetchDraft(event, slug, route) {
 if (route === 'pages') return { status: 404 };
 try {
  const res = await fetch(`${studioApi(event)}/api/preview/sites/${encodeURIComponent(slug)}/${route}`, {
   headers: { accept: 'application/json', authorization: `Bearer ${previewToken(event)}` },
   signal: AbortSignal.timeout(WAIT),
  });
  if (res.status === 404) return { status: 404, redirect: redirectIn(await res.text()) };
  if (res.status === 401) return { status: res.status };
  if (res.status !== 200) throw new Error(`it answered ${res.status}`);
  return { status: 200, data: await res.json() };
 } catch (error) {
  console.error(`[timbrr] Couldn't read a draft of ${route} for ${slug} from the studio: ${error.message}`);
  return { status: 502 };
 }
}

// One of the studio's public read routes for this site ('pages', or
// 'page?path=%2Fabout'), as { status: 200, data }; { status: 404 } when no
// site is set up here (NUXT_PUBLIC_SITE) or the studio has no such site or
// page to show; { status: 502 } when the studio fails, takes longer than
// WAIT, or NUXT_TIMBRR_API isn't an address. Failures are logged; 404s
// aren't, they're ordinary.
export async function fetchPublished(event, route) {
 const preview = event.context.timbrrPreview;
 if (preview) return fetchDraft(event, preview.slug, route);
 const config = useRuntimeConfig(event);
 const site = String(config.public.site ?? '').trim();
 if (!site) return { status: 404 };
 const api = String(config.timbrr?.api ?? '')
  .trim()
  .replace(/\/+$/, '');
 const url = `${api}/api/public/sites/${encodeURIComponent(site)}/${route}`;
 const cache = globalThis.caches?.default;
 try {
  if (!/^https?:\/\/[^/]/.test(api)) throw new Error('NUXT_TIMBRR_API is not an http(s) address');
  if (!cache) return read(await ask(url));
  // The copy's key carries the epoch; the studio is asked for the plain
  // address, and that plain address also keeps a day-long copy.
  const epoch = await siteEpoch(api, site, cache);
  const key = `${url}${url.includes('?') ? '&' : '?'}epoch=${epoch}`;
  const kept = await cache.match(key).catch(() => undefined);
  if (kept) return read({ status: kept.status, text: await kept.text() });
  // The minute's copy ran out, or a publish moved the epoch: the day-long
  // copy is served while one refresh runs after the response, so a busy
  // site's publish costs the studio one call per isolate, not one per
  // visitor, and a studio that's down for a while takes nothing down here.
  const stale = await cache.match(url).catch(() => undefined);
  if (stale && [200, 404].includes(stale.status)) {
   event.waitUntil?.(refresh(cache, url, key).catch((error) => console.error(`[timbrr] Couldn't refresh ${route} for ${site} from the studio: ${error.message}`)));
   return read({ status: stale.status, text: await stale.text() });
  }
  return read(await refresh(cache, url, key));
 } catch (error) {
  console.error(`[timbrr] Couldn't read ${route} for ${site} from the studio at ${api || '(none)'}: ${error.message}`);
  return { status: 502 };
 }
}

// The studio's answer for `url`, as { status, text }, one call at a time.
function ask(url) {
 return once(url, async () => {
  const res = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(WAIT) });
  return { status: res.status, text: await res.text() };
 });
}

// Ask the studio and keep a good answer twice: the minute's copy under the
// epoch's key, the day's copy under the plain address.
async function refresh(cache, url, key) {
 const answer = await ask(url);
 if (answer.status === 200) read(answer); // throws on an answer with no site
 if (answer.status === 200 || answer.status === 404) {
  await keep(cache, key, answer.status, answer.text, KEEP);
  await keep(cache, url, answer.status, answer.text, STALE);
 }
 return answer;
}

// What an answer means here; anything but a 200 with a site or a 404 throws.
function read({ status, text }) {
 if (status === 404) return { status: 404, redirect: redirectIn(text) };
 if (status !== 200) throw new Error(`it answered ${status}`);
 const data = JSON.parse(text);
 if (!data?.site || typeof data.site !== 'object') throw new Error('its answer has no site');
 return { status: 200, data };
}

// A fresh copy, with nothing of the studio's but its body, kept for `seconds`.
// If the edge won't keep it, the next request just asks again.
async function keep(cache, url, status, body, seconds) {
 const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': `public, max-age=${seconds}` };
 await cache.put(url, new Response(body, { status, headers })).catch(() => {});
}

// An old address of an entry's: a 404 whose body says where it lives now
// (`data.redirect: { to, status }`). Only a path on this site is passed on.
function redirectIn(text) {
 try {
  const redirect = JSON.parse(text)?.data?.redirect;
  return typeof redirect?.to === 'string' && /^\/(?![/\\])[a-z0-9/_-]*$/i.test(redirect.to) && redirect.to.length <= 500 ? { to: redirect.to, status: 301 } : null;
 } catch {
  return null;
 }
}
