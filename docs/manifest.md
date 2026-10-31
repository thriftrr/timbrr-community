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
row, `max` caps it) · `image` (`{ src, alt }`, plus what the studio's media
library knows when the picture came from there, below) · `nav` (a list of
NavItems, one level of children, `max` caps a level; `navListSchema` in
`schema/define.js`. With `single: true` it holds one `{ label, to }`, a
button: an object, not a list, with no children) · `switch` (a boolean, on
or off) · `form` (a form from the site's Forms, by id: the studio's own
picker) · `group` (one object's keys, with `subfields`, folded away until
they're wanted).

**An image** is `{ src, alt }` at least: `src` is an https address or a
path on the site, `alt` what it shows. One picked from the studio's media
library also carries, all optional (`imageSchema` in `schema/define.js`):
`id` (the library's 16-character file id), `width` and `height` (the
pixels of the file `src` points at, 1 to 12,000), `placeholder` (its
ThumbHash, base64, at most 64 characters) and `focal` (`{ x, y }`, each
0 to 1, where the subject is). `<TbImage>` draws more with each key it
finds: `width` and `height` go on the element so the page doesn't shift
while it loads; a `srcset` is built from the address (the library keeps
WebPs at 480, 960 and 1600 wide beside the master, each only when it's
narrower than the master, so the rule is `mediaSrcset` in
`app/utils/timbrr.js`); the placeholder is decoded in the browser and
drawn behind the photo until it's in; and `focal` becomes
`object-position`, so the crop keeps the subject. A pasted address has
none of them and draws as before, and a site on a layer older than these
keys parses them away and ignores them.

**Field flags:** `inline` (drawn through `<TbText>` or `<TbRich>`, so it's
typed into on the canvas), `link` (a text field that holds an address, like
a button's `to`: the studio offers this site's pages or an outside
address; the shared `buttonsField` has it), `ai` (`generate` | `improve` |
`write`, for the studio's writing help, which isn't built yet), `help`,
`placeholder`, `options` (`[{ label, value }]` for `select` and
`buttons`), `single` (for `nav`, above). `select` and `buttons` fields are
the block's style choices: the studio's inspector puts them on its Style
tab.

**`frame: true`** on a definition marks a site's header or footer
(`site_header`, `site_footer`; § 4, Header and footer). The studio keeps
them in its Library, one block to an item, and never offers them in the
tray. Their `fields` are empty: the studio edits them with panels of its
own, chosen by block type.

**`advanced: true`** marks a block the tray offers only on sites staff
turned it on for; the rest of the time a search finds it, off. That's about
keeping the tray short: it's checked in the tray, never on a save, and
turning one off leaves the blocks already on pages alone.

**`retired: true`** marks a block a Core block has replaced. It's never in
the tray, and pages that still hold one keep drawing and saving until
they're converted. A block can't be both. `defineBlock` adds the settings
every block has (`background`, `spacing`, `divider`) to everything except a
frame or a retired block.

**`presets`** is a list of ways to start a block, `[{ key, label,
description?, data }]`. A preset's `data` goes over the block's `defaults`,
and the build fails if the result doesn't fit the schema. **`keywords`** is
a list of more words the tray's search finds the block by. The manifest
passes all four through as they are, and leaves out what a block doesn't
set.

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
 "widgets": ["text", "textarea", "html", "select", "buttons", "items", "image", "nav", "switch", "group"],
 "blocks": [
  {
   "type": "hours", "tier": "base", "owner": null, "layer": "@timbrr/community",
   "component": "BlocksHours", "label": "Hours", "description": "From settings, open-now indicator",
   "category": "dynamic", "icon": "hours",
   // "frame": true on a site_header or site_footer; "advanced": true, "retired": true,
   // "presets": [ ... ] and "keywords": [ ... ] the same way: left out unless set
   "fields": [ /* as defined */ ],
   "defaults": { /* parsed through the schema: every key present */ },
   "wys": { "headline": [], "items.*.title": [], "items.*.body": [], "note": ["italic"] },
   "schema": { /* JSON Schema 2020-12, from z.toJSONSchema (input side) */ }
  }
 ]
}
```

A layer's tier is its `package.json` → `timbrr.tier`; anything undeclared
is `private`. A block's tier, which picks its shelf in the studio's tray,
follows from that and the definition's `owner` (the brand that
commissioned it):

- `private`: the block comes from a private layer (the site's own code).
- `community`: a shared layer's block with an `owner`, commissioned by one
  site and shared with every site.
- `base`: a shared layer's block with no owner, Timbrr's own library. Every
  block in `@timbrr/community` is `base` today.

A type defined twice, an unknown category or widget, a field the schema
doesn't have (a list's row fields included), an `items` or `nav` field
whose schema isn't a list of objects (an object, for a `single` one), or
defaults that don't parse fail the build.

## 3. What the studio does with it

The studio fetches the manifest from the site's canvas origin, caches it,
and builds the block tray and the inspector from it. Every save is checked
against it: a block type the site doesn't have, or data that doesn't fit
the block's `schema`, is refused (422). The site re-checks on render: a
value that doesn't fit (an older shape, a hand edit) shows its field's
default, and only that value, field by field and row by row, so the rest
of the block stays as it is. Data that isn't the block's at all falls back
to the block's defaults rather than breaking the page. The canvas stops
typing at a text field's `max`, as the inspector does, so a field can't
be typed past what the studio will save.

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
| `timbrr:doc` | `blocks` (`[{ id, type, hidden, data, lock? }]`; `lock` below), `theme` (`{ accent }`), `site` (`{ name, domain, nav, cta?, details?, frame? }` — what the site's header and footer draw; below), `forms` (`{ [id]: form }`, what Form blocks and a footer draw, § Forms), `mode` (`render`: the page between the site's header and footer; `full`, or missing: the blocks alone), `editable` (`false` when the person can only look: nothing is typed into, dragged or dropped; missing means `true`), `library` (`false` when the person can't open the Library: no Edit in Library pill, and a double-click does nothing; missing means `true`), `endZone` (`false` when the document takes no more blocks, like a Library header, which holds one: no dashed zone after the last block; missing means `true`), `stage` (`true` only for a Library header or footer: the first block goes on the stage instead of the page, below; missing means `false`) — the whole page, on every change |
| `timbrr:select` | `id` or null. A placement's id selects all of its blocks |
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
| `timbrr:size` | `height` — the page's height (the page's own, not the window's, so it goes down as well as up), measured again after every `timbrr:doc` and sent when it changed; the studio sizes the frame to it. Never sent from the stage, whose frame has a fixed height |
| `timbrr:click` | `id` of the block clicked, or null (a locked block's own `<placement id>.<block id>`); also sent when the caret goes into a field of another block. A click on the site's header or footer in Render view has a null `id` and `side`, `header` or `footer` |
| `timbrr:edit` | `id`, `field` (a path: `items.0.title`), `value` — a string for a text field, a rich-text document (`{ type: 'doc', content: […] }`) for an `html` one. The studio takes nothing else |
| `timbrr:focus` | `id`, `field`, `kind` (`text` or `rich`), `label` (the field's name from its definition: `Description`, or `Cards 2 · Title` in a list), `tools` (what the field allows: its `wys` for rich text, none for plain), `active` (the tools on at the caret), `href` (the link at the caret, or null) — when the caret arrives, and again whenever any of it changes |
| `timbrr:blur` | nothing — the caret left the field |
| `timbrr:drop` | `index`, `kind`: `add` (a block from the studio's tray: answering the studio's `timbrr:drop`, or, on a canvas at the studio's own origin, dropped natively as `application/x-timbrr-block`, then with `blockType`) or `move` (with `id`, dragged by the block's tab as `application/x-timbrr-move`). `index` counts the blocks as drawn, and is never inside a locked chunk |
| `timbrr:open` | `id` — the placement: Edit in Library was pressed on it, or it was double-clicked. Sent whether or not the canvas is editable |
| `timbrr:locked` | `id` — the placement: a printable key (no Ctrl or Meta, not held down) was pressed while it was selected, on an editable canvas, with no field open. The studio says why nothing happened |
| `timbrr:flag` | Nothing else: F was pressed in the frame (no Ctrl, Meta, Alt or Shift) with no field open. Keys pressed here never reach the studio, so this is how it opens its Flag something panel. Goes first: such a key doesn't also send `timbrr:locked` |

In the canvas each block sits in a frame (`.tb-frame`): a quiet outline
under the pointer, and when it's selected a pine outline and a tab in the
corner naming it, which is what you drag it by. Both are drawn over the
block, never around it, so the layout is the site's own. Hidden blocks show
faded with their tab always up, saying so; the live site skips them. While
something is dragged over the page, a pine line marks where it will land,
and a dashed zone after the last block ("Drop a block here") takes it last,
unless the studio turned it off with `endZone: false`; on an empty page that
zone is the page. Links don't navigate, and forms
don't send.

**Render and Full.** With `mode: 'render'` and a `site` that has a name
(or at least an address), the page sits between the site's own header and
footer (`<TbSiteHeader>` and `<TbSiteFooter>`, the same components a
site's layout uses; README § Header and footer). They're locked on the
canvas: they carry no block id, can't be selected, typed into or dropped
on, and under the pointer they shade a little and a note says where they
come from ("Header comes from your pages", or "… from the Library" when
the page has a frame, below), adding "· click to open" unless `library` is
`false`. A click on either tells the studio which, with `side` on
`timbrr:click`; the note is a button, so Tab and Enter do the same. A side
the page turned off draws neither. A
drop over the header lands first, over the footer last. With `mode:
'full'` the blocks are drawn alone.

`site` is plain data: `name`, `domain` (the site's address), `nav` (menu
items, NavItems: `{ label, kind: 'page' | 'external' | 'none', to,
children?, layout?: 'link' | 'dropdown' | 'mega', desc?, group? }`, one
level of children), an optional `cta` (one NavItem, the header's button) and
an optional `details` (Site details: `{ phone, email, street, city, region,
postal, timezone, note, hours: [{ closed, open, close }] }`, null from an
older studio). The canvas keeps only strings and items of that shape, at
most 40 a level, and at most seven rows of hours; every link goes through
`safeHref()`. It works out one thing itself, `overHero`: whether the page's
first block is a full-bleed Hero, the one thing a see-through header can sit
over. `useTimbrrPage` does the same on a published page.

**NavItem `layout`** says how an item opens: `link` draws no menu (its
children are kept, not drawn, so switching to a link and back loses
nothing), `dropdown` a list under it, `mega` a big menu. Missing is a
dropdown with children and a link without. **`group`**, on a child, is its
column in a big menu. Children without one go in a column headed "More" when
any sibling has one; with none at all they run in three flat columns.

**Header and footer.** `site.frame` is `{ header, footer }`, what this page
has from the studio's Library. Each side is a frame's data (below), `null`
or missing (draw from `nav` and `cta`, as above) or `false` (the page has
none: draw nothing). The canvas brings frame data down to what its schema
holds, and never merges it into `nav` or `cta`. `<TbSiteHeader>` and
`<TbSiteFooter>` read it, on the canvas and on a published page alike, where
it comes from `page.frame` (`useTimbrrPage` puts it on `site`). An answer
without it behaves like `null`, and a site with no frame becomes header data
with the defaults (`headerFromSite`), so there's one way of drawing them.

`headerSchema` and `footerSchema` are in `schema/frames.js`:

```js
// site_header
{
 layout: 'left',                       // 'left' | 'center' | 'button'
 logo: { src: '', alt: '' },           // an image field; empty draws the site's name
 announce: { on: false, text: '', to: '' },  // text 200
 utility: { on: false, links: [] },    // NavEntry[] (a NavItem without children), 6 at most
 menu: [],                             // NavItem[]
 primary: { label: '', to: '' },
 secondary: { label: '', to: '' },
 icons: {
  search: { on: false, to: '' },
  account: { on: false, to: '' },
  cart: { on: false, to: '' },
  phone: { on: false },                // the number from site.details
  language: { on: false, to: '', label: '' },  // label empty reads EN
 },
 sticky: 'never',                      // 'never' | 'always' | 'up'
 transparent: false,
 phone: {
  style: 'accordion',                  // 'accordion' | 'drill' | 'full'
  pins: { button: false, phone: false, cart: false },
 },
}

// site_footer
{
 layout: 'columns',                    // 'columns' | 'centered' | 'slim'
 columns: [],                          // NavItem[]: an item with children is a headed column
 newsletter: { on: false, headline: '', label: '', to: '' },  // words and a link, not a form
 contact: { hours: false, address: false, phone: false },     // from site.details
 social: [],                           // [{ network, to }], 6 at most;
                                       // network: instagram | facebook | x | youtube | linkedin | tiktok
 legal: '',                            // 300; empty draws "© year name"
 legal_links: [],                      // NavEntry[], 4 at most
}
```

A frame saved in the shape before this one (`style`, `cta`, `bar`; a
footer's `style`) still draws: the components read everything through
`upgradeHeader` and `upgradeFooter`, pure functions that return the new
shape and hand new-shape data back untouched. `layout` is what marks the new
shape. `transparent` only applies with `overHero`, and draws solid otherwise.
It goes solid after 30px of scroll or while a menu is open, and while it
applies the header sets `--tb-header-height` on the document root, so a
full-bleed Hero can pad for it.

The two blocks draw through those same components, so what's built in the
Library is what a page shows. They read the site's name and details from
`TIMBRR_SITE_KEY` (`useTimbrrSite()`), which the canvas provides in every
mode; with no site to read, as on the starter's block shelf, the name is
"Your site". Nothing in them is typed in place.

**The stage.** A Library header or footer is previewed, not edited on the
canvas, so with `stage: true` the first block (a `site_header` or
`site_footer`; anything else draws as usual) goes on a stand-in page instead
of the blocks: a striped hero and placeholder rows, tall enough to scroll,
with the frame drawn by `<TbFrameStage>` through the same component a page
uses. Its `site` is the one sent, with `frame: { [side]: <the block's data> }`
and `overHero: true`, so a see-through header always has something to sit
over. There are no block frames, no selection, no typing and no drops, and
clicking never sends `timbrr:click`, so the studio's panel stays open. The
header's own controls work and links still don't go anywhere. The frame's
document scrolls, so sticky, slide-away and see-through run as on a live
page, which is why the studio gives this frame a fixed height, and why the
canvas sends no `timbrr:size` here. Its width is what the header's phone
menu goes by, under 860px.

**Locked blocks.** A block of a global block or global template has an id of
`<placement id>.<block id>` and carries
`lock: { id, itemId, kind, name, index, count }`: `id` its placement,
`itemId` the Library item, `kind` the item's kind, `name` its saved name,
`index` and `count` its place among the placement's drawn blocks. A dot
can't appear in a stored id, so `id.split('.')[0]` is always the placement.
Adding `lock` doesn't change the manifest version.

- It draws as the site does: `TbBlockScope` re-provides the canvas to what's
  inside it with `editable` false, so nothing is typed into, and blocks that
  change their drawing for editing don't.
- All of a placement's blocks are one piece, a chunk. Its frames carry
  `data-lock-id`. Any id in the chunk selects all of it, whether that's a
  block's own id from a click or the placement's from `timbrr:select`. One
  ink outline runs around the chunk.
- The first block carries the ink tab: the saved name, a link glyph and an
  Edit in Library pill on hover, with the pointer anywhere over the chunk.
  It stays up, and it's what the whole chunk is dragged by, sending the
  first block's id as `move`, unless the canvas isn't editable.
- The drop line never goes inside a chunk: an edge there moves to the
  chunk's nearer end, and that's the `index` sent.
- A preview draws locked blocks like any others.

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
builder's Preview sends the page without its hidden blocks, the `site`
(with the page's `frame`), `mode: 'render'` and `editable: false`.

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

## 7. Forms

A Form block holds a form's id, in `form`, and a footer's newsletter can too.
The form itself is the studio's (its `docs/forms.md`). The studio sends each
form a page shows in `page.forms`, `{ [id]: form }`, on the page answers, and
`forms` on `timbrr:doc` in the canvas. `useTimbrrForms()` keeps them and
`TbForm` draws one. A form in there is only what a visitor may see: fields,
button words and whether the Human check runs. A studio or a page that sends
none draws nothing for the block.

The browser posts to the site's own `POST /__timbrr/forms/:id`, as JSON
`{ answers, page, elapsed, trap, token }`, or multipart with that as `payload`
and each upload as `file:<fieldId>`. It's relayed to the studio as it came, with
the visitor's address in `x-timbrr-visitor`, and the answer comes back unchanged:

| Status | Body | Means |
|---|---|---|
| 200 | `{ ok, after: 'message', message }` | Taken: show the rich-text `message` |
| 200 | `{ ok, after: 'redirect', to }` | Taken: go to the page at `to` |
| 422 | `{ errors: { [fieldId]: words } }` | An answer is wrong |
| 428 | `{ challenge, siteKey }` | Pass Turnstile, then send again with `token` |
| 404 | `{ statusCode, message }` | No such form here |

`app/utils/forms.js` is a copy of the rules a visitor sees, so mistakes show
without waiting. The studio's `scripts/check-forms.mjs` holds it to the studio's
own, so change them together.

A block's old `purpose` and words stay in its schema until a later release, for
pages not yet converted, and draw through `TbFormLegacy`.
