# Timbrr Analytics: what a site does

Cookieless counting on a client site. The studio's side (the owner's picks, the
nightly rollup, the screens) is in the studio's `docs/adr/0023-web-analytics.md`;
this is the site's half: a script, a route and a binding.

## The pieces

- **`/__timbrr/a.js`**: the page script, under 3 KB gzipped. Source in
  `src/layer/analytics/a.src.js`, minified by `node layer/scripts/build-analytics.mjs`
  into `server/utils/analytics-script.js` (committed; `make check` fails when it
  is out of date). It stores nothing on the device and sends events with
  `navigator.sendBeacon`. A browser with Do Not Track (`navigator.doNotTrack`
  or `window.doNotTrack` is `'1'`) or Global Privacy Control
  (`navigator.globalPrivacyControl === true`) gets a script that returns
  before anything else: no listeners, no beacon, not one request.
- **`/__timbrr/hit`**: takes the script's events and writes one Workers
  Analytics Engine data point each. Always `204`, whatever was or wasn't
  counted; `400` for a body that isn't one the script sends. Never sets a cookie.
- **`TIMBRR_HITS`**: the Analytics Engine binding (dataset `timbrr_hits`),
  declared in `src/starter/wrangler.jsonc`. A Worker without it serves pages as
  before and `hit` does nothing, so a site that hasn't been redeployed simply
  doesn't count. A Worker that has the binding and `NUXT_RELAY_SECRET` sends
  the secret as `x-timbrr-relay` on its epoch read; that is how the studio
  learns the site can count (no secret sent, the studio shows "Needs an update"
  and turning analytics on only asks for the update).

## What turns it on

The page. The studio's page route answers `{ site, page, analytics }`, where
`analytics` is `{ on, events, fields, id }`. `events` is the kinds the owner picked
(`view`, `leave`, `seen`, `click`, `heat`, `event`). `fields` is the optional
details their questions need (`referrer`, `utm`, `country`, `device`, `agent`);
the hit route writes every other detail empty, whatever the script sent, and a
studio that sends no `fields` gets none of them. `useTimbrrPage` loads the
script only when `on` is true and `events` isn't empty, and tells it what to
send through two attributes on `<html>`:

```html
<html data-tb-a="view,leave,seen" data-tb-p="/about 3f9c…">
```

`data-tb-p` is the page's address and its id. The attributes change when a
client-side move lands on another page; that change ends one view (`leave`) and
starts the next (`view`). An older studio sends no `analytics`, a dev or
staging address never loads the script, and the canvas never does.

On a live page every block's root element carries `data-block-id` (the block's
id). That is how the script knows which block was seen or clicked. A block with
more than one root element doesn't get it and isn't tracked.

## What is sent

One event per beacon entry; a beacon is a JSON array of up to 10.

| Event | Fields |
|---|---|
| `view` | `r` referrer host, `us`/`um`/`uc` UTM, `w` window width |
| `leave` | `s` seconds, `d` scroll depth in bands of 10 |
| `seen` | `b` block id |
| `click` | `b` block id, `i` index of the link or button within the block, `k` `link` or `button`, `h` destination host, `w` window width (only to name the device) |
| `heat` | `b` block id, `x` and `y` as 0 to 100 of the block's box, `w` window width |
| `event` | `n` one of `form_sent`, `shop_handoff`, `video_play`, `booking_open`, `outbound`, `file_download`, `phone_tap`, `email_tap` |

Every event also has `p` (the page's address, no query) and `g` (its page id).
Never text, form answers or selectors.

**Blocks fire an `event` themselves** with
`window.dispatchEvent(new CustomEvent('timbrr:event', { detail: 'form_sent' }))`.
The script sends it only if `event` was picked and a page is being counted.

Who fires what:

- `form_sent`: `TbForm`, once the studio has taken the answers (also before a redirect). `TbFormLegacy` sends nothing, so it fires nothing.
- `shop_handoff`: `TbShopBuy` (Product and Product grid), when the buyer is sent to Shopify's checkout.
- `video_play`: Media's own `<video>`, the first time it plays.
- `booking_open`: Book's buttons and calendar, which carry `data-tb-event="booking_open"`. The script takes that over the guess below, so the link isn't also an `outbound`.
- `phone_tap`, `email_tap`, `file_download`, `outbound`: `a.js` reads any link on a counted page from its address alone: `tel:`, `mailto:`, a known file ending or the `download` attribute, another host. The number, address and file are never sent.

Not fired: a video from YouTube or Vimeo and the Rock Gym Pro frame play inside another site's iframe, which the page can't see into without loading their scripts. The Northwall video hero autoplays as a backdrop, which isn't a visitor pressing play. Both are left alone on purpose.

## How a visitor is told apart

`SHA-256(salt + site + IP + user agent)`, first 128 bits, in the Worker. The salt
is the studio's daily one (`GET /api/public/analytics/salt` with the relay
secret `NUXT_TIMBRR_RELAY_SECRET`, no new secret), kept in `caches.default`
under a made-up address until 00:00 UTC. No salt, no count: there is no weaker
fallback. The IP and user agent are only ever the hash's input.

Not counted: dev and staging addresses, the canvas, a request with the draft
cookie (`timbrr-preview`), a known bot (user agent, or Cloudflare's verified-bot
category), `Sec-GPC: 1`, `DNT: 1`, a request whose `Origin` isn't the site's own.

## The data point

`index1` is the site's id (the studio sends it in the `analytics` answer, `{ on, events, fields, id }`). Blobs, in order: `event`, `visitor`, `path`, `page`,
`block`, `referrer`, `utm_source`, `utm_medium`, `utm_campaign`, `country`,
`device`, `browser`, `os`, `width`, `kind`, `dest`, `name`. Doubles: `seconds`,
`depth`, `x`, `y`, `button`. The names are `BLOBS` and `DOUBLES` in
`server/utils/analytics.js`; the studio's nightly task reads by these positions.

## Deploy order

Studio first (salt route, then the rest), then this layer, then each site
Worker, which gets the binding from its `wrangler.jsonc`. Analytics Engine has
to be turned on for the Cloudflare account once.
