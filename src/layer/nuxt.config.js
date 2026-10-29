import { fileURLToPath } from 'node:url';

// @timbrr/community: the blocks every Timbrr site can use, the renderer,
// the studio's canvas, and the pages a site serves from what's published in
// the studio. A site extends this layer and adds its own theme (and, if it
// has them, its own blocks).
export default defineNuxtConfig({
 modules: [fileURLToPath(new URL('./modules/blocks.js', import.meta.url))],
 css: [fileURLToPath(new URL('./app/assets/site.css', import.meta.url))],
 runtimeConfig: {
  // NUXT_TIMBRR_API: the studio this site's published pages come from.
  // Server-only: the site's own server asks it (server/utils/studio.js);
  // the browser only ever talks to the site.
  timbrr: {
   api: 'https://timbrr.app',
  },
  public: {
   // NUXT_PUBLIC_SITE: this site's slug in the studio.
   site: '',
   // NUXT_PUBLIC_STUDIO_ORIGIN: the studio allowed to frame the canvas.
   // Empty in development, where any localhost studio can.
   studioOrigin: '',
  },
 },
 // In development Vite only finds these once a page asks for them (zod
 // through the block definitions, TipTap on the canvas's first rich-text
 // click) and then reloads the page, losing that click. Bundled up front
 // instead. Builds aren't affected.
 vite: {
  optimizeDeps: {
   include: ['zod', '@tiptap/core', '@tiptap/starter-kit', '@tiptap/pm/model', '@tiptap/pm/state'],
  },
 },
});
