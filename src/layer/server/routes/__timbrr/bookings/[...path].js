import { defineEventHandler, getQuery, getRouterParam, readRawBody, setResponseHeaders, setResponseStatus } from 'h3';
import { useRuntimeConfig } from '#imports';
import { studioApi } from '../../../utils/preview.js';
import { visitorAddress } from '../../../utils/visitor.js';

// /__timbrr/bookings/*: booking on the site (the studio's docs/bookings.md).
// GET services, times, booking/<token>; POST book, booking/<token> (cancel).
// The browser only talks to the site; this relays to the studio as the forms
// and pay relays do, with the relay secret and the visitor's address, never
// cached. Bookings run only on the live site: a dev or staging address
// answers that it's closed.
const WAIT = 15000;
const TOKEN = /^[A-Za-z0-9_-]{16,64}$/;
const GETS = new Set(['services', 'times']);

function answer(event, status, body) {
 setResponseStatus(event, status);
 return body;
}

export default defineEventHandler(async (event) => {
 setResponseHeaders(event, { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
 const path = String(getRouterParam(event, 'path') ?? '');
 const config = useRuntimeConfig(event);
 const site = String(config.public.site ?? '').trim();
 const api = studioApi(event);
 const post = event.method === 'POST';
 if (event.context.timbrrPreview) return answer(event, 404, { statusCode: 404, message: 'Booking opens once the site is live.' });
 const [first, token, extra] = path.split('/');
 const known = first === 'booking' ? TOKEN.test(token ?? '') && !extra && ['GET', 'POST'].includes(event.method) : !token && (post ? first === 'book' : event.method === 'GET' && GETS.has(first));
 if (!known || !site || !/^https?:\/\/[^/]/.test(api)) return answer(event, 404, { statusCode: 404, message: "That page doesn't exist." });
 const body = post ? await readRawBody(event, false) : undefined;
 if (body && body.length > 4096) return answer(event, 413, { statusCode: 413, message: 'That is too much to send.' });
 const query = first === 'times' ? `?${new URLSearchParams(Object.entries(getQuery(event)).filter(([key]) => ['service', 'date', 'party', 'staff'].includes(key)).map(([key, value]) => [key, String(value).slice(0, 60)]))}` : '';
 const headers = {
  accept: 'application/json',
  ...(post ? { 'content-type': 'application/json' } : {}),
  'x-timbrr-visitor': visitorAddress(event),
  ...(config.timbrr?.relaySecret ? { 'x-timbrr-relay': config.timbrr.relaySecret } : {}),
 };
 try {
  const res = await fetch(`${api}/api/public/sites/${encodeURIComponent(site)}/bookings/${path.split('/').map(encodeURIComponent).join('/')}${query}`, { method: event.method, headers, body, signal: AbortSignal.timeout(WAIT) });
  const text = await res.text();
  setResponseStatus(event, res.status);
  setResponseHeaders(event, { 'Content-Type': 'application/json; charset=utf-8' });
  return text;
 } catch (error) {
  console.error(`[timbrr] Couldn't reach the studio for bookings/${first} on ${site}: ${error.message}`);
  return answer(event, 502, { statusCode: 502, message: "Couldn't reach the booking service. Try again in a minute." });
 }
});
