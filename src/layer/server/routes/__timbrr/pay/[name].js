import { defineEventHandler, getRouterParam, readRawBody, setResponseHeaders, setResponseStatus } from 'h3';
import { useRuntimeConfig } from '#imports';
import { studioApi } from '../../../utils/preview.js';
import { visitorAddress } from '../../../utils/visitor.js';

// /__timbrr/pay/<token> and /__timbrr/pay/donate: paying on the site (the
// studio's docs/payments.md). GET reads a pay page; POST asks the studio for
// a Stripe Checkout address to send the visitor to. The browser only talks
// to the site; this relays to the studio as the forms relay does, with the
// relay secret and the visitor's address, never cached. Payments run only on
// the live site: a dev or staging address answers that it's closed.
const WAIT = 15000;
const NAME = /^[A-Za-z0-9_-]{6,64}$/;

function answer(event, status, body) {
 setResponseStatus(event, status);
 return body;
}

export default defineEventHandler(async (event) => {
 setResponseHeaders(event, { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
 const name = String(getRouterParam(event, 'name') ?? '');
 const config = useRuntimeConfig(event);
 const site = String(config.public.site ?? '').trim();
 const api = studioApi(event);
 const post = event.method === 'POST';
 if (event.context.timbrrPreview) return answer(event, 404, { statusCode: 404, message: 'Payments open once the site is live.' });
 if (!['GET', 'POST'].includes(event.method) || !NAME.test(name) || (name === 'donate' && !post) || !site || !/^https?:\/\/[^/]/.test(api)) return answer(event, 404, { statusCode: 404, message: "That page doesn't exist." });
 const body = post ? await readRawBody(event, false) : undefined;
 if (body && body.length > 2048) return answer(event, 413, { statusCode: 413, message: 'That is too much to send.' });
 const headers = {
  accept: 'application/json',
  ...(post ? { 'content-type': 'application/json' } : {}),
  'x-timbrr-visitor': visitorAddress(event),
  ...(config.timbrr?.relaySecret ? { 'x-timbrr-relay': config.timbrr.relaySecret } : {}),
 };
 try {
  const res = await fetch(`${api}/api/public/sites/${encodeURIComponent(site)}/pay/${encodeURIComponent(name)}`, { method: event.method, headers, body, signal: AbortSignal.timeout(WAIT) });
  const text = await res.text();
  setResponseStatus(event, res.status);
  setResponseHeaders(event, { 'Content-Type': 'application/json; charset=utf-8' });
  return text;
 } catch (error) {
  console.error(`[timbrr] Couldn't reach the studio for pay/${name} on ${site}: ${error.message}`);
  return answer(event, 502, { statusCode: 502, message: "Couldn't reach the payment service. Try again in a minute." });
 }
});
