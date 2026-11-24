import { defineEventHandler, getRouterParam, readRawBody, setResponseHeaders, setResponseStatus } from 'h3';
import { useRuntimeConfig } from '#imports';
import { studioApi } from '../../../utils/preview.js';
import { visitorAddress } from '../../../utils/visitor.js';

// /__timbrr/chat/ask and /__timbrr/chat/handover: Site chat (the studio's
// docs/site-chat.md). The browser only talks to the site; this relays to the
// studio as the forms relay does, with the relay secret and the visitor's
// address, never cached. Chat runs only on the live site: a dev or staging
// address answers 404.
const WAIT = 20000;
const TO = { ask: 'chat', handover: 'chat/handover' };

function answer(event, status, body) {
 setResponseStatus(event, status);
 return body;
}

export default defineEventHandler(async (event) => {
 setResponseHeaders(event, { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
 const action = String(getRouterParam(event, 'action') ?? '');
 const config = useRuntimeConfig(event);
 const site = String(config.public.site ?? '').trim();
 const api = studioApi(event);
 if (event.context.timbrrPreview || !Object.hasOwn(TO, action) || !site || !/^https?:\/\/[^/]/.test(api)) return answer(event, 404, { statusCode: 404, message: "That page doesn't exist." });
 const body = await readRawBody(event, false);
 if (body && body.length > 4096) return answer(event, 413, { statusCode: 413, message: 'That is too much to send.' });
 const headers = {
  accept: 'application/json',
  'content-type': 'application/json',
  'x-timbrr-visitor': visitorAddress(event),
  ...(config.timbrr?.relaySecret ? { 'x-timbrr-relay': config.timbrr.relaySecret } : {}),
 };
 try {
  const res = await fetch(`${api}/api/public/sites/${encodeURIComponent(site)}/${TO[action]}`, { method: 'POST', headers, body, signal: AbortSignal.timeout(WAIT) });
  const text = await res.text();
  setResponseStatus(event, res.status);
  setResponseHeaders(event, { 'Content-Type': 'application/json; charset=utf-8' });
  return text;
 } catch (error) {
  console.error(`[timbrr] Couldn't reach the studio for chat/${action} on ${site}: ${error.message}`);
  return answer(event, 502, { statusCode: 502, message: "Couldn't reach the chat. Try again in a minute." });
 }
});
