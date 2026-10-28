// The starter: a plain Timbrr site with nothing of its own but a theme. A
// new client site starts as a copy of this; it's also the canvas the studio
// edits through: http://localhost:3001 in development, canvas.timbrr.app
// in production (`make deploy`).
export default defineNuxtConfig({
 extends: ['../layer'],
 compatibilityDate: '2025-08-01',
 devtools: { enabled: false },
 // Builds are a Cloudflare Worker, configured by wrangler.jsonc. Only
 // builds: `nuxt dev` stays plain Node, so it never reads wrangler.jsonc.
 $production: {
  nitro: {
   preset: 'cloudflare-module',
   cloudflare: { deployConfig: true, nodeCompat: true },
  },
 },
 app: {
  head: {
   link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
     rel: 'stylesheet',
     href: 'https://fonts.googleapis.com/css2?family=Bitter:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=Public+Sans:wght@400;500;600;700&display=swap',
    },
   ],
  },
 },
});
