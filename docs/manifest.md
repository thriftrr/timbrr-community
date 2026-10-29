# Block manifest and canvas — contract v1

The wire contract between a site built on `@timbrr/community` and a Timbrr
studio. A studio refuses a manifest whose `version` it doesn't read; adding
fields doesn't change the version, breaking the shape does.

## 1. A block definition

```js
// blocks/hours.js (shortened)
import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema } from '#timbrr/define';

export default defineBlock({
 type: 'hours',               // a-z, 0-9, _; site blocks carry a prefix
 label: 'Hours',
 description: 'From settings, open-now indicator',
 category: 'dynamic',         // content | common | layout | dynamic | cta
 icon: 'hours',               // a name in the studio's icon set; Timbrr's own blocks use their type
 schema: z.object({
  headline: z.string().max(160).default(''),
  items: z.array(z.object({ title: z.string().max(40).default(''), body: z.string().max(60).default('') })).max(10).default([]),
  note: richTextSchema.default(richText('')),
 }),
 fields: [
  headlineField,              // { key: 'headline', label: 'Headline', widget: 'text', inline: true, ai: 'generate' }
  { key: 'items', label: 'Days', widget: 'items', itemLabel: 'title', max: 10, subfields: [
   { key: 'title', label: 'Days', widget: 'text', inline: true },
   { key: 'body', label: 'Hours', widget: 'text', inline: true },
  ] },
  { key: 'note', label: 'Holiday note', widget: 'html', inline: true },
 ],
 defaults: { headline: 'Come by', items: [{ title: 'Mon – Fri', body: '8:00 am – 6:00 pm' }], note: richText('Closed Dec 25.') },
 wys: { headline: [], 'items.*.title': [], 'items.*.body': [], note: ['italic'] },
});
```

**Widgets** (fixed; a manifest can't invent one): `text` · `textarea` ·
`html` (rich text) · `select` · `buttons` (segmented choice) · `items` (a
list of rows with `subfields`; `itemLabel` names the subfield that labels a
row, `max` caps it) · `image` (`{ src, alt }`).

**Field flags:** `inline` (drawn through `<TbText>` or `<TbRich>`, so it's
typed into on the canvas), `link` (a text field that holds an address, like
a button's `to`: the studio offers this site's pages or an outside
address; the shared `buttonsField` has it), `ai` (`generate` | `improve` |
`write`, for the studio's writing help, which isn't built yet), `help`,
`placeholder`, `options` (`[{ label, value }]` for `select` and
`buttons`). `select` and `buttons` fields are the block's style choices:
the studio's inspector puts them on its Style tab.

**wys** lists the formatting tools a rich field allows: `bold italic
underline link h2 h3 ul ol clear`. A field in a list is named with `*` for
the row (`'items.*.body'`). Unlisted rich fields get bold and italic; plain
text fields never take formatting (`[]` says so).

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
   "component": "BlocksHours", "label": "Hours", "description": "From settings, open-now indicator",
   "category": "dynamic", "icon": "hours",
   "fields": [ /* as defined */ ],
   "defaults": { /* parsed through the schema: every key present */ },
   "wys": { "headline": [], "items.*.title": [], "items.*.body": [], "note": ["italic"] },
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
unset). The frame rule is read per request, so the variable is a runtime
one: no rebuild when it changes. It draws nothing until the studio speaks. It never fetches content
and never holds a token: the studio sends the page.

Every message is `{ v: 1, type, … }`. The canvas only takes messages from
its parent window at the allowed origin, and only sends to the origin that
first wrote to it; the studio only takes messages from its frame, at the
site's origin.

Studio → canvas

| type | payload |
|---|---|
| `timbrr:doc` | `blocks` (`[{ id, type, hidden, data }]`), `theme` (`{ accent }`), `site` (`{ name, domain, nav, cta? }` — what the site's header and footer draw; below), `mode` (`render`: the page between the site's header and footer; `full`, or missing: the blocks alone), `editable` (`false` when the person can only look: nothing is typed into, dragged or dropped; missing means `true`) — the whole page, on every change |
| `timbrr:select` | `id` or null |
| `timbrr:view` | `scale` — how far the studio scales the frame down to fit; the canvas draws its outlines, tabs and drop zone up by as much, so they read at their real size |
| `timbrr:format` | `tool` (`bold` `italic` `underline` `link` `h2` `h3` `ul` `ol` `clear`), with `href` for `link` (empty takes the link off) — applied to the open rich-text field if it allows that tool, ignored otherwise |
| `timbrr:release` | nothing — the studio's keyboard went somewhere other than the format bar (the inspector, the tray): an open rich-text field goes back to text |
| `timbrr:dragover` | `y` — a block from the studio's tray is over the page, `y` px from its top in the page's own pixels (before any scaling): the canvas puts its drop line where the block would go. A browser lets a drag drop only into documents of the origin it started in, so the studio takes the drop over the frame and says where it is |
| `timbrr:dragleave` | nothing — it left the page; the line goes |
| `timbrr:drop` | `y` — it was let go there; the canvas answers with its own `timbrr:drop` (`kind: add`, `index`), as for a native drop |

Canvas → studio

| type | payload |
|---|---|
| `timbrr:ready` | `manifestVersion` — repeated every 250 ms until the first `timbrr:doc` |
| `timbrr:size` | `height` — the page's height (the page's own, not the window's, so it goes down as well as up); the studio sizes the frame to it |
| `timbrr:click` | `id` of the block clicked, or null; also sent when the caret goes into a field of another block |
| `timbrr:edit` | `id`, `field` (a path: `items.0.title`), `value` — a string for a text field, a rich-text document (`{ type: 'doc', content: […] }`) for an `html` one. The studio takes nothing else |
| `timbrr:focus` | `id`, `field`, `kind` (`text` or `rich`), `label` (the field's name from its definition: `Description`, or `Cards 2 · Title` in a list), `tools` (what the field allows: its `wys` for rich text, none for plain), `active` (the tools on at the caret), `href` (the link at the caret, or null) — when the caret arrives, and again whenever any of it changes |
| `timbrr:blur` | nothing — the caret left the field |
| `timbrr:drop` | `index`, `kind`: `add` (a block from the studio's tray: answering the studio's `timbrr:drop`, or, on a canvas at the studio's own origin, dropped natively as `application/x-timbrr-block`, then with `blockType`) or `move` (with `id`, dragged by the block's tab as `application/x-timbrr-move`) |

In the canvas each block sits in a frame (`.tb-frame`): a quiet outline
under the pointer, and when it's selected a pine outline and a tab in the
corner naming it, which is what you drag it by. Both are drawn over the
block, never around it, so the layout is the site's own. Hidden blocks show
faded with their tab always up, saying so; the live site skips them. While
something is dragged over the page, a pine line marks where it will land,
and a dashed zone after the last block ("Drop a block here") takes it last;
on an empty page that zone is the page. Links don't navigate, and forms
don't send.

**Render and Full.** With `mode: 'render'` and a `site` that has a name
(or at least an address), the page sits between the site's own header and
footer (`<TbSiteHeader>` and `<TbSiteFooter>`, the same components a
site's layout uses; README § Header and footer). They're locked on the
canvas: they carry no block id, can't be selected, typed into or dropped
on, and under the pointer they shade a little and a note says "Header and
footer come from your pages". A drop over the header lands first, over the
footer last. With `mode: 'full'` the blocks are drawn alone.

`site` is plain data: `name`, `domain` (the site's address), `nav` (menu
items, NavItems: `{ label, kind: 'page' | 'external' | 'none', to,
children?, layout?: 'dropdown' | 'mega', desc? }`, one level of children)
and an optional `cta` (one NavItem, the header's button). The canvas keeps
only strings and items of that shape, at most 40 a level; every link
goes through `safeHref()`.

**Preview.** `/__timbrr/canvas?preview=1` draws the page exactly as the
site does, for the studio's previews (the tray's hover preview, the
builder's Preview): no frames, tabs, outlines, notes, typing, drop line or
end zone, and hidden blocks are left out. It provides no canvas context,
so blocks see what they see on the site (`useCanvas()` is null). It takes
`timbrr:doc` (honoring `mode` and `site`; `editable` is ignored) and
nothing else, answers every doc with `timbrr:size` (even an unchanged
one: the frame it's in may have shrunk to measure it), never sends
`timbrr:click`, `timbrr:edit`, `timbrr:focus` or `timbrr:drop`, and its
links don't navigate. It still says `timbrr:ready` until the first doc,
and shows nothing until then.

The studio uses it twice, each with a frame of its own. The tray's hover
preview sends one block, `{ id: 'preview', type, hidden: false, data }`
with the block's defaults, and `mode: 'full'`, in one frame it keeps for
the page view; before each new block it shrinks the frame to measure the
next one, so blocks mustn't size themselves by the viewport (`vh`). The
builder's Preview sends the page without its hidden blocks, the `site`,
`mode: 'render'` and `editable: false`.

## 5. Inline editing

`<TbText :data="data" field="items.0.title" tag="h3" />` draws plain text on
the site and a `contenteditable` (plain text only) in the canvas. Each
keystroke goes to the studio as `timbrr:edit`; the studio's copy comes back
in the next `timbrr:doc`, and is left alone while the field has the caret
so it doesn't jump. Single-line fields end on Enter; `multiline` ones keep
line breaks; a paste comes in as text.

`<TbRich :data="data" field="body" />` draws a rich field, static on the
site. In the canvas it's a text box you can click or tab to, which swaps in
`<TbRichEditor>`: TipTap, on an element with the same class and the same
tags, so nothing on the page moves. TipTap only ever loads there; the site
never fetches it. The editor holds every node and mark TbRich draws, so
formatting a page already has stays, but only the field's own tools work:
its `wys` decides the format bar, the keyboard shortcuts (⌘B, ⌘I, ⌘U),
typed shortcuts (`**bold**`, `- ` for a list, `## ` for a heading) and what
survives a paste. A field without headings or lists ends on Enter
(Shift+Enter breaks the line); one with them takes new paragraphs. Escape
ends either. Every change goes to the studio as a document; a string value
(older pages) becomes one on the first edit.

One field has the caret at a time. It tells the studio with `timbrr:focus`
(the studio's format bar names the block and field and lights its tools)
and `timbrr:blur` when it leaves. The bar's tools come back as
`timbrr:format`; the studio hands the keyboard back to the frame first, so
the caret is where it was. Focus leaving a rich field doesn't close it —
a press on the format bar takes focus for a moment, and the tool comes
straight back — so it stays open until a press or the keyboard moves
somewhere else on the canvas, Escape, or `timbrr:release` from the studio. A new value from
the studio (the inspector) is taken whenever the field doesn't have the
caret.

On the canvas a field with nothing in it shows "Type here", so there's
still something to click. Blocks leave an empty optional field out, as on
the site, except the one being typed into (`useFieldShown()`, from the
`active` field above), so clearing a field to start over doesn't take it
away. Blocks that draw text without `<TbText>` or `<TbRich>` are edited in
the inspector only.
