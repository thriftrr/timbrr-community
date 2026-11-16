import { defineEventHandler, getRequestURL, setHeader } from 'h3';
import { useRuntimeConfig } from '#imports';

// Every page may be framed by the site itself and one studio only:
// NUXT_PUBLIC_STUDIO_ORIGIN (read per request, so changing it needs no
// rebuild). Without one — development — only a studio on localhost can. The
// studio frames the canvas and its previews; nobody else gets to put a site's
// page under their own. Search engines stay out of /__timbrr/canvas.
//
// They stay out of every page of a host with no site of its own (the
// starter, the shared canvas at canvas.timbrr.app) too, page by page:
// robots.txt alone isn't enough there, since Cloudflare's managed
// robots.txt puts an "Allow: /" for every crawler in front of ours, and
// crawlers merge the two.
export default defineEventHandler((event) => {
 const config = useRuntimeConfig(event);
 // Whatever its case: a router that matched /__TIMBRR/canvas would still be the canvas.
 const canvas = getRequestURL(event).pathname.replace(/\/+$/, '').toLowerCase() === '/__timbrr/canvas';
 if (canvas || !config.public.site) setHeader(event, 'X-Robots-Tag', 'noindex, nofollow');
 setHeader(event, 'X-Content-Type-Options', 'nosniff');
 setHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin');
 const studio = String(config.public.studioOrigin ?? '').replace(/\/$/, '');
 setHeader(event, 'Content-Security-Policy', `frame-ancestors 'self' ${studio || 'http://localhost:* http://127.0.0.1:*'}; base-uri 'self'; object-src 'none'`);
});
