# timbrr-community

Timbrr is three pieces:

- **The studio** ([thriftrr/timbrr](https://github.com/thriftrr/timbrr)) —
  the API and the place pages are built. It stores every site's pages and
  holds **no block code**.
- **This repo** — the shared blocks. Each block is defined once here: its
  data shape, how the studio edits it, and the component that draws it.
- **A client site** — a small Nuxt app that extends this layer, adds its
  own theme (and any blocks of its own), and gets its content from the
  studio.

The studio's page builder frames the site's own `/__timbrr/canvas` page and
sends it the draft over `postMessage`. The site draws it with its own
components and stylesheet, so the builder shows exactly what the site will
serve — down to the device width, which is the frame's real width. The
studio learns which blocks a site has, and how to edit them, from the
site's `/__timbrr/manifest.json`. Details: [manifest.md](manifest.md).

## Layout

```
src/layer      @timbrr/community — the Nuxt layer sites extend
  blocks/        one definition per block (defineBlock)
  app/components/blocks/   one component per block (Hero.global.vue …)
  app/components/          TbBlocks (renderer), TbText (inline text),
                           TbRich (rich text; TbRichEditor on the canvas),
                           TbButton, TbImage, TbSiteHeader, TbSiteFooter
  app/pages/__timbrr/canvas.vue   the studio's canvas (and its previews)
  app/assets/site.css      shared styles; --site-* variables theme them
  modules/blocks.js        collects every layer's blocks, serves the manifest
  schema/                  defineBlock, field helpers, manifest builder
src/starter    a plain site on the layer (the template for client sites,
               and the canvas the studio uses in development)
docs/          this, and the manifest contract
makefile       the front door
```

## Quickstart

```
make up        # npm install + the starter on http://localhost:3001
make manifest  # print the manifest the starter serves
```

With no site set up (`NUXT_PUBLIC_SITE`), `/` on the starter shows every
block with its starting content; with one, it's the site's published home
page. The studio (`make up` in thriftrr/timbrr, on :3000) uses
`http://localhost:3001` as its canvas by default
(`NUXT_PUBLIC_CANVAS_ORIGIN`).

## The blocks

Timbrr's own library is 15 Core blocks, 7 Advanced ones a site turns on, the
site's header and footer, and 24 retired blocks on their way out. The type is
the file name in `blocks/` and the block's icon in the studio. Every block can
also set its background, the space above and below it, and a line above it (Section, Spacer and
Divider's old jobs), and a retired block's name is a preset of what replaced
it, so searching the tray still finds it. Why, and how pages move over:
`docs/blocks.md` in the timbrr repo.

**Core**

- `hero` Hero: the page's opener, with its photo beside the words, centered or
  full-bleed behind them.
- `text_image` Text & image: words with a photo on either side, or none.
- `media` Media: one image, video or embed link. Its Video address is a
  text field flagged `media: 'video'`, which asks the studio for Choose
  from media beside the box (the studio's media library holds video); a
  pasted link still works, and a studio that doesn't know the flag draws
  the plain box.
- `cards` Cards: 2 to 4 across, as a grid or slider; plain, icon, image, number,
  steps, badge or price.
- `gallery` Gallery: photos in a grid, masonry or slider.
- `logos` Logos: customers, sponsors or brands, in a row or a wall, scrolling or
  still, grouped into tiers.
- `stats` Stats: big numbers with short labels, counting up if you like.
- `quotes` Quotes: one large quote or several.
- `faq` FAQ: questions in one column or two, with topics.
- `pricing` Pricing: plan cards or a price list, with one highlighted.
- `people` People: team, staff or speakers, with a bio and a booking link.
- `feed` Feed: posts, events or jobs, in a grid, list or slider. Items are typed
  into the block; there are no collections yet.
- `visit` Visit: hours, address, map and phone from the site's details, with
  Open now, plus a service area and details of its own.
- `cta` Call to action: a banner or band with one or two buttons.
- `form` Form: a form from the site's Forms in the studio.
- `donate` Donate: three amounts and Other for a fund, then Stripe Checkout on
  the owner's own account (the studio's docs/payments.md). Needs the Payments
  add-on and a connected bank; without them it draws nothing on the live site.
- `booking` Book a time: services and classes, or (preset Reserve a table) a
  table by party size, then a day and one of the free times, then a name and
  email (the studio's docs/bookings.md). Relayed through `/__timbrr/bookings/*`;
  a deposit goes through Stripe Checkout. The guest's link in every booking
  email is `/booking/<token>`, where they can cancel. Needs the Bookings
  add-on; without it the block draws nothing on the live site, and on a dev
  or staging address booking answers that it opens once the site is live.
- `order` Order: the café's menu with a cart, then pickup or delivery and a
  time (or, from a table code's `?table=` link, to the table), a name and
  email, and Stripe Checkout on the owner's own account (the studio's
  docs/ordering.md). Relayed through `/__timbrr/ordering/*`; the studio prices
  the cart from the menu, the browser sends only ids and counts. Needs the
  Ordering add-on and Payments taking money; without them the block draws
  nothing on the live site, and on a dev or staging address ordering answers
  that it opens once the site is live. Shares its form styles with `booking`
  in `site.css`.
- `table` Table: rows and columns under an optional heading, as real table
  markup. Cells merge across and down, each column lines up left, center or
  right, the first row and the first column can be headings, and it draws
  plain, striped, bordered or compact. Wider than the screen, it scrolls
  sideways in its own box with the row names kept in view. One field holds
  the grid (`widget: 'table'`, docs/manifest.md § Widgets).

**Advanced** (`advanced: true`; staff turn each on per site)

- `before_after` Before / after: two photos and a slider to drag between them.
- `menu` Restaurant menu: items, prices and dietary tags.
- `book` Booking: words and a booking button beside a calendar picture.
- `order_online` Order online: wait time and order buttons.
- `specials` Specials: deal cards with an "Ends" tag (deals come down by hand).
- `reviews` Google reviews: a rating summary and review cards, copied in by hand.
- `instagram` Instagram feed: the handle, a Follow button and tiles you pick,
  not a live feed.
- `studio_demo` Studio demo: a working copy of the Timbrr studio for a page
  that sells it, on a made-up plumber's site. A side rail opens seven rooms:
  the page editor, Collections, Library, Forms, Media, People & access and
  Branding. Visitors add blocks, type, upload, invite and change the brand.
  Nothing leaves the browser and nothing is saved; Start over gives the room
  a fresh copy. The brand chosen in Branding shows in the page editor too.
  "Opens on" picks the first room. On the studio's canvas it holds still, so
  a click selects the block; it runs in Preview and on the site. The studio
  needs no change for it (its icon is `monitor`).

**Community** (`owner` set: commissioned by one brand, on every site's
Community shelf; the type carries the brand's prefix)

North Wall, a climbing gym:

- `northwall_video_hero` Video hero: a headline over a silent, looping
  background video. Words centered, left or bottom left; full screen or tall;
  three shades. The picture stands in until the video plays, for anyone who's
  asked for less motion, and on the canvas. There's a pause button.
- `northwall_edge` Ridge edge: the gym's mountain ridge as a block of its
  own. It's pulled up by its own height, so it cuts into the bottom of the
  block above without moving it (not when it's first on the page; a video
  hero above it pads its words and pause button clear). A hero saved with
  the old "Bottom edge: Peaks" still draws that ridge itself until
  `convert-blocks` moves it. Background is the ridge's color (pick the
  block below's), Spacing the room under it; three heights, and the peaks on
  either side. `without: ['divider']` keeps "Line above" out of its inspector.
- `northwall_embed` Embed: another service's page (a booking calendar, a
  schedule, a shop) in a sandboxed frame. Only the address is kept from what's
  pasted, so a pasted script never runs on the site, and only from a listed
  service (`EMBED_HOSTS` in `app/utils/blocks.js`: Rock Gym Pro, Calendly,
  YouTube, Vimeo, Google Calendar and Docs, and a few like them). Anything
  else draws nothing on the site; the Timbrr team adds a service on request.
- `northwall_calculator` Price calculator: how many, tick-box extras, and the
  price they come to. Nothing is charged; its button goes wherever signing up
  happens.
- `northwall_price_groups` Folding price list: prices under group names that
  open and close.

**Retired** (`retired: true`; never in the tray, and they still draw and save
until pages are converted)

`richtext`, `story`, `columns`, `grid`, `services`, `trust_badges`,
`brands_carried`, `testimonials`, `team`, `news`, `events`, `jobs`, `hours`,
`location`, `contact_details`, `service_area`, `call_now`, `gift_cards`,
`announcement`, `request_quote`, `text_club`, `section`, `spacer`, `divider`,
`northwall_table` (North Wall's two-to-five-column table; the Core Table
replaces it).

**Header and footer** (`frame: true`, so never in the tray; below)

- `site_header` Header: three layouts, an announcement and utility row, a
  menu of links, dropdowns and big menus, buttons, icons, and how it behaves
  on a scroll and on a phone.
- `site_footer` Footer: columns, centered or slim, with a newsletter link,
  contact details, social links, small print, and one floating button that
  stays in the corner of every page.

A Form block shows a form from the studio's Forms, and sends for real
(`docs/manifest.md` § Forms). The retired `request_quote` and `text_club` draw
real fields and send nothing until they're converted. Every block's tray
description is the design's;
a few (hours and contact details "from settings", events "past ones
hide", specials "expire themselves") describe where they're headed, not
what they do today.

## Adding a block

1. `src/layer/blocks/<type>.js` — `defineBlock({ type, label, description,
   category, icon, schema, fields, defaults, wys })`. `schema` is a zod
   object; every field needs a default. `fields` drive the studio's
   inspector, with the fixed widget set in [manifest.md](manifest.md).
2. `src/layer/app/components/blocks/<Type>.global.vue` — gets `data` (the
   block's data with defaults filled in). Draw text through
   `<TbText :data="data" field="headline" tag="h2" />` so it can be edited
   in place on the canvas, rich text through
   `<TbRich :data="data" field="body" />`, links through `<TbButton>` or
   `safeHref()`, images through `<TbImage :image="data.image" field="image" />`
   so a click on the canvas opens them in the inspector. An optional field that's
   empty isn't drawn: gate it with `const shows = useFieldShown()` and
   `v-if="shows('tagline', data.tagline)"` (a row's field by its path,
   `` shows(`items.${index}.body`, item.body) ``). That also keeps the field
   on the canvas while it's being typed into, so clearing it to start over
   doesn't lose the caret.
3. Style it in the component's own `<style>` (not scoped) with `--site-*`
   variables, so every site's theme applies.

A broken definition (unknown widget, a field the schema doesn't have,
defaults that don't fit) fails the build and names the block.

A site's own blocks work the same way: `blocks/` and
`app/components/blocks/` in the site's repo. Give their types a prefix
(`buroak_roast_process`) so they never collide with shared ones; a
collision fails the build.

## A client site

```js
// nuxt.config.js
export default defineNuxtConfig({
 extends: ['github:thriftrr/timbrr-community/src/layer#main'],
});
```

Set `NUXT_PUBLIC_SITE` to the site's slug in the studio,
`NUXT_PUBLIC_STUDIO_ORIGIN` to the studio's origin (only that origin and
the site itself may frame its pages) and, when it isn't `https://timbrr.app`,
`NUXT_TIMBRR_API` to the studio its pages come from. When the studio has a
relay secret (its `NUXT_RELAY_SECRET`), set the same value as the secret
`NUXT_TIMBRR_RELAY_SECRET`, or the studio won't take this site's word for
which visitor sent a form. Theme it by setting
the `--site-*` variables in its own stylesheet. That's a whole site: the
layer serves everything else from what's published in the studio, in the
site's own Worker, so publishing is live within a minute with no rebuild:

- `app/pages/[...slug].vue`: any address. It asks the site's own server
  for the published page there and draws the site's header, the page's
  blocks and the site's footer, exactly as the canvas draws them in Render
  view, with its head tags (title, description, canonical, Open Graph,
  noindex). The page's header and footer from the Library, if it has them,
  come with it as `page.frame`, and `useTimbrrPage` hands them on as
  `site.frame`, so neither this page nor a site's own needs to do anything
  about them. Nothing published there is a 404, drawn by `app/error.vue`
  in the site's own look: the home page's header and footer (read with
  `useTimbrrPage('/', { quiet: true })`, which sets no head tags and loads
  no analytics), "We couldn't find that page", the search box when site
  search is on, the menu's first four pages and the opening hours from
  Site details. Still a 404, still noindex. An old address of a page's
  (it moved, or was deleted while live) comes back from the studio as a
  404 with `data.redirect`, like an entry's, and is a 301 here.
  A site's own page wins for its address, which is why the starter's
  `pages/index.vue` draws the published home page itself once a site is
  set (`useTimbrrPage('/')`), and the block shelf otherwise.
- `GET /__timbrr/page?path=…`: the site's server asking the studio's
  public API (`GET /api/public/sites/:slug/page`, published pages of
  approved sites only) and keeping the answer in Cloudflare's edge cache
  for a minute. The browser never talks to the studio.
- `/f/<slug>` and `GET /__timbrr/share?slug=…`: a form's share page (the
  studio's docs/forms.md, "Share link"). The page shows the site's logo or
  name, the live form (`TbForm`, so it sends, checks and thanks as the Form
  block's does) and a line with the site's name, address and domain; a
  link that is off, or never was, is "This form is closed" with a 404. The
  server asks `GET /api/public/sites/:slug/share/:shareSlug` (a dev or
  staging address, the working copy) and keeps the answer a minute at the
  edge. It is the one route other sites may frame, since it is what the
  embed snippet frames (`frame-ancestors *`, and every other page keeps
  `'self'` and the studio), and it is never indexed. It wins over a site's
  own page at `/f/<something>`. `scripts/check-share.mjs` checks it.
- `GET /sitemap.xml` and `GET /robots.txt`, from the published pages. With
  no `NUXT_PUBLIC_SITE` (the starter, the shared canvas) robots.txt turns
  every crawler away and every page says `X-Robots-Tag: noindex`, since
  Cloudflare's managed robots.txt can put an "Allow: /" in front of ours.
  A site mustn't ship its own `public/robots.txt` or `public/sitemap.xml`,
  which would shadow these.
- `/__timbrr/preview/<token>`: a preview link (the studio's
  docs/publishing.md, "Preview links"): a page's working copy, not live
  yet, for someone the team shared it with, drawn like any page
  (`useTimbrrPage` with `source`) under a slim bar, with comments pinned to
  blocks. `/__timbrr/share/<token>` (GET) and `/__timbrr/share/<token>/comments`
  (POST) pass the read and a comment on to the studio from the site's
  server, the comment with the visitor's address and the relay secret as a
  form send does. Never cached, never indexed; on a dev address these paths
  skip the sign-in gate, since the token is the key. Comment words are
  only ever drawn as text.
- `/__timbrr/canvas` and `/__timbrr/manifest.json`: what the studio edits
  the site through. In the studio, Site settings → Site code is where the
  builder finds them (staff only); a site whose code is deployed sets it to
  the site's own address, so its pages are edited in its own theme.

The starter (`src/starter`) is the smallest one, and Thriftrr
(`thriftrr/thriftrr`, dimensionValue `v2`) the first real one; its
`docs/README.md` walks through running and deploying one.

## The Timbrr site

timbrr.app itself is a site in the studio (slug `timbrr`, built in), and
the starter is its code: `env.timbrr` in `src/starter/wrangler.jsonc`
deploys the same build a second time as the Worker `timbrr-site` on the
route `timbrr.app/*`, with `NUXT_PUBLIC_SITE=timbrr` and the studio as its
API. The studio Worker keeps its own paths (`/forestrr`, `/api`, `/auth`,
`/help`, `/media`, `/oauth`, `/mcp`, `/.well-known`) through more specific
routes in its own config, so a new studio path needs a route there before
it's reachable. `make deploy-timbrr` builds and ships it; `make deploy`
still ships the canvas. Its pages are edited in the studio like any
site's, and until its home page is published `/` is the 404 page.

## Header and footer

Every site gets a default header and footer: `<TbSiteHeader :site="site" />`
(the site's name linking home, its menu, and a button if it has one) and
`<TbSiteFooter :site="site" />` (the name, the menu as a column of links,
and the small print: © year and name). There's one way of drawing each: a
site with no header of its own becomes header data with the defaults. Both
take one `site` object:

```js
{
 name: 'Bur Oak Coffee',
 domain: 'buroak.coffee',
 nav: [
  { label: 'Visit', kind: 'page', to: '/visit' },
  { label: 'Beans', kind: 'none', layout: 'mega', children: [
   { label: 'Single origins', kind: 'page', to: '/shop', desc: 'Rotating lots, roasted weekly' },
  ] },
 ],
 cta: { label: 'Order online', kind: 'external', to: 'https://order.buroak.coffee' }, // optional
 details: { phone: '(815) 555-0142', street: '', city: '', region: '', postal: '', hours: [] }, // optional: Site details
}
```

Menu items are NavItems: `kind` is `page` (a path on this site),
`external` (a full address) or `none` (a heading with no link of its own);
an item can hold one level of `children`, which the header opens as a list
(`layout: 'dropdown'`) or a big menu with a line each (`'mega'`, the `desc`,
in columns by each child's `group`), or leaves out (`'link'`), and the footer
gives a column of its own. An item with a menu and an address gets an
overview link ("All Tours"), because its opener is a button. Every link goes
through `safeHref()`. Under 860px the header's menu folds behind a Menu
button, a `<details>` with a nested `<details>` per item, so it works without
JavaScript. Both are styled with the `--site-*` variables and nothing else.

A site can also build headers and footers in the studio's Library, and a
page can pick one or none. That arrives as `site.frame = { header, footer }`:
each side is a frame's data (`headerSchema` and `footerSchema` in
`schema/frames.js`; a frame saved in the older shape is read through
`upgradeHeader` and `upgradeFooter`); `false`, and that side draws nothing;
or `null` or missing, and it draws from `nav` as above. Details:
[manifest.md](manifest.md).

The header's classes stay where they were, and `.tb-site-header` is still the
header itself, so a theme's `:root` rules keep reaching it. It sits inside a
new root, `.tb-site-header-shell`, which is what sticks, and layouts and
states add classes: `tb-site-header--left`, `--center`, `--button`,
`--phone-accordion`, `--phone-drill`, `--phone-full`, and `is-open`,
`is-away` and `is-live`. An item with a menu opens from a
`<button class="tb-site-header__link">` now, not a link, so a theme that
styles `a.tb-site-header__link` needs `.tb-site-header__link` for those. The
footer's `tb-site-footer--full` is `tb-site-footer--columns` now.

A theme's `:root` rules outrank a single class and tie with two, and
component styles load in no fixed order. So where these components must beat
a theme, they use three classes or more.

The studio's canvas draws them around the page in its Render view, from the
`site` it sends: the name, the address, and the site's top-level pages after
Home (manifest.md § Render and Full). The layer's published pages draw them
the same way, from the `site` the studio's public API sends and the page's
`frame`. A page of the site's own (one the studio doesn't build) can do the
same in a layout:

```vue
<!-- app/layouts/default.vue -->
<template>
 <TbSiteHeader :site="site" />
 <main><slot /></main>
 <TbSiteFooter :site="site" />
</template>
```

## Languages

A site with the studio's Languages add-on (the studio's docs/languages.md)
serves each other language at `/<code>/...`: the catch-all asks the studio
for that path like any other, and the studio answers with the English page
with its published translation over it, or a 404. The answer then carries:

- `site.language`: the page's language, for `<html lang>` (as before);
- `site.languages`: `[{ code, label, native, href, current, banner }]`, the
  main language first, only languages whose home page is live. Two or more,
  and the header's language icon (`icons.language`) draws one short code a
  language (`aria-current` on this one, `hreflang` and `lang` on each);
  fewer, and it draws nothing. `TbLanguageBanner` shows the first-visit
  line when the browser's language is another live one with a banner: one
  closable line, kept closed in `localStorage`, and it never redirects;
- `page.alternates`: `[{ lang, path }]`, every published version of the
  page, main first. `useTimbrrPage` writes an `hreflang` link for each and
  `x-default` for the first.

All of it is checked on the way in (`app/utils/languages.js`,
`scripts/check-languages.mjs`). An older studio sends none of it, and
nothing changes.

## Members

The studio's Members add-on (its docs/members.md): visitors sign in with
their email, and an owner locks pages, sections and entries to members or
to some paid plans. What the layer does:

- **Locked content never reaches the edge copy.** The studio's public page
  read holds only a locked page's teaser (its first block; an entry's first
  block and a few paragraphs), `page.access` (`{ locked, who, plans,
  preview }`) and, when Members only sections were left out,
  `page.membersSections`. `/__timbrr/page` then asks the studio's uncached
  `members/page` read again for a visitor holding the `tb_member` or
  `tb_gift` cookie, and never lets the browser keep such a page
  (`private, no-store`).
- **The join box.** Under a locked page's teaser, `TbMembersGate` says who
  it's for and links to `/members` (free) or `/join` (plans).
- **Routes.** `/members` (an email, then a link or a 6-digit code; no
  password), `/join` (plans, monthly or yearly at ten months, Stripe
  Checkout on the owner's account), `/account` (plan, Manage billing on
  Stripe's own page, Sign out here or everywhere). An owner's own published
  page at one of these addresses wins, drawn by `TbPublishedPage`.
- **The cookie.** `/__timbrr/members/*` relays to the studio with the relay
  secret and the visitor's address. `verify` answers with a session token,
  which goes into `tb_member` (httpOnly, Secure, SameSite=Lax, 30 days) and
  never to the browser; every later call sends it as `x-timbrr-member`.
  `signout` clears it. A gift link's `?gift=` is spent once and kept in
  `tb_gift` for a day.
- **The header.** With Members on and the owner's header switch on
  (`site.members.header`), the menu ends with Sign in, or Account once
  signed in (`useTimbrrMemberIn`, worked out on the server from the cookie).
- **Dev and staging.** Signing in answers that it opens once the site is
  live; `?as=visitor|member|<plan id>` on the page's address is passed to the
  draft read, which is the studio's Preview as.

## Closed days and not-found reports

Both come from the studio's Business details and the Worker's own 404s.

**Closed days.** The studio puts `details.closedDays` in the site's public
answers: up to 20 `{ from, to, note }` spans of `YYYY-MM-DD` dates (`to` the
same as `from` for one day, `note` up to 120 characters), sorted, in the
site's time zone (`details.timezone`). They beat the weekly hours.
`openNow(hours, timezone, now, closedDays)` in `app/utils/hours.js` answers
`{ open: false, label: 'Closed today · Merry Christmas' }` on a covered date
(`opens` still says when it ends, up to a week out), and the "opens Mon 9:00
am" of any other day skips covered dates. `upcomingClosures(closedDays,
timezone)` lists the spans covering today or starting in the next 45 days;
the Visit block draws them as "Closed Dec 25 and 26 · Merry Christmas" above
its hours. Like open now, both are worked out in the browser after the page
loads (pages are cached for a minute), and say nothing without a time zone
the browser knows. Check them with `node layer/scripts/check-hours.mjs`. The
layer writes no schema.org markup, so there is no `specialOpeningHoursSpecification`.

**Not-found reports.** When the Worker renders the 404 page for a published
site (`useTimbrrPage`, on the server only), it posts one
`POST {NUXT_TIMBRR_API}/api/public/sites/<slug>/missed` with
`{ "path": "/old-menu" }` (the pathname, no query, at most 300 characters),
answered 204. It goes out through `waitUntil`, so the visitor never waits
for it, errors are swallowed, and nothing is retried: the studio rate limits.
It is only sent for GET requests, and not for a path with a file extension, a
path under `/_nuxt`, `/api`, `/.well-known` or `/__timbrr`, a user agent
matching `bot|crawl|spider|slurp|preview`, or a dev or staging address. The
studio lists what was missed most so its owner can add a redirect. Rules and
request: `app/utils/missed.js`, checked by `node layer/scripts/check-missed.mjs`.

## Collections

A site's collections and their entries live in the studio (its
docs/collections.md). The layer has what draws them:

- `collection_list` ("Collection list"): a list of one collection's published entries, as
  cards, a plain list, a table, a grid of pictures or a row that scrolls
  sideways (CSS scroll snap and two arrow buttons, no library). It can draw
  the first one large (`featured`), say how many there are (`count`), page
  by pages, by "Load more" or not at all (`paging`: `pages`, `more`,
  `none`; `true` and `false` as kept before), and show words and a button
  when there are none. Its `source` (`collectionSourceSchema`, `schema/define.js`)
  is picked in the studio with the `collection` widget: the collection, order (any
  field the collection sorts by, title, published, last changed), how many, up to
  five fixed filters (`{ field, op, value }`, op `eq`, `ne`, `gte`, `lte`,
  `in`, `filled`), up to three `choices` a visitor narrows it by (a dropdown
  or buttons above the list, each answer with how many have it, kept in the
  address as `?<block id>.<field>=value`), and `related`: `none`,
  `points_here` (entries whose relation field names the entry the page
  shows), `same_dimension_value` (sharing a dimensionValue of `relatedSet` with it) or
  `linked` (the entries its relation field `relatedField` names). It asks
  the site's own `/__timbrr/collections` through `useEntries`, which asks the
  studio's public `/api/public/sites/:slug/collections` and keeps the answer a
  minute at the edge (the working copies, never cached, on a dev or
  staging address).
- `collection_list` as **Rows with pictures** or **People** (`layout: 'rows'`
  or `'person'`): each entry is drawn from fields the owner names by the name
  the editor shows (or the key): `row_picture` and `row_date` (empty: the
  first of their kind), `row_end` (a time, "10:00 – 14:00"), `row_line` (up to
  four, in a quiet line), `row_price`, `row_places` (a number: "8 places
  left", "Full" at 0, which also drops the button), `row_button` (its words) and
  `row_link` (a link field; empty: the entry's page). The app asks the studio
  for exactly those fields, after one cached look at the collection's field
  names. Rows also have `row_group` (a heading for each month, when the
  list is in date order), the visitor's controls (`TbListFilters`: the first
  `choices` entry set to buttons is a row of pressed buttons, the others menus
  "Level  Any level", `row_sort` an order menu, `row_month` a month menu, the
  count when `count` is on, a Clear link) and `ending` (a closing line,
  `ending_text`, `ending_label`, `ending_to`). A visitor's picks live in the
  address: `?<block id>.<field>=<value>` (a menu, one value; the phone sheet
  can pick several of one field, `a|b`, sent to the studio as an `in`
  filter), `?<block id>._month=2027-01`, `?<block id>._sort=price`; the buttons
  and the Clear link are real links, the menus a GET form, so narrowing works
  without scripts (the phone's sheet needs them). On a phone the controls
  become one "Filter · Bread" button that opens a `<dialog>` bottom sheet
  (chips for every choice, "Any time" and the months, "Show 3 classes", Clear
  all) and the order menu beside it. When nothing is left the list says so in
  the collection's words ("No Beginner Bread classes in January."), what there is
  instead, buttons that take one thing away (only ones that leave something) and
  "The next Beginner Bread class" when another month has one; `empty_label` and
  `empty_to` are the quiet link under them ("Get an email when one's added":
  link a page with a Form block). `row_about` (`{value}`) names a value's page
  topic in those words. `more_label` and `more_to` put a link at the top right
  ("See all Bread classes"). People is a round picture, the name, a quiet line
  and `row_button` as a link ("More about [name]" is their first name). The
  plain parts are `app/utils/collection-rows.js`, checked by
  `node layer/scripts/check-collection-rows.mjs`.
- `collection_summary` ("Entry summary"): the card for an entry's page: a
  price (`price`, `price_before`, `price_after`), rows of an icon and words,
  one of them the places left (a number: "8 places left", "Full" at 0), a
  button, a note and, when full, `full_note` instead of the button. It works for
  any collection because every word can hold the entry's tokens
  (`{price}`, `{starts}`: docs/collections.md in the studio), filled when the
  studio serves the page; tokens are not filled inside a Split's columns, so
  put it on the page itself. With `sticky` on, a phone gets a bar fixed to the
  bottom (price, places, button) and the rows stay in the page.
- `breadcrumb` ("Breadcrumb"): "Classes › Bread", steps of words and an
  address (none: where the visitor is). Words and addresses take tokens;
  an address from a token is kept to lower-case paths
  (`/classes/categories/{category}`).
- `collection_repeat` ("Repeat for each entry"): the blocks after it, up to an
  "End of the repeat" (the same block with `end` on, a preset), drawn once
  for each entry its `source` lists, in `columns` with a `gap`. The
  studio does the repeating as it serves the page: the site gets this block
  alone, its `items` one list of blocks for each entry (at most 20 of 10
  blocks), each bound to its entry, and draws them as a grid of
  `TbBlocks`. On the canvas the area is drawn once under a band. It's what
  the studio's collection blocks (a Library kind) are made of.
- `collection_field` ("Entry field"): one field of an entry. In the Library
  template a collection's entry pages are drawn with, it's the entry the page
  shows; on any other page it names its own (`from: { collection, entry }`).
  Either way the studio sets `entry` (`{ key, label, kind, value, text }`)
  on the block as it serves the page. Its field is picked in the studio with
  the `collection_field` widget, which also sets `kind` and `from`; `kind` only
  decides which of the block's choices the inspector shows (`when`): a
  date's style, a number's format, a picture's shape and size, a link's
  words. The component goes by the kind the value really has. `empty` is
  words for an entry with nothing in the field; `via` (in a collection's
  template) is one of its relation fields: the studio shows that field of the
  first entry it names instead.
- `TbFieldValue` draws a value by its kind, always as text or through
  `TbImage` and `TbRich`: nothing an entry holds is ever markup.
- An entry's page needs nothing here: the studio answers `/__timbrr/page`
  for its address in a page's shape.
- `collection_search` ("Site search"): a search box over the published
  entries of the collections whose "Show in site search" is on in the studio.
  It asks the site's own `/__timbrr/search?q=…&limit=…&p=…`, which tidies
  what was typed, asks the studio's public
  `/api/public/sites/:slug/search` and keeps the answer a minute at the
  edge; each result is a title, an address, its collection's name and a few
  plain words (`results`: a list or cards, `show_collection`: the collection's name
  on each). `within` (`{ collections: [keys] }`, the `collection` widget with
  `pick: 'collections'`) keeps it to some of those collections. What was searched is in the address (`?q=`), so the first
  results come with the page and the form works without scripts. With a
  `to` (a page of this site) the box sends the visitor there, and the
  block on that page shows what's found. One visitor gets 60 searches a
  minute, counted in the Worker's memory (a ceiling for each isolate). The
  block's searches go to the studio with `v=1`, the old shape.
- Site search across every page and entry (the studio's `docs/search.md`):
  with `site.search.on` in the page's answer, the header's search icon opens
  `TbSiteSearch`, a modal `<dialog>` (a full-screen sheet on a phone), and so
  does `/` outside a text box; with `opens: 'page'` the icon is a link to
  `/search` instead. `/search` (`pages/search.vue`) is a built-in page in
  the home page's header and footer, with filters, sort and pages, all in
  its address. Both ask `/__timbrr/search?v=2&q=…` (kind, filters, `sort`,
  `page`, `per`; tidied in `server/utils/site-search.js`). Recent searches
  stay on the device (`localStorage`). Drawn only with `--site-*`
  variables. `node layer/scripts/check-search.mjs` checks the plain parts;
  `layer/scripts/mock-search-studio.mjs` is a stand-in studio for trying it
  locally.
- `content_list`, `content_field` and `content_search` are the same three
  under the names they had before Collections, kept and marked retired so pages
  saved with them still load. On the canvas each draws one line asking to
  convert the page; a live page never gets one, since the studio serves
  them as the new blocks. They go once the studio's convert-blocks has run
  and every site is on this layer.

On the canvas the studio sends the entries with the page, since the canvas
never asks for anything: `timbrr:doc`'s `collections` is `{ lists, raw }`
(`useTimbrrCollections`, `app/composables/collections.js`).

- `lists['<block id>:<field key>']` is the answer for each `collection` field
  of a block (a Collection list's `source`, a repeat's, a site block's own),
  exactly as `/__timbrr/collections` gives it, read by the studio with the
  editor's own access; an older studio sends `lists[<block id>]`, which is
  read too. The block draws it; until one arrives it draws stand-ins.
- An Entry field block arrives with `entry` already set.
- In a collection's template the studio fills `{{ tokens }}` in each block's
  words before it sends the page, and `raw[<block id>]` is that block's data
  as it's kept. `TbText` and `TbRich` draw the filled words and type into
  the kept ones (`useKeptValue`), so a token is never replaced by one
  entry's value.

A studio that sends no `collections` gets the stand-ins for a Collection list and a
Entry field. Site search still draws its stand-in: it has no site to ask.

### Collection-aware blocks of a site's own

A site's own block can list entries its own way. It's an ordinary
`defineBlock` with a field of the `collection` widget (the studio's picker
comes with it) and any fields of its own, and a component that calls
`useEntries` (`app/composables/collections.js`):

```js
// blocks/acme_team.js
import { z } from 'zod';
import { defineBlock, collectionSourceSchema, headlineField } from '@timbrr/community/schema/define.js';

export default defineBlock({
 type: 'acme_team',
 label: 'Team cards',
 category: 'dynamic',
 schema: z.object({ headline: z.string().max(160).default(''), source: collectionSourceSchema, round: z.boolean().default(true) }),
 fields: [headlineField, { key: 'source', label: 'Who to show', widget: 'collection' }, { key: 'round', label: 'Round photos', widget: 'switch' }],
 defaults: { headline: 'Our team', round: true },
});
```

```vue
<!-- app/components/blocks/AcmeTeam.global.vue -->
<script setup>
 const props = defineProps({ data: { type: Object, required: true } });
 const { entries, total, pending, more } = await useEntries(() => props.data.source);
 const photo = (entry) => entry.fields.find((field) => field.kind === 'image')?.value;
</script>

<template>
 <section class="tb-section">
  <div class="tb-wrap">
   <h2>{{ data.headline }}</h2>
   <ul :aria-busy="pending ? 'true' : undefined">
    <li v-for="entry in entries" :key="entry.id">
     <TbImage v-if="photo(entry)" :image="photo(entry)" ratio="1 / 1" :class="{ round: data.round }" />
     <NuxtLink v-if="entry.path" :to="entry.path">{{ entry.title }}</NuxtLink>
    </li>
   </ul>
   <button v-if="entries.length < total" type="button" @click="more">Load more</button>
  </div>
 </section>
</template>
```

- `useEntries(source, { field, page, answers, meta })` → `{ entries,
  total, pages, page, facets, collection, fields, pending, refresh, more, standIn }`.
  `source` is the field's value (a ref, a getter or a plain object);
  `field` is its key when it isn't `source`; `page` a number or a ref;
  `answers` a ref of `{ field: value }` for the list's choices; `meta` asks
  for the collection's fields too. On a live page it asks `/__timbrr/collections`; on
  the canvas it reads what the studio sent for that block and field, and
  `standIn` says nothing has arrived yet.
- `useCollection(key)` → `{ collection, fields, pending }`: a collection's names and fields
  (what each is, never a password), for a block that lays a collection out
  itself.
- `collectionQuery(source, { page, answers, meta })` is the query either one
  sends, for a site that asks `/__timbrr/collections` itself.
- What an entry carries is the list's answer: `{ id, title, slug, path,
  publishedAt, fields: [{ key, label, kind, value, text, rows?, fields? }] }`.
  Draw a field with `TbFieldValue`, or its `text`: never as markup.

The same example, as files, is in `docs/examples/collection-cards/` (kept as an
example, not loaded by the layer).

