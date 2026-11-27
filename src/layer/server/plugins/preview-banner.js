// On a dev or staging address, a small note over every page saying it's a
// draft, so nobody takes it for the live site. Written straight into the
// HTML, so a site's own pages get it too. On a page the studio serves, the
// page follows the draft as it's saved (useTimbrrPage) and writes when it
// last changed into #timbrr-preview-when, and " · new branding" into
// #timbrr-preview-brand while the branding there isn't the live one (the
// studio's docs/sites.md, "Branding by stage").
// Someone who came in on a preview link reads when it stops working instead.
const STYLE = 'position:fixed;left:50%;bottom:14px;z-index:2147483647;translate:-50% 0;padding:6px 12px;border-radius:999px;background:#1f2a24;color:#fff;font:600 12px/1.3 system-ui,sans-serif;pointer-events:none;white-space:nowrap';
const banner = (words) => `<div style="${STYLE}" id="timbrr-preview" role="status">${words}<span id="timbrr-preview-brand"></span><span id="timbrr-preview-when"></span></div>`;
const BANNER = banner('Preview, not live');

function linkBanner(link) {
 const until = new Date(link?.expiresAt);
 if (Number.isNaN(until.getTime())) return BANNER;
 const day = until.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
 return banner(`Preview of a draft · link works until ${day}`);
}

export default defineNitroPlugin((nitroApp) => {
 nitroApp.hooks.hook('render:html', (html, { event }) => {
  if (event.context.timbrrPreview) html.bodyAppend.push(event.context.timbrrPreviewLink ? linkBanner(event.context.timbrrPreviewLink) : BANNER);
 });
});
