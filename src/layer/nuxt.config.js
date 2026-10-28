import { fileURLToPath } from 'node:url';

// @timbrr/community: the blocks every Timbrr site can use, the renderer and
// the studio's canvas. A site extends this layer and adds its own theme
// (and, if it has them, its own blocks).
export default defineNuxtConfig({
 modules: [fileURLToPath(new URL('./modules/blocks.js', import.meta.url))],
 css: [fileURLToPath(new URL('./app/assets/site.css', import.meta.url))],
 runtimeConfig: {
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
