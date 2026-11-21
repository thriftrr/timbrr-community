import { defineEventHandler, getRouterParam, setResponseHeaders, setResponseStatus } from 'h3';
import { useRuntimeConfig } from '#imports';
import { studioApi } from '../../../utils/preview.js';

// /__timbrr/share/:token: a page's working copy for someone holding a
// preview link, as the studio's GET /api/public/sites/:site/previews/:token
// answers it ({ site, page, preview, comments }; the studio's
// docs/publishing.md, "Preview links"). pages/__timbrr/preview/[token].vue
// asks for it. Never kept anywhere, never indexed: what it shows changes as
// the page is edited, and the link can be turned off at any moment.
const TOKEN = /^[A-Za-z0-9_-]{32}$/;
const WAIT = 8000;

export default defineEventHandler(async (event) => {
 setResponseHeaders(event, { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' });
 const token = String(getRouterParam(event, 'token') ?? '');
 const site = String(useRuntimeConfig(event).public.site ?? '').trim();
 const api = studioApi(event);
 const gone = { statusCode: 404, message: "This preview link doesn't work any more." };
 if (!TOKEN.test(token) || !site || !/^https?:\/\/[^/]/.test(api)) {
  setResponseStatus(event, 404);
  return gone;
 }
 try {
  const res = await fetch(`${api}/api/public/sites/${encodeURIComponent(site)}/previews/${token}`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(WAIT) });
  if (res.status === 404) {
   setResponseStatus(event, 404);
   return gone;
  }
  if (!res.ok) throw new Error(`it answered ${res.status}`);
  return await res.json();
 } catch (error) {
  console.error(`[timbrr] Couldn't read a preview link for ${site} from the studio: ${error.message}`);
  setResponseStatus(event, 502);
  return { statusCode: 502, message: "Couldn't reach the studio. Try again in a minute." };
 }
});
