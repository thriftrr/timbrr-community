import { defineEventHandler, getHeader, getRequestIP, getRouterParam, readRawBody, setResponseHeaders, setResponseStatus } from 'h3';
import { useRuntimeConfig } from '#imports';
import { previewToken, studioApi } from '../../../utils/preview.js';

// /__timbrr/forms/:id: someone sending a form. The browser only ever talks to
// the site, so its request goes on to the studio from here, as it came, and the
// answer comes back the same way (the studio's docs/forms.md). The studio
// decides everything. This keeps no secret and says one thing of its own: who's
// sending, which the studio takes from a Worker on the site's own domain and
// nobody else. On a dev or staging address it goes with the visitor's token to
// the draft's route, and lands as a test.
const WAIT = 25000; // ms the studio gets, uploads and all
const MAX = 26 * 1024 * 1024;
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
 if (Number(getHeader(event, 'content-length') ?? 0) > MAX) return answer(event, 413, { statusCode: 413, message: 'Those files are too big to send together.' });

 const body = await readRawBody(event, false);
 if (body && body.length > MAX) return answer(event, 413, { statusCode: 413, message: 'Those files are too big to send together.' });
 const headers = {
  accept: 'application/json',
  'content-type': getHeader(event, 'content-type') ?? 'application/json',
  'x-timbrr-visitor': getHeader(event, 'cf-connecting-ip') ?? getRequestIP(event) ?? '',
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
