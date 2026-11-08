import { getHeader, getRequestURL } from 'h3';
import { useRuntimeConfig } from '#imports';
import { studioApi } from './preview.js';

// Launch domains (the studio's docs/sites.md, "Launch domain"). One Worker
// answers for every site on its own domain: the hostname names the site, and
// the studio says which one. This Worker keeps no list and decides nothing.

export const HOSTED_HOST_HEADER = 'x-timbrr-hosted-host';
const WAIT = 5000; // ms the studio gets to answer
const KEEP = 60_000; // ms an answer is remembered in this isolate
const known = new Map(); // host -> { slug, until }

// Whether this Worker is the shared one for launch domains.
export function hostedMode(event) {
 const flag = useRuntimeConfig(event).timbrr?.hosted;
 return flag === true || flag === 'true';
}

// The host this request came in on. Nuxt's own requests for a page's data
// arrive without the visitor's Host, so the middleware passes it along in
// HOSTED_HOST_HEADER. A visitor could send that header too, but it only
// ever names a site that is live on that hostname.
export function hostedHost(event) {
 return (getHeader(event, HOSTED_HOST_HEADER) || getRequestURL(event).hostname).toLowerCase();
}

// The slug of the live site on this hostname, null when none, or undefined
// when the studio can't be asked (which serves nothing).
export async function siteForHost(event, host) {
 const hit = known.get(host);
 if (hit && hit.until > Date.now()) return hit.slug;
 try {
  const res = await fetch(`${studioApi(event)}/api/public/hosts/${encodeURIComponent(host)}`, {
   headers: { accept: 'application/json' },
   signal: AbortSignal.timeout(WAIT),
  });
  if (res.status === 404) {
   known.set(host, { slug: null, until: Date.now() + KEEP });
   return null;
  }
  if (res.status !== 200) throw new Error(`it answered ${res.status}`);
  const { slug } = await res.json();
  known.set(host, { slug, until: Date.now() + KEEP });
  return slug;
 } catch (error) {
  console.error(`[timbrr] Couldn't look up ${host} with the studio: ${error.message}`);
  return undefined;
 }
}
