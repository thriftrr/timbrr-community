import { getCookie, getHeader, getRequestURL } from 'h3';
import { useRuntimeConfig } from '#imports';

// A site's dev and staging addresses, <slug>.dev.timbrr.app and
// <slug>.staging.timbrr.app (the studio's docs/sites.md). They show drafts,
// so nothing is served until the studio says this visitor's token still
// opens the site. This Worker keeps no secret and makes no decisions: the
// token comes from a cookie on the address and the studio checks it. Sign-in
// and the password both happen on the studio, never here.

export const PREVIEW_COOKIE = 'timbrr-preview';
export const PREVIEW_HOST_HEADER = 'x-timbrr-preview-host';
const WAIT = 8000; // ms the studio gets to answer

// The address this request came in on, as { slug, kind }, or null for any
// other host. Nuxt's own requests for a page's data arrive without the
// visitor's Host, so the middleware passes it along in PREVIEW_HOST_HEADER.
// A visitor could send that header too, but it only ever leads to the gate
// and the same token check.
export function previewTarget(event) {
 const domain = String(useRuntimeConfig(event).timbrr?.previewDomain ?? '').trim();
 if (!domain) return null;
 const host = (getHeader(event, PREVIEW_HOST_HEADER) || getRequestURL(event).hostname).toLowerCase();
 const match = /^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\.(dev|staging)\.(.+)$/.exec(host);
 return match && match[3] === domain ? { slug: match[1], kind: match[2], host } : null;
}

export function previewToken(event) {
 return getCookie(event, PREVIEW_COOKIE) ?? '';
}

export function studioApi(event) {
 return String(useRuntimeConfig(event).timbrr?.api ?? '')
  .trim()
  .replace(/\/+$/, '');
}

// The studio's gate for this address, coming back to `next`.
export function gateUrl(event, { slug, kind }, next) {
 const query = new URLSearchParams({ site: slug, kind, next });
 return `${studioApi(event)}/auth/preview?${query}`;
}

// Whether the token opens the site: true, false, or null when the studio
// can't be asked, which serves nothing.
export async function previewAllowed(event, slug, token) {
 if (!token) return false;
 try {
  const res = await fetch(`${studioApi(event)}/api/preview/sites/${encodeURIComponent(slug)}/access`, {
   headers: { accept: 'application/json', authorization: `Bearer ${token}` },
   signal: AbortSignal.timeout(WAIT),
  });
  if (res.status === 200) return true;
  if (res.status === 401) return false;
  throw new Error(`it answered ${res.status}`);
 } catch (error) {
  console.error(`[timbrr] Couldn't check access to ${slug} with the studio: ${error.message}`);
  return null;
 }
}

// Swap a one-time code for the token, as { token, maxAge }, or null.
export async function exchangeCode(event, slug, code) {
 try {
  const res = await fetch(`${studioApi(event)}/api/preview/exchange`, {
   method: 'POST',
   headers: { accept: 'application/json', 'content-type': 'application/json' },
   body: JSON.stringify({ site: slug, code }),
   signal: AbortSignal.timeout(WAIT),
  });
  return res.status === 200 ? await res.json() : null;
 } catch (error) {
  console.error(`[timbrr] Couldn't exchange a code for ${slug} with the studio: ${error.message}`);
  return null;
 }
}
