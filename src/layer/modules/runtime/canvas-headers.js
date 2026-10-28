import { defineEventHandler, getRequestURL, setHeader } from 'h3';
import { useRuntimeConfig } from '#imports';

// /__timbrr/canvas may be framed by one studio only: NUXT_PUBLIC_STUDIO_ORIGIN
// (read per request, so changing it needs no rebuild). Without one —
// development — only a studio on localhost can. Search engines stay out.
export default defineEventHandler((event) => {
 if (getRequestURL(event).pathname.replace(/\/+$/, '') !== '/__timbrr/canvas') return;
 const studio = String(useRuntimeConfig(event).public.studioOrigin ?? '').replace(/\/$/, '');
 setHeader(event, 'Content-Security-Policy', `frame-ancestors 'self' ${studio || 'http://localhost:* http://127.0.0.1:*'}`);
 setHeader(event, 'X-Robots-Tag', 'noindex, nofollow');
});
