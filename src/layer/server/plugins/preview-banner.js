// On a dev or staging address, a small note over every page saying it's a
// draft, so nobody takes it for the live site. Written straight into the
// HTML, so a site's own pages get it too. On a page the studio serves, the
// page follows the draft as it's saved (useTimbrrPage) and writes when it
// last changed into #timbrr-preview-when.
const BANNER =
 '<div style="position:fixed;left:50%;bottom:14px;z-index:2147483647;translate:-50% 0;padding:6px 12px;border-radius:999px;background:#1f2a24;color:#fff;font:600 12px/1.3 system-ui,sans-serif;pointer-events:none;white-space:nowrap" id="timbrr-preview" role="status">Preview, not live<span id="timbrr-preview-when"></span></div>';

export default defineNitroPlugin((nitroApp) => {
 nitroApp.hooks.hook('render:html', (html, { event }) => {
  if (event.context.timbrrPreview) html.bodyAppend.push(BANNER);
 });
});
