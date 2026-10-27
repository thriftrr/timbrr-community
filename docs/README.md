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
                           TbRich (rich text), TbButton, TbImage
  app/pages/__timbrr/canvas.vue   the studio's canvas
  app/assets/site.css      how blocks look; --site-* variables theme them
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

## Adding a block

1. `src/layer/blocks/<type>.js` — `defineBlock({ type, label, description,
   category, icon, schema, fields, defaults, wys })`. `schema` is a zod
   object; every field needs a default. `fields` drive the studio's
   inspector, with the fixed widget set in [manifest.md](manifest.md).
2. `src/layer/app/components/blocks/<Type>.global.vue` — gets `data` (the
   block's data with defaults filled in). Draw text through
   `<TbText :data="data" field="headline" tag="h2" />` so it can be edited
   in place on the canvas, rich text through `<TbRich :doc="…" />`, links
   through `<TbButton>` or `safeHref()`, images through `<TbImage>`.
3. Style it in `app/assets/site.css` with `--site-*` variables, so every
   site's theme applies.

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
