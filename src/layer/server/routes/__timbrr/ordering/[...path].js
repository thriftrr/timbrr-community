import { defineEventHandler, getQuery, getRouterParam, readRawBody, setResponseHeaders, setResponseStatus } from 'h3';
import { useRuntimeConfig } from '#imports';
import { studioApi } from '../../../utils/preview.js';
import { visitorAddress } from '../../../utils/visitor.js';

// /__timbrr/ordering/*: ordering on the site (the studio's docs/ordering.md).
// GET menu, times; POST order. The browser only talks to the site; this
// relays to the studio as the bookings and pay relays do, with the relay
// secret and the visitor's address, never cached. Ordering runs only on the
// live site: a dev or staging address answers that it's closed.
const WAIT = 15000;
const GETS = { menu: ['table'], times: ['date'] };

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
 if (event.context.timbrrPreview) return answer(event, 404, { statusCode: 404, message: 'Ordering opens once the site is live.' });
 const known = post ? path === 'order' : event.method === 'GET' && Object.hasOwn(GETS, path);
 if (!known || !site || !/^https?:\/\/[^/]/.test(api)) return answer(event, 404, { statusCode: 404, message: "That page doesn't exist." });
 const body = post ? await readRawBody(event, false) : undefined;
 if (body && body.length > 8192) return answer(event, 413, { statusCode: 413, message: 'That is too much to send.' });
 const query = post ? '' : `?${new URLSearchParams(Object.entries(getQuery(event)).filter(([key]) => GETS[path].includes(key)).map(([key, value]) => [key, String(value).slice(0, 64)]))}`;
 const headers = {
  accept: 'application/json',
  ...(post ? { 'content-type': 'application/json' } : {}),
  'x-timbrr-visitor': visitorAddress(event),
  ...(config.timbrr?.relaySecret ? { 'x-timbrr-relay': config.timbrr.relaySecret } : {}),
 };
 try {
  const res = await fetch(`${api}/api/public/sites/${encodeURIComponent(site)}/ordering/${path}${query}`, { method: event.method, headers, body, signal: AbortSignal.timeout(WAIT) });
  const text = await res.text();
  setResponseStatus(event, res.status);
  setResponseHeaders(event, { 'Content-Type': 'application/json; charset=utf-8' });
  return text;
 } catch (error) {
  console.error(`[timbrr] Couldn't reach the studio for ordering/${path} on ${site}: ${error.message}`);
  return answer(event, 502, { statusCode: 502, message: "Couldn't reach the ordering service. Try again in a minute." });
 }
});
