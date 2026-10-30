import { defineEventHandler, getRequestURL, setHeader } from 'h3';
import { useRuntimeConfig } from '#imports';

// /__timbrr/canvas may be framed by one studio only: NUXT_PUBLIC_STUDIO_ORIGIN
// (read per request, so changing it needs no rebuild). Without one —
// development — only a studio on localhost can. Search engines stay out.
//
// They stay out of every page of a host with no site of its own (the
// starter, the shared canvas at canvas.timbrr.app) too, page by page:
// robots.txt alone isn't enough there, since Cloudflare's managed
// robots.txt puts an "Allow: /" for every crawler in front of ours, and
// crawlers merge the two.
export default defineEventHandler((event) => {
 const config = useRuntimeConfig(event);
 const canvas = getRequestURL(event).pathname.replace(/\/+$/, '') === '/__timbrr/canvas';
 if (canvas || !config.public.site) setHeader(event, 'X-Robots-Tag', 'noindex, nofollow');
 if (!canvas) return;
 const studio = String(config.public.studioOrigin ?? '').replace(/\/$/, '');
 setHeader(event, 'Content-Security-Policy', `frame-ancestors 'self' ${studio || 'http://localhost:* http://127.0.0.1:*'}`);
});
