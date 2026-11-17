import { useRuntimeConfig } from '#imports';
import { studioApi } from './preview.js';

// The studio's developer API (its docs/collection-api.md) from this site's own
// server, with the site's API key: NUXT_TIMBRR_API_KEY, a key made in Site
// settings → Developers that holds site:collections.read. Server only: the key
// never reaches a browser.

// Does `password` match what the entry's password field holds? true or
// false; the studio counts tries (ten an entry and field an hour), past
// which, and whenever the studio can't be asked, it's false.
export async function checkFieldPassword(event, { collection, entry, field, password }) {
 const config = useRuntimeConfig(event);
 const key = String(config.timbrr?.apiKey ?? '');
 const site = String(config.public?.site ?? '');
 if (!key || !site || typeof password !== 'string' || !password) return false;
 try {
  const res = await fetch(`${studioApi(event)}/api/v1/sites/${encodeURIComponent(site)}/collections/${encodeURIComponent(collection)}/entries/${encodeURIComponent(entry)}/password`, {
   method: 'POST',
   headers: { 'content-type': 'application/json', accept: 'application/json', authorization: `Bearer ${key}` },
   body: JSON.stringify({ field, password: password.slice(0, 200) }),
   signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return false;
  return (await res.json())?.match === true;
 } catch {
  return false;
 }
}
