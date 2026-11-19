// Mark the site's own inline scripts with the page's nonce, when
// canvas-headers.js set one (NUXT_TIMBRR_SCRIPT_POLICY=enforce), so
// script-src can refuse every other inline script. Only the head and what
// Nuxt appends after the app (its config and payload) are marked, never the
// rendered app itself, so a script that slipped into page content stays
// refused. The studio's server/plugins/csp-nonce.js works the same way.
const INLINE_SCRIPT = /<script\b(?![^>]*\bsrc=)(?![^>]*\btype=["']?application\/json)(?![^>]*\bnonce=)/gi;

export default defineNitroPlugin((nitroApp) => {
 nitroApp.hooks.hook('render:html', (html, { event }) => {
  const nonce = event.context.cspNonce;
  if (!nonce) return;
  for (const part of ['head', 'bodyAppend']) {
   html[part] = (html[part] ?? []).map((chunk) => chunk.replace(INLINE_SCRIPT, `<script nonce="${nonce}"`));
  }
 });
});
