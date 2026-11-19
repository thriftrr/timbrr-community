import { useRuntimeConfig } from '#imports';
import { createError } from 'h3';
import { studioApi } from './preview.js';
import { visitorAddress } from './visitor.js';

// The studio's developer API (its docs/collection-api.md) from this site's own
// server, with the site's API key: NUXT_TIMBRR_API_KEY, a key made in Site
// settings → Developers that holds site:collections.read. Server only: the key
// never reaches a browser.

// Does `password` match what the entry's password field holds? true or
// false. The studio counts tries per visitor (ten an entry, field and
// visitor an hour, under a ceiling for everyone), so this sends the
// visitor's address. Past the tries it throws a 429 ("try again later");
// whenever the studio can't be asked, it's false.
export async function checkFieldPassword(event, { collection, entry, field, password }) {
 const config = useRuntimeConfig(event);
 const key = String(config.timbrr?.apiKey ?? '');
 const site = String(config.public?.site ?? '');
 if (!key || !site || typeof password !== 'string' || !password) return false;
 try {
  const res = await fetch(`${studioApi(event)}/api/v1/sites/${encodeURIComponent(site)}/collections/${encodeURIComponent(collection)}/entries/${encodeURIComponent(entry)}/password`, {
   method: 'POST',
   headers: { 'content-type': 'application/json', accept: 'application/json', authorization: `Bearer ${key}` },
   body: JSON.stringify({ field, password: password.slice(0, 200), visitor: visitorAddress(event).slice(0, 128) }),
   signal: AbortSignal.timeout(5000),
  });
  if (res.status === 429) throw createError({ statusCode: 429, message: 'Too many tries. Try again later.' });
  if (!res.ok) return false;
  return (await res.json())?.match === true;
 } catch (error) {
  if (error?.statusCode === 429) throw error;
  return false;
 }
}
