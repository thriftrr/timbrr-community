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
also set its background, spacing and a line above it (Section, Spacer and
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
  pasted, so a pasted script never runs on the site.
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
 overHero: false, // true when the page opens on a full-bleed Hero
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
`is-clear`, `is-away` and `is-live`. An item with a menu opens from a
`<button class="tb-site-header__link">` now, not a link, so a theme that
styles `a.tb-site-header__link` needs `.tb-site-header__link` for those. The
footer's `tb-site-footer--full` is `tb-site-footer--columns` now.

A theme's `:root` rules outrank a single class and tie with two, and
component styles load in no fixed order. So where these components must beat
a theme, they use three: `:root .tb-site-header.is-clear` turns a see-through
header's background and rule off, whatever the theme draws there.

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
  block on that page shows what's found. One visitor gets 30 searches a
  minute, counted in the Worker's memory (a ceiling for each isolate).
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

