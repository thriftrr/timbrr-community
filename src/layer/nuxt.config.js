import { fileURLToPath } from 'node:url';

// @timbrr/community: the blocks every Timbrr site can use, the renderer,
// the studio's canvas, and the pages a site serves from what's published in
// the studio. A site extends this layer and adds its own theme (and, if it
// has them, its own blocks).
export default defineNuxtConfig({
 modules: [fileURLToPath(new URL('./modules/blocks.js', import.meta.url)), fileURLToPath(new URL('./modules/collection-hooks.js', import.meta.url))],
 css: [fileURLToPath(new URL('./app/assets/site.css', import.meta.url))],
 runtimeConfig: {
  // NUXT_TIMBRR_API: the studio this site's published pages come from.
  // Server-only: the site's own server asks it (server/utils/studio.js);
  // the browser only ever talks to the site.
  timbrr: {
   api: 'https://timbrr.app',
   // NUXT_TIMBRR_PREVIEW_DOMAIN: dev and staging addresses are
   // <slug>.dev.<this> and <slug>.staging.<this> (server/utils/preview.js).
   previewDomain: 'timbrr.app',
   // NUXT_TIMBRR_HOSTED=true: this Worker serves every site on a launch
   // domain, asking the studio which site each hostname belongs to
   // (server/utils/hosted.js). Off for a site with its own Worker.
   hosted: false,
   // NUXT_TIMBRR_RELAY_SECRET: the studio's NUXT_RELAY_SECRET, sent with a
   // relayed form send so the studio knows the visitor's address came from a
   // site's Worker. Unset, the studio takes any Worker's word (docs/forms.md).
   relaySecret: '',
   // NUXT_TIMBRR_API_KEY: one of the site's API keys (Site settings →
   // Developers), for the site's server to call the studio's developer API,
   // e.g. checkFieldPassword (server/utils/timbrr-api.js). Never sent to a browser.
   apiKey: '',
   // NUXT_TIMBRR_SCRIPT_POLICY=enforce: refuse any script but the site's own
   // files and its marked inline ones (runtime/canvas-headers.js). Set for
   // timbrr.app's marketing site, which shares its origin with the studio.
   scriptPolicy: '',
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
