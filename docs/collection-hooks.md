# Collection hooks in a site's own code

A site can change how its entries' fields are drawn, and what the studio's
entry editor shows for them, with small functions in its own code. They
run in the site, never in the studio. To check or change an entry before
it's saved, or to be told after, use a webhook instead (the studio's
`docs/collection-hooks.md`): a webhook is the only hook the studio's server
enforces.

## Where they go

One file per hook, or several hooks' worth of files, in the site's
`collection-hooks/` folder (beside `blocks/`). Each file's default export is
one hook:

```js
// collection-hooks/event-price.js
import { defineCollectionHook } from '#timbrr/collection-hook';

export default defineCollectionHook({
 collection: 'events', // the collection's key (required)
 field: 'price', // one field by its key; or `kind: 'date'` for every field of a kind; neither: every field
 description: 'Shows 0 as Free and asks for the price in dollars.', // what it is for, in plain words (up to 300 characters); optional
 format: (value, { field, entry, collection }) => (value === 0 ? 'Free' : `$${value.toFixed(2)}`),
 editor: (field, { collection }) => ({ label: 'Price (USD)', prepend: '$', required: true }),
});
```

`defineCollectionHook` is also auto-imported, in the site's pages and its server
alike. The layer's `modules/collection-hooks.js` gathers every layer's
`collection-hooks/*.js` (the site's first) into `#timbrr/collection-hooks` when the
site builds. A hook with no `collection`, or with neither `format` nor `editor`,
fails the build.

`description` is for the people who run the site: the studio's Editor hooks
screen shows it beside the hook. Words only, up to 300 characters; longer
fails the build. A complete example, an editor hook that locks a field, is
`docs/examples/collection-hooks/class-price.js`.

## What the studio reads

The manifest (`docs/manifest.md`, `collectionHooks.list`) lists every hook file,
read when the site builds: its name, where it applies, which functions it has,
its description and its text (the first 8,000 characters, cut with no marker;
`cut: true` says it was). Nothing outside `collection-hooks/` is ever read.

## format

`format(value, { field, entry, collection })` runs as a field is drawn on the
site (`TbFieldValue`, through `useCollectionHooks().format`). Return what to show
in place of the value; it is drawn as plain words, never as markup.
Return `undefined` to leave the field as Timbrr draws it. The first hook
that matches a field (by `field`, else by `kind`) and returns something wins.
A hook that throws is skipped and said in the console; the page still
draws.

`useCollectionHooks()` gives `{ hooks, format(field, value, entry, collection) }` to
a site's own components too.

## editor

`editor(field, { collection })` adjusts what the studio's entry editor shows
for a field. It may answer any of `label`, `help`, `placeholder`, `prepend`,
`append`, `options`, `min`, `max`, `step`, `default`, `readOnly`, `hidden`
and `required`; anything else (a `key`, a `kind`) is dropped. The studio
then keeps only what doesn't loosen the collection's own rule:

- `required: true` makes a field needed; nothing makes a needed field optional.
- `min` and `max` only narrow (a higher minimum, a lower maximum).
- `options` keeps some of the field's own options, by value, perhaps with
  other words; an option the field doesn't have is dropped.
- Words are cut to their usual length.

Editor hooks change what the editor shows, not what the studio accepts:
every save is still read against the collection's own fields. To enforce a rule,
use a before webhook.

The manifest says the site has editor hooks (`collectionHooks.editor`), and
the studio then asks `POST /__timbrr/collection-fields` with `{ collection: { key,
name, singular }, fields }`, waits up to two seconds, and keeps the answer a
minute. No answer, and the editor shows the collection's fields as they are.

## checkFieldPassword

A password field keeps its value scrambled in the studio, and nothing ever
sends it anywhere. The site's own server can ask whether a visitor's
answer matches:

```js
// server/api/members.post.js, in the site (checkFieldPassword is auto-imported)
export default defineEventHandler(async (event) => {
 const { id, pin } = await readBody(event);
 const match = await checkFieldPassword(event, { collection: 'members', entry: id, field: 'pin', password: pin });
 return { match };
});
```

It calls the studio's developer API (`docs/collection-api.md` in the studio)
with `NUXT_TIMBRR_API_KEY`, a key made under Site settings → Developers
that holds `site:collections.read`. Keep that key in the Worker's secrets: it
never reaches a browser. It sends the visitor's address with the check,
and the studio allows each visitor ten tries an entry and field an hour,
under a ceiling of 300 an hour for everyone together. Past that it throws a
429 ("Too many tries. Try again later."), which reaches the visitor as is;
when the studio can't be asked, the answer is `false`.

## Checks

`node layer/scripts/check-collection-hooks.mjs` (with the starter running on
`LAYER`, http://localhost:3001 unless set; `SKIP_LAYER=1` without it).
