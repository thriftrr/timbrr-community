import { createError, defineEventHandler, getRequestURL, sendRedirect, setResponseHeaders } from 'h3';
import { useRuntimeConfig } from '#imports';
import { PREVIEW_HOST_HEADER, gateUrl, previewAllowed, previewTarget, previewToken } from '../utils/preview.js';

// Every request to a dev or staging address: it's never indexed or cached,
// and nothing is served until the studio has said this visitor may see it.
// The address names the site, so one Worker can answer for every site that
// has no code of its own; a site with its own Worker only answers for
// itself. The site is set on this request's copy of the runtime config, so
// everything downstream, pages included, reads it the usual way.
const OPEN = new Set(['/__timbrr/enter', '/robots.txt']);

export default defineEventHandler(async (event) => {
 const target = previewTarget(event);
 if (!target) return;
 const config = useRuntimeConfig(event);
 const own = String(config.public.site ?? '').trim();
 if (own && own !== target.slug) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
 }
 config.public.site = target.slug;
 event.context.timbrrPreview = target;
 event.node.req.headers[PREVIEW_HOST_HEADER] = target.host;
 setResponseHeaders(event, { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });

 const url = getRequestURL(event);
 // The studio checks the token on every draft read, so a page read needs
 // no check of its own; built files are code, not content.
 if (OPEN.has(url.pathname) || url.pathname === '/__timbrr/page' || url.pathname.startsWith('/_nuxt/')) return;
 const allowed = await previewAllowed(event, target.slug, previewToken(event));
 if (allowed === null) {
  throw createError({ statusCode: 502, statusMessage: 'Bad Gateway', message: "Couldn't reach the studio. Try again in a minute." });
 }
 if (!allowed) return sendRedirect(event, gateUrl(event, target, url.pathname + url.search), 302);
});
