// Telling the studio about a page that wasn't there: a visitor asked a
// published site for an address with nothing published, and the studio's
// Redirects screen lists what was asked most so the owner can fix it
// (POST /api/public/sites/<slug>/missed, { path }, answered 204 and rate
// limited there, so there is no retry here). Only what a person could have
// mistyped or followed from an old link: not files, not the studio's own
// paths, not crawlers, which ask for a thousand addresses nobody linked.
const BOT = /bot|crawl|spider|slurp|preview/i;
const SKIPPED = /^\/(?:_nuxt|api|\.well-known|__timbrr)(?:\/|$)/;
// An old website's page (/menu.html) is a page someone followed a link to, so .html and .htm count.
const EXTENSION = /\.(?!html?$)[a-z0-9]{1,8}$/i;

// The path worth reporting, or '' when this request isn't.
export function missedPath({ method = 'GET', pathname = '', userAgent = '' }) {
 if (method !== 'GET' || !pathname.startsWith('/') || SKIPPED.test(pathname) || EXTENSION.test(pathname) || BOT.test(userAgent)) return '';
 return pathname.slice(0, 300);
}

// Never throws: the visitor already has their answer. True when the studio took it.
export async function reportMissed({ api, site, path, fetch = globalThis.fetch }) {
 if (!path || !site || !/^https?:\/\/[^/]/.test(api)) return false;
 try {
  const res = await fetch(`${api}/api/public/sites/${encodeURIComponent(site)}/missed`, {
   method: 'POST',
   headers: { accept: 'application/json', 'content-type': 'application/json' },
   body: JSON.stringify({ path }),
   signal: AbortSignal.timeout(5000),
  });
  return res.ok;
 } catch {
  return false;
 }
}
