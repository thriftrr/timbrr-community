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

`/` on the starter shows every block with its starting content. The studio
(`make up` in thriftrr/timbrr, on :3000) uses `http://localhost:3001` as its
canvas by default (`NUXT_PUBLIC_CANVAS_ORIGIN`).

## The blocks

38 blocks, Timbrr's base library, in the five categories the studio's
tray shows, in its order. The type is the file name in `blocks/` and the
block's icon in the studio.

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

Set `NUXT_PUBLIC_SITE` to the site's slug in the studio and
`NUXT_PUBLIC_STUDIO_ORIGIN` to the studio's origin (only that origin may
frame the canvas). Theme it by setting the `--site-*` variables in its own
stylesheet. Serving published pages from the studio's API is the next
piece; until then the starter is what the studio's canvas uses.

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

The studio's canvas draws them around the page in its Render view, from the
`site` it sends: the name, the address, and the site's top-level pages after
Home (manifest.md § Render and Full). A site's layout will put them on every
page the same way once it serves its published pages:

```vue
<!-- app/layouts/default.vue -->
<template>
 <TbSiteHeader :site="site" />
 <main><slot /></main>
 <TbSiteFooter :site="site" />
</template>
```
