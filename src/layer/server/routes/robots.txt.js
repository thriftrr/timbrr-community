import { defineEventHandler, setResponseHeaders } from 'h3';
import { useRuntimeConfig } from '#imports';
import { siteOrigin } from '../utils/studio.js';

// /robots.txt. A site set up in the studio (NUXT_PUBLIC_SITE) lets search
// engines in, keeps them out of /__timbrr/ (the studio's canvas, the block
// manifest and the page reads) and points them at its sitemap. Anywhere
// else, like the shared starter at canvas.timbrr.app, everything is off
// limits, so the canvas host is never indexed, and so is a dev or staging
// address. A site mustn't ship its own
// public/robots.txt: that file would be served instead of this.
export default defineEventHandler((event) => {
 setResponseHeaders(event, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' });
 if (event.context.timbrrPreview || !String(useRuntimeConfig(event).public.site ?? '').trim()) return 'User-agent: *\nDisallow: /\n';
 return `User-agent: *\nAllow: /\nDisallow: /__timbrr/\n\nSitemap: ${siteOrigin(event)}/sitemap.xml\n`;
});
