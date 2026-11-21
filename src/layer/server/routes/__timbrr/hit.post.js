import { defineEventHandler, getHeader, getHeaders, getRequestIP, readRawBody, setResponseHeaders, setResponseStatus } from 'h3';
import { useRuntimeConfig } from '#imports';
import { fetchSalt, handleHit, hitInput } from '../../utils/analytics.js';
import { PREVIEW_COOKIE, studioApi } from '../../utils/preview.js';
import { siteAnalytics } from '../../utils/studio.js';

// /__timbrr/hit: the page script's events (layer/analytics/a.src.js), counted
// without a cookie (server/utils/analytics.js says how and what isn't). The
// answer is always 204, whatever was or wasn't counted, and never sets a
// cookie. Only what the owner picked is counted, as the studio says it
// within the last few seconds (siteAnalytics), not as the visitor's open page
// says it. A Worker with no TIMBRR_HITS binding, which is every site deployed
// before analytics, does nothing at all.
export default defineEventHandler(async (event) => {
 setResponseHeaders(event, { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
 const binding = event.context.cloudflare?.env?.TIMBRR_HITS;
 if (typeof binding?.writeDataPoint !== 'function') {
  setResponseStatus(event, 204);
  return null;
 }
 if (Number(getHeader(event, 'content-length') ?? 0) > 4096) {
  setResponseStatus(event, 400);
  return { statusCode: 400, message: 'Not understood.' };
 }
 const config = useRuntimeConfig(event);
 const site = String(config.public.site ?? '').trim();
 const { status } = await handleHit({
  binding,
  site,
  ...hitInput({ headers: getHeaders(event), context: event.context, previewCookie: PREVIEW_COOKIE, fallbackIp: getRequestIP(event) ?? '' }),
  body: await readRawBody(event, 'utf8'),
  getSalt: () => fetchSalt({ api: studioApi(event), secret: String(config.timbrr?.relaySecret ?? '') }),
  getConfig: () => siteAnalytics(studioApi(event), site, String(config.timbrr?.relaySecret ?? '')),
  tally: true,
 });
 setResponseStatus(event, status);
 return status === 204 ? null : { statusCode: status, message: 'Not understood.' };
});
