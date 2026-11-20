import { defineEventHandler, getHeader, getRouterParam, readRawBody, setResponseHeaders, setResponseStatus } from 'h3';
import { useRuntimeConfig } from '#imports';
import { previewToken, studioApi } from '../../../utils/preview.js';
import { visitorAddress } from '../../../utils/visitor.js';

// /__timbrr/forms/:id: someone sending a form. The browser only ever talks to
// the site, so its request goes on to the studio from here, as it came, and the
// answer comes back the same way (the studio's docs/forms.md). The studio
// decides everything. This says one thing of its own: who's sending, which the
// studio takes from a site's Worker and nobody else. With NUXT_TIMBRR_RELAY_SECRET
// set (the studio's NUXT_RELAY_SECRET), that secret goes along to prove it's one. On a dev or staging address it goes with the visitor's token to
// the draft's route, and lands as a test.
const WAIT = 25000; // ms the studio gets, uploads and all
const MAX = 26 * 1024 * 1024; // a form with files on it
const PLAIN = 64 * 1024; // a form of words only (anything that isn't multipart)
const FORM_ID = /^[A-Za-z0-9_-]{1,64}$/;

function answer(event, status, body) {
 setResponseStatus(event, status);
 return body;
}

export default defineEventHandler(async (event) => {
 setResponseHeaders(event, { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
 const id = String(getRouterParam(event, 'id') ?? '');
 const preview = event.context.timbrrPreview;
 const config = useRuntimeConfig(event);
 const site = preview?.slug ?? String(config.public.site ?? '').trim();
 const api = studioApi(event);
 if (!FORM_ID.test(id) || !site || !/^https?:\/\/[^/]/.test(api)) return answer(event, 404, { statusCode: 404, message: "That form doesn't exist." });
 const files = /^multipart\/form-data/i.test(getHeader(event, 'content-type') ?? '');
 const most = files ? MAX : PLAIN;
 const tooBig = { statusCode: 413, message: files ? 'Those files are too big to send together. Try smaller ones.' : 'That is more than this form can take in one go. Shorten your answers and send it again.' };
 if (Number(getHeader(event, 'content-length') ?? 0) > most) return answer(event, 413, tooBig);

 // A body with no length said is read and measured too.
 const body = await readRawBody(event, false);
 if (body && body.length > most) return answer(event, 413, tooBig);
 const headers = {
  accept: 'application/json',
  'content-type': getHeader(event, 'content-type') ?? 'application/json',
  'x-timbrr-visitor': visitorAddress(event), // an IPv6 visitor's /64, so per-visitor limits hold
  ...(config.timbrr?.relaySecret ? { 'x-timbrr-relay': config.timbrr.relaySecret } : {}),
  ...(preview ? { authorization: `Bearer ${previewToken(event)}` } : {}),
 };
 const url = `${api}/api/${preview ? 'preview' : 'public'}/sites/${encodeURIComponent(site)}/forms/${encodeURIComponent(id)}`;
 try {
  const res = await fetch(url, { method: 'POST', headers, body, signal: AbortSignal.timeout(WAIT) });
  const text = await res.text();
  setResponseStatus(event, res.status);
  setResponseHeaders(event, { 'Content-Type': 'application/json; charset=utf-8' });
  return text;
 } catch (error) {
  console.error(`[timbrr] Couldn't send form ${id} for ${site} to the studio: ${error.message}`);
  return answer(event, 502, { statusCode: 502, message: "Couldn't send that. Try again in a minute." });
 }
});
