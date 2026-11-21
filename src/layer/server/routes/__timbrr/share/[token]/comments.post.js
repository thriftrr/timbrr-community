import { defineEventHandler, getRouterParam, readRawBody, setResponseHeaders, setResponseStatus } from 'h3';
import { useRuntimeConfig } from '#imports';
import { studioApi } from '../../../../utils/preview.js';
import { visitorAddress } from '../../../../utils/visitor.js';

// /__timbrr/share/:token/comments: a comment from someone holding a preview
// link, sent on to the studio as it came (the studio checks, cleans and
// counts it), with who's sending, the way a form send goes
// (forms/[id].post.js): the visitor's address and, with
// NUXT_TIMBRR_RELAY_SECRET set, the secret that proves this is the site's
// Worker. The answer comes back as the studio gave it.
const TOKEN = /^[A-Za-z0-9_-]{32}$/;
const MAX = 8 * 1024;
const WAIT = 8000;

function answer(event, status, body) {
 setResponseStatus(event, status);
 return body;
}

export default defineEventHandler(async (event) => {
 setResponseHeaders(event, { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
 const token = String(getRouterParam(event, 'token') ?? '');
 const config = useRuntimeConfig(event);
 const site = String(config.public.site ?? '').trim();
 const api = studioApi(event);
 if (!TOKEN.test(token) || !site || !/^https?:\/\/[^/]/.test(api)) return answer(event, 404, { statusCode: 404, message: "This preview link doesn't work any more." });
 const body = await readRawBody(event, 'utf8');
 if (!body || body.length > MAX) return answer(event, 413, { statusCode: 413, message: 'That comment is too long.' });
 try {
  const res = await fetch(`${api}/api/public/sites/${encodeURIComponent(site)}/previews/${token}/comments`, {
   method: 'POST',
   headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'x-timbrr-visitor': visitorAddress(event),
    ...(config.timbrr?.relaySecret ? { 'x-timbrr-relay': config.timbrr.relaySecret } : {}),
   },
   body,
   signal: AbortSignal.timeout(WAIT),
  });
  const text = await res.text();
  setResponseStatus(event, res.status);
  setResponseHeaders(event, { 'Content-Type': 'application/json; charset=utf-8', ...(res.headers.get('retry-after') ? { 'Retry-After': res.headers.get('retry-after') } : {}) });
  return text;
 } catch (error) {
  console.error(`[timbrr] Couldn't send a preview comment for ${site} to the studio: ${error.message}`);
  return answer(event, 502, { statusCode: 502, message: "Couldn't send that. Try again in a minute." });
 }
});
