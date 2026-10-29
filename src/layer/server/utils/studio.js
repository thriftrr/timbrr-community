import { getRequestURL } from 'h3';
import { useRuntimeConfig } from '#imports';

// This site's published pages, from the studio's public read API
// (docs/manifest.md § 6). Only the site's own server asks (/__timbrr/page,
// /sitemap.xml); the browser only ever talks to the site. Each answer is
// kept for a minute at the edge (Cloudflare's caches.default, in the data
// center that asked), so a page published in the studio is live within a
// minute and the studio hears about each page about once a minute. In
// development (plain Node) there's no edge cache, and every request asks.
//
// Nuxt hands these to a site's own server code too, for anything else it
// builds from its pages.

const KEEP = 60; // seconds a copy stays at the edge
const WAIT = 8000; // ms the studio gets to answer

// The studio's rule for a domain, and the hosts that are this computer.
const DOMAIN = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
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

// One of the studio's public read routes for this site ('pages', or
// 'page?path=%2Fabout'), as { status: 200, data }; { status: 404 } when no
// site is set up here (NUXT_PUBLIC_SITE) or the studio has no such site or
// page to show; { status: 502 } when the studio fails, takes longer than
// WAIT, or NUXT_TIMBRR_API isn't an address. Failures are logged; 404s
// aren't, they're ordinary.
export async function fetchPublished(event, route) {
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
  const kept = cache ? await cache.match(url).catch(() => undefined) : undefined;
  const res = kept ?? (await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(WAIT) }));
  const text = await res.text();
  if (res.status === 404) {
   if (cache && !kept) await keep(cache, url, 404, text);
   return { status: 404 };
  }
  if (res.status !== 200) throw new Error(`it answered ${res.status}`);
  const data = JSON.parse(text);
  if (!data?.site || typeof data.site !== 'object') throw new Error('its answer has no site');
  if (cache && !kept) await keep(cache, url, 200, text);
  return { status: 200, data };
 } catch (error) {
  console.error(`[timbrr] Couldn't read ${route} for ${site} from the studio at ${api || '(none)'}: ${error.message}`);
  return { status: 502 };
 }
}

// A fresh copy, with nothing of the studio's but its body, kept for KEEP
// seconds. If the edge won't keep it, the next request just asks again.
async function keep(cache, url, status, body) {
 const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': `public, max-age=${KEEP}` };
 await cache.put(url, new Response(body, { status, headers })).catch(() => {});
}
