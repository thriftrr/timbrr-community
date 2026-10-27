# Block manifest and canvas — contract v1

The wire contract between a site built on `@timbrr/community` and a Timbrr
studio. A studio refuses a manifest whose `version` it doesn't read; adding
fields doesn't change the version, breaking the shape does.

## 1. A block definition

```js
// blocks/hours.js
import { z } from 'zod';
import { defineBlock } from '#timbrr/define';

export default defineBlock({
 type: 'hours',               // a-z, 0-9, _; site blocks carry a prefix
 label: 'Hours',
 description: 'When you are open',
 category: 'dynamic',         // content | common | layout | dynamic | cta
 icon: 'clock',               // a Lucide name; the studio draws it
 schema: z.object({
  headline: z.string().max(160).default(''),
  items: z.array(z.object({ days: z.string().default(''), hours: z.string().default('') })).default([]),
 }),
 fields: [
  { key: 'headline', label: 'Headline', widget: 'text', inline: true },
  { key: 'items', label: 'Days', widget: 'items', itemLabel: 'days', subfields: [
   { key: 'days', label: 'Days', widget: 'text', inline: true },
   { key: 'hours', label: 'Hours', widget: 'text', inline: true },
  ] },
 ],
 defaults: { headline: 'Come by', items: [] },
 wys: { headline: ['italic'] },
});
```

**Widgets** (fixed; a manifest can't invent one): `text` · `textarea` ·
`html` (rich text) · `select` · `buttons` (segmented choice) · `items` (a
list of rows with `subfields`; `itemLabel` names the subfield that labels a
row, `max` caps it) · `image` (`{ src, alt }`).

**Field flags:** `inline` (drawn through `<TbText>`, editable on the
canvas), `ai` (`generate` | `improve` | `write`, for the studio's writing
help), `help`, `placeholder`, `options` (`[{ label, value }]` for `select`
and `buttons`).

**wys** lists the formatting tools a field allows: `bold italic underline
link h2 h3 ul ol clear`. Unlisted fields get bold and italic.

**Rich text** is stored as a document tree, never HTML:
`{ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text',
text, marks: [{ type: 'bold' }] }] }] }` (TipTap's JSON). `<TbRich>` draws
paragraphs, headings (2, 3), lists, blockquotes and line breaks, with bold,
italic, underline and links; links pass `safeHref()` (http(s), mailto, tel,
same-site paths). Nothing a page holds becomes markup.

## 2. The manifest

`GET /__timbrr/manifest.json`, prerendered into static builds, CORS open.

```jsonc
{
 "version": 1,
 "generatedAt": "2026-10-27T18:00:00.000Z",
 "site": "bur-oak",                              // NUXT_PUBLIC_SITE
 "layers": [
  { "name": "bur-oak-site", "version": "0.0.0", "tier": "private" },
  { "name": "@timbrr/community", "version": "0.1.0", "tier": "community" }
 ],
 "widgets": ["text", "textarea", "html", "select", "buttons", "items", "image"],
 "blocks": [
  {
   "type": "hours", "tier": "community", "owner": null, "layer": "@timbrr/community",
   "component": "BlocksHours", "label": "Hours", "description": "When you are open",
   "category": "dynamic", "icon": "clock",
   "fields": [ /* as defined */ ],
   "defaults": { /* parsed through the schema: every key present */ },
   "wys": { "headline": ["italic"] },
   "schema": { /* JSON Schema 2020-12, from z.toJSONSchema (input side) */ }
  }
 ]
}
```

Tier comes from the owning layer's `package.json` → `timbrr.tier`; anything
undeclared is `private`. A type defined twice, an unknown category or
widget, a field the schema doesn't have, or defaults that don't parse fail
the build.

## 3. What the studio does with it

The studio fetches the manifest from the site's canvas origin, caches it,
and builds the block tray and the inspector from it. Every save is checked
against it: a block type the site doesn't have, or data that doesn't fit
the block's `schema`, is refused (422). The site re-checks on render —
data that doesn't parse falls back to the block's defaults rather than
breaking the page.

## 4. The canvas

`/__timbrr/canvas` is client-rendered, `noindex`, and framable only by
`NUXT_PUBLIC_STUDIO_ORIGIN` (any localhost in development, when it's
unset). It draws nothing until the studio speaks. It never fetches content
and never holds a token: the studio sends the page.

Every message is `{ v: 1, type, … }`. The canvas only takes messages from
its parent window at the allowed origin, and only sends to the origin that
first wrote to it; the studio only takes messages from its frame, at the
site's origin.

Studio → canvas

| type | payload |
|---|---|
| `timbrr:doc` | `blocks` (`[{ id, type, hidden, data }]`), `theme` (`{ accent }`) — the whole page, on every change |
| `timbrr:select` | `id` or null |

Canvas → studio

| type | payload |
|---|---|
| `timbrr:ready` | `manifestVersion` — repeated every 250 ms until the first `timbrr:doc` |
| `timbrr:size` | `height` — the page's height; the studio sizes the frame to it |
| `timbrr:click` | `id` of the block clicked, or null |
| `timbrr:edit` | `id`, `field` (a path: `items.0.title`), `value` — typed in place |
| `timbrr:drop` | `index`, `kind`: `add` (with `blockType`, dragged from the studio's tray as `application/x-timbrr-block`) or `move` (with `id`, dragged by the block's tab as `application/x-timbrr-move`) |

In the canvas each block sits in a frame (`.tb-frame`) that draws the
selection outline and a name tab over the block, never around it, so the
layout is the site's own. Hidden blocks show faded; the live site skips
them. Links inside blocks don't navigate.

## 5. Inline text

`<TbText :data="data" field="items.0.title" tag="h3" />` draws plain text on
the site and a `contenteditable` (plain text only) in the canvas. Each
keystroke goes to the studio as `timbrr:edit`; the studio's copy comes back
in the next `timbrr:doc`, and is left alone while the field has focus so
the caret doesn't jump. Single-line fields end on Enter; `multiline` ones
keep line breaks. Blocks that draw text without `<TbText>` are edited in
the inspector only.
