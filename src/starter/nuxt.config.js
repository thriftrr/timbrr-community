// The starter: a plain Timbrr site with nothing of its own but a theme. A
// new client site starts as a copy of this; in development it's also the
// canvas the studio edits through (http://localhost:3001).
export default defineNuxtConfig({
 extends: ['../layer'],
 compatibilityDate: '2025-08-01',
 devtools: { enabled: false },
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
