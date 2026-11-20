// Everything a live site can load from, or hand a visitor to, besides its own
// address: one entry per service, with what it is, what it collects, who gets
// it, and one DEFINITE thing about cookies. The studio builds "What this site
// collects" and its privacy-policy text from this list, through the manifest
// (docs/manifest.md § Third parties); `scripts/check-embed.mjs` fails the
// build when a block loads an origin that isn't here or isn't declared by it.
//
// A block says what it can load with `loads: ['youtube']` in defineBlock. What
// every page loads, whatever the blocks, is SITE_LOADS. `via` names the
// helpers and components that bring a service in without its address in the
// block's own file (embedSrc, TbShopBuy…): check-embed.mjs reads a block's
// components for them, and for the origins themselves.
//
// COOKIES is exactly one of:
//   'none'               the service sets no cookie (only where we know it
//                        from our own code, or the service's own documentation)
//   ['name', ...]        the cookies it sets, names as its own documentation
//                        lists them
//   'to-be-verified'     we have not confirmed it from an official source.
//                        The studio shows "Cookie list to be verified" and
//                        leaves the row out of the copy text.
// "May set cookies" is not a statement a privacy policy can use, so
// cookieProblem() refuses it. Never fill this in from memory or from a
// drawing: look it up, and put the source URL and the date in `source`.
//
// Lookups of 2026-11-19 (WebFetch of the official pages, or, where it says so,
// a web search that found them). Where an official page would not load or did
// not answer the question, the entry says 'to-be-verified'.
//
// `processor` names who receives the visitor's data. No country is stated for
// anyone: we don't know it from a source we checked.

const TO_BE_VERIFIED = 'to-be-verified';

export const THIRD_PARTIES = [
 // Our own code. These three may be stated without a lookup.
 {
  id: 'timbrr_hosting',
  name: 'Timbrr hosting',
  kind: 'own',
  origins: [],
  what: 'Serves the page you asked for, from this site’s own address.',
  collects: 'The request itself: the page asked for, the visitor’s IP address and browser details, as any web server receives to answer.',
  processor: 'Timbrr, on Cloudflare',
  cookies: 'none',
  // No code in the layer sets a visitor cookie (grep: setCookie is in
  // server/routes/__timbrr/enter.get.js only, the team's draft cookie below).
  source: 'our own code',
 },
 {
  id: 'timbrr_analytics',
  name: 'Timbrr Analytics',
  kind: 'own',
  origins: [],
  what: 'Counts visits on this site, if the owner turned it on. Same address as the site; nothing is stored on the visitor’s device.',
  collects: 'Only what the owner picked: pages seen, where visitors came from, country, device, browser and screen size, time on page, and which blocks were seen or clicked. Never the IP address, text from the page or form answers.',
  processor: 'Timbrr, stored with Cloudflare',
  cookies: 'none',
  source: 'our own code (docs/analytics.md: no cookie, localStorage or sessionStorage)',
 },
 {
  id: 'timbrr_draft',
  name: 'Timbrr draft cookie',
  kind: 'own',
  origins: [],
  what: 'Lets the site’s own team see drafts and previews on the site’s address. Visitors never get it.',
  collects: 'A sign-in token for one team member.',
  processor: 'Timbrr',
  cookies: ['timbrr-preview'],
  audience: 'team',
  source: 'our own code (PREVIEW_COOKIE in server/utils/preview.js, set in server/routes/__timbrr/enter.get.js)',
 },

 {
  id: 'google_fonts',
  name: 'Google Fonts',
  kind: 'load',
  origins: ['fonts.googleapis.com', 'fonts.gstatic.com'],
  what: 'The typefaces the site’s brand uses, loaded from Google when the page opens.',
  collects: 'The visitor’s IP address and browser details, as any server receives to send a file.',
  processor: 'Google',
  // A web search summarised Google's Fonts FAQ as saying the API "does not
  // set or log cookies", but the FAQ (https://developers.google.com/fonts/faq/privacy,
  // which redirects to a script-drawn page) would not load for us, so we did
  // not read the sentence ourselves.
  cookies: TO_BE_VERIFIED,
  source: 'https://developers.google.com/fonts/faq/privacy (not read, 2026-11-19)',
 },
 {
  id: 'youtube',
  name: 'YouTube',
  kind: 'load',
  // The player is always built on the no-cookie host (embedSrc,
  // app/utils/blocks.js). youtube.com is only ever a link a visitor clicks.
  origins: ['www.youtube-nocookie.com'],
  via: ['embedSrc'],
  what: 'A YouTube video played on the page, in YouTube’s own frame.',
  collects: 'The visitor’s IP address and browser details when the frame opens. Google says a view in this mode is not used to personalize the viewer’s YouTube browsing.',
  processor: 'Google',
  // YouTube's embed help (privacy-enhanced mode) says nothing about cookies,
  // and Google's cookie page does not say which of its cookies an embedded
  // player sets. Test in a browser before stating either.
  cookies: TO_BE_VERIFIED,
  source: 'https://support.google.com/youtube/answer/171780 and https://policies.google.com/technologies/cookies/embedded (2026-11-19): neither names the embed’s cookies',
 },
 {
  id: 'vimeo',
  name: 'Vimeo',
  kind: 'load',
  origins: ['player.vimeo.com'],
  via: ['embedSrc'],
  what: 'A Vimeo video played on the page, in Vimeo’s own player.',
  collects: 'The visitor’s IP address and browser details, and viewing statistics Vimeo reports to the video’s owner.',
  processor: 'Vimeo.com, Inc.',
  // Vimeo's "Vimeo Player Cookies" help page names these for its player, and we
  // add no `dnt` parameter. The page also names three cookies by pattern
  // ([clip_id]_password, [webinar_uuid]_webinar_registrant, lc_[hash]) for
  // password-protected clips and registration forms; those are not cookie
  // names, so they are left out. Only a page that holds a Vimeo link is listed
  // as using this (the studio reads the Media block's link).
  cookies: ['vuid', 'player', 'flags', 'player_clearance', '_cf_bm', '_cfuvid', 'cf_clearance'],
  source: 'https://help.vimeo.com/hc/en-us/articles/26080940921361-Vimeo-Player-Cookies (read 2026-11-19; the page carries no date)',
 },
 {
  id: 'google_maps',
  name: 'Google Maps',
  kind: 'link',
  origins: ['www.google.com'],
  what: 'A “Directions” link. The page loads nothing from Google; the visitor goes there only by clicking.',
  collects: 'Nothing from this page until a click; then the place named in the link and whatever Google collects from any visit.',
  processor: 'Google',
  // Our page sets and reads nothing for a link, but what Google sets once the
  // visitor is on its site is Google's to say, and we have not looked it up.
  cookies: TO_BE_VERIFIED,
  source: 'no Google page found that answers it (2026-11-19)',
 },
 {
  id: 'openstreetmap',
  name: 'OpenStreetMap',
  kind: 'load',
  origins: ['tile.openstreetmap.org', 'www.openstreetmap.org'],
  what: 'The pictures of a map in a collection entry’s Map field (tiles). No map script runs on the page.',
  collects: 'The visitor’s IP address and browser details, as any server receives to send a picture.',
  processor: 'OpenStreetMap Foundation',
  // OSMF's privacy policy (https://osmfoundation.org/wiki/Privacy_Policy,
  // edited 2026-01-25) says its services use cookies for login and navigation
  // but does not say what tile requests set.
  cookies: TO_BE_VERIFIED,
  source: 'https://osmfoundation.org/wiki/Privacy_Policy (read 2026-11-19): silent on tile requests',
 },
 {
  id: 'turnstile',
  name: 'Cloudflare Turnstile',
  kind: 'load',
  origins: ['challenges.cloudflare.com'],
  what: 'A check that a form is sent by a person, on forms where the owner turned it on.',
  collects: 'Signals about the visitor’s browser, such as client IP address, TLS fingerprint, User-Agent header and the site key (Cloudflare’s Turnstile Privacy Addendum). It does not read the form’s answers.',
  processor: 'Cloudflare',
  // The addendum calls the signals "strictly necessary" and names no cookie;
  // Cloudflare's cookie policy lists bot and CAPTCHA cookies (_cf_bm,
  // cf_clearance, cf_chl_rc_i, cf_chl_rc_ni) without saying Turnstile sets
  // them. Not enough to state either way.
  cookies: TO_BE_VERIFIED,
  source: 'https://www.cloudflare.com/turnstile-privacy-policy/ and https://www.cloudflare.com/cookie-policy/ (read 2026-11-19)',
 },
 {
  id: 'shopify',
  name: 'Shopify',
  kind: 'load',
  origins: ['cdn.shopify.com', '*.myshopify.com'],
  via: ['useShopRead', 'TbShopBuy'],
  what: 'The site’s own Shopify store: product pictures load from Shopify’s servers, and Buy sends the visitor on to the store’s checkout.',
  collects: 'The visitor’s IP address and browser details when pictures load. When products are read, our Worker also passes the visitor’s IP address to Shopify so its limits count each visitor. At checkout, what the visitor types there.',
  processor: 'Shopify',
  // Shopify's cookie help page (https://help.shopify.com/en/manual/your-account/privacy/cookies,
  // 2026-11-19) names no storefront cookie and does not mention cdn.shopify.com.
  cookies: TO_BE_VERIFIED,
  source: 'https://help.shopify.com/en/manual/your-account/privacy/cookies (read 2026-11-19): does not answer it',
 },
 {
  id: 'rock_gym_pro',
  name: 'Rock Gym Pro',
  kind: 'load',
  origins: ['app.rockgympro.com'],
  via: ['embedFrame'],
  what: 'The gym’s Rock Gym Pro booking or gift card page, in a frame on the page.',
  collects: 'What the visitor types into the booking page, and their IP address and browser details.',
  processor: 'Rock Gym Pro',
  // Rock Gym Pro's support article "Browser Cookie Requirements for Online
  // Booking Widgets" (https://support.rockgympro.com/hc/en-us/articles/43190083914765)
  // was found by web search; our fetch of it got a 403. It says booking needs
  // cookies; we have not read their names.
  cookies: TO_BE_VERIFIED,
  source: 'https://support.rockgympro.com/hc/en-us/articles/43190083914765 (found 2026-11-19, not read)',
 },
 {
  id: 'pasted_embed',
  name: 'An address pasted into an Embed block',
  kind: 'load',
  // Any https address the owner pastes (embedFrame, app/utils/blocks.js).
  // Only Rock Gym Pro's is known ahead of time (above).
  origins: [],
  anyOrigin: true,
  via: ['embedFrame'],
  what: 'Whatever service the owner pasted an embed code for, in a frame on the page. The block’s own address says which.',
  collects: 'Whatever that service collects. It is not known until an address is pasted.',
  processor: 'the service at the pasted address',
  cookies: TO_BE_VERIFIED,
  source: 'depends on the address',
 },
];

// What every page loads, whatever its blocks: our own entries, and the brand
// fonts (app/utils/brand.js brandFontsHref, starter/nuxt.config.js).
export const SITE_LOADS = ['timbrr_hosting', 'timbrr_analytics', 'timbrr_draft', 'google_fonts'];

const COOKIE_NAME = /^[\w.[\]-]{1,64}$/;

// Why a cookie statement can't be used, or null when it can.
export function cookieProblem(cookies) {
 if (cookies === 'none' || cookies === TO_BE_VERIFIED) return null;
 if (Array.isArray(cookies)) {
  return cookies.length && cookies.every((name) => typeof name === 'string' && COOKIE_NAME.test(name)) ? null : 'a cookie list holds cookie names only';
 }
 return `cookies must be 'none', a list of names or '${TO_BE_VERIFIED}', not ${JSON.stringify(cookies)}`;
}

// Whether `host` is one of an entry's origins ('*.x.com' covers any subdomain of x.com).
export function originMatches(origins, host) {
 return origins.some((origin) => (origin.startsWith('*.') ? host.endsWith(origin.slice(1)) : host === origin));
}

// What the manifest carries and the studio reads (a copy, so a consumer can't change ours).
export function thirdPartiesForManifest() {
 return THIRD_PARTIES.map((entry) => JSON.parse(JSON.stringify(entry)));
}
