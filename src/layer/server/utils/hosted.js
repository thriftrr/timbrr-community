import { getRequestURL } from 'h3';
import { useRuntimeConfig } from '#imports';
import { passedHost, studioApi } from './preview.js';
import { DOMAIN } from './studio.js';

// Launch domains (the studio's docs/sites.md, "Launch domain"). One Worker
// answers for every site on its own domain: the hostname names the site, and
// the studio says which one. This Worker keeps no list and decides nothing.

export const HOSTED_HOST_HEADER = 'x-timbrr-hosted-host';
const WAIT = 5000; // ms the studio gets to answer
const KEEP = 60_000; // ms an answer is remembered in this isolate
const known = new Map(); // host -> { slug, until }
const asking = new Map(); // host -> the one studio call in flight

// Whether this Worker is the shared one for launch domains.
export function hostedMode(event) {
 const flag = useRuntimeConfig(event).timbrr?.hosted;
 return flag === true || flag === 'true';
}

// The host this request came in on, or the one the middleware passed along
// in HOSTED_HOST_HEADER (passHost) for Nuxt's own requests.
export function hostedHost(event) {
 return (passedHost(event, HOSTED_HOST_HEADER) || getRequestURL(event).hostname).toLowerCase();
}

// The slug of the live site on this hostname, null when none, or undefined
// when the studio can't be asked (which serves nothing). Something that
// can't be a domain isn't asked about. One call per host at a time, and when
// the studio fails, the last answer stands.
export async function siteForHost(event, host) {
 if (!DOMAIN.test(host)) return null;
 const hit = known.get(host);
 if (hit && hit.until > Date.now()) return hit.slug;
 if (!asking.has(host)) asking.set(host, ask(event, host).finally(() => asking.delete(host)));
 const slug = await asking.get(host);
 return slug === undefined && hit ? hit.slug : slug;
}

async function ask(event, host) {
 try {
  const res = await fetch(`${studioApi(event)}/api/public/hosts/${encodeURIComponent(host)}`, {
   headers: { accept: 'application/json' },
   signal: AbortSignal.timeout(WAIT),
  });
  if (res.status !== 200 && res.status !== 404) throw new Error(`it answered ${res.status}`);
  const slug = res.status === 404 ? null : (await res.json()).slug;
  if (known.size > 5000) known.clear();
  known.set(host, { slug, until: Date.now() + KEEP });
  return slug;
 } catch (error) {
  console.error(`[timbrr] Couldn't look up ${host} with the studio: ${error.message}`);
  return undefined;
 }
}
