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

40 blocks, Timbrr's base library: 38 in the five categories the studio's
tray shows, in its order, and the site's header and footer, which live in
the studio's Library instead. The type is the file name in `blocks/` and
the block's icon in the studio.

**Content**

- `richtext` Rich text: tagline, headline and formatted prose, left or
  centered in a reading column.
- `media` Media: one image with a caption, in the page column or edge to
  edge.
- `gallery` Gallery: square photos with captions, 2, 3 or 4 across.
- `story` Story: a photo beside the about text, with an attribution.
- `before_after` Before / after: two photos and a slider to drag between
  them (keyboard too).

**Common**

- `hero` Hero: the page's opener — headline, a line or two, up to three
  buttons, a tall photo on either side, or centered.
- `services` Services: title, blurb and starting price, two across.
- `menu` Menu: items with a price, a description and section or dietary
  tags, in two columns.
- `testimonials` Testimonials: hand-picked quotes, two across.
- `faq` FAQ: questions and answers in one column.
- `team` Team: photo (or initials), role, bio and a booking link per
  person.
- `trust_badges` Trust badges: a band of short claims (licensed,
  insured, years in business).
- `service_area` Service area: the neighborhoods served as chips beside a
  drawn map.
- `brands_carried` Brands carried: a row of brand names or logos.
- `pricing` Pricing: up to four tiers, each with its own button.

**Layout**

- `columns` Columns: up to four cards, plain, as numbered steps, or as links.
- `section` Section: a colored band with a label, to mark a new part of
  the page. Pages are a flat list, so it doesn't hold other blocks.
- `grid` Grid: cards, 2, 3 or 4 across.
- `spacer` Spacer: room between blocks, S to XL.
- `divider` Divider: a line, dots or a leaf mark.

**Dynamic** (typed in for now; nothing here reads live data yet)

- `hours` Hours: days and hours, an open line and a holiday note.
- `location` Location: address, parking and transit, a drawn map and Get
  directions (a Google Maps link).
- `contact_details` Contact details: phone and email that dial and mail,
  and social profiles.
- `reviews` Reviews: a Google-style rating summary and review cards,
  copied in by hand.
- `form` Form: a contact or catering inquiry form.
- `events` Events: dated rows with RSVP links. Past events are removed by
  hand.
- `instagram` Instagram feed: the handle, a Follow button and tiles you
  pick, not a live feed.
- `jobs` Job openings: roles with a status and Apply links.
- `news` News: dated posts with photos and links.

**Call to action**

- `cta` CTA banner: a deep band in the brand color with one or two buttons.
- `call_now` Call now: the phone number, big, as a tap to call.
- `book` Book: words and a booking button beside a calendar picture of
  the next four weeks.
- `order_online` Order online: a dark band with the wait time and order
  buttons.
- `request_quote` Request a quote: name, phone, service and photos.
- `specials` Specials: deal cards with an "Ends" tag (deals come down by
  hand).
- `announcement` Announcement bar: a closable bar for closures, hiring or
  news, with a link.
- `gift_cards` Gift cards: a picture of the card and a button to the
  checkout.
- `text_club` Text / email club: sign up by phone or email, with consent.

**Header and footer** (`frame: true`, so never in the tray; below)

- `site_header` Header: the menu, a button, and the classic, minimal or bar
  style.
- `site_footer` Footer: columns of links and small print, full or slim.

The forms (`form`, `request_quote`, `text_club`) draw real fields but
don't send anything yet. Every block's tray description is the design's;
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
   `safeHref()`, images through `<TbImage>`. An optional field that's
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
`NUXT_PUBLIC_STUDIO_ORIGIN` to the studio's origin (only that origin may
frame the canvas) and, when it isn't `https://timbrr.app`,
`NUXT_TIMBRR_API` to the studio its pages come from. Theme it by setting
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
  about them. Nothing published there is a 404, drawn by `app/error.vue`.
  A site's own page wins for its address, which is why the starter's
  `pages/index.vue` draws the published home page itself once a site is
  set (`useTimbrrPage('/')`), and the block shelf otherwise.
- `GET /__timbrr/page?path=…`: the site's server asking the studio's
  public API (`GET /api/public/sites/:slug/page`, published pages of
  approved sites only) and keeping the answer in Cloudflare's edge cache
  for a minute. The browser never talks to the studio.
- `GET /sitemap.xml` and `GET /robots.txt`, from the published pages. With
  no `NUXT_PUBLIC_SITE` (the starter, the shared canvas) robots.txt turns
  every crawler away and every page says `X-Robots-Tag: noindex`, since
  Cloudflare's managed robots.txt can put an "Allow: /" in front of ours.
  A site mustn't ship its own `public/robots.txt` or `public/sitemap.xml`,
  which would shadow these.
- `/__timbrr/canvas` and `/__timbrr/manifest.json`: what the studio edits
  the site through. In the studio, Site settings → Site code is where the
  builder finds them (staff only); a site whose code is deployed sets it to
  the site's own address, so its pages are edited in its own theme.

The starter (`src/starter`) is the smallest one, and Thriftrr
(`thriftrr/thriftrr`, branch `v2`) the first real one; its
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
and the small print: © year and name). Both take one `site` object:

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
}
```

Menu items are NavItems: `kind` is `page` (a path on this site),
`external` (a full address) or `none` (a heading with no link of its own);
an item can hold one level of `children`, which the header opens as a list
(`layout: 'dropdown'`) or a panel of cards with a line each (`'mega'`, the
`desc`), and the footer gives a column of its own. Every link goes through
`safeHref()`. On narrow screens the header's menu folds behind a Menu
button, a `<details>`, so it works without JavaScript. Both are styled with
the `--site-*` variables.

A site can also build headers and footers in the studio's Library, and a
page can pick one or none. That arrives as `site.frame = { header, footer }`:
each side is a frame's data, which replaces the menu and the button and
picks a style (`classic`, `minimal`, or `bar` with an announcement above;
`full` or `slim`); `false`, and that side draws nothing; or `null` or
missing, and it draws from `nav` as above. Both components keep every class
they've always had, and add one for the style (`tb-site-header--minimal`).
A theme that restyles them with `:root` rules, as Thriftrr's does, still
wins over a style except where the style needs to (Minimal has no rule under
it, whatever the theme draws there). Details: [manifest.md](manifest.md).

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
