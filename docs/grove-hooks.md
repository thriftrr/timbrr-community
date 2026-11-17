# Grove hooks in a site's own code

A site can change how its saplings' rings are drawn, and what the studio's
sapling editor shows for them, with small functions in its own code. They
run in the site, never in the studio. To check or change a sapling before
it's saved, or to be told after, use a webhook instead (the studio's
`docs/grove-hooks.md`): a webhook is the only hook the studio's server
enforces.

## Where they go

One file per hook, or several hooks' worth of files, in the site's
`grove-hooks/` folder (beside `blocks/`). Each file's default export is
one hook:

```js
// grove-hooks/event-price.js
import { defineGroveHook } from '#timbrr/grove-hook';

export default defineGroveHook({
 grove: 'events', // the grove's key (required)
 ring: 'price', // one ring by its key; or `kind: 'date'` for every ring of a kind; neither: every ring
 format: (value, { ring, sapling, grove }) => (value === 0 ? 'Free' : `$${value.toFixed(2)}`),
 editor: (ring, { grove }) => ({ label: 'Price (USD)', prepend: '$', required: true }),
});
```

`defineGroveHook` is also auto-imported, in the site's pages and its server
alike. The layer's `modules/grove-hooks.js` gathers every layer's
`grove-hooks/*.js` (the site's first) into `#timbrr/grove-hooks` when the
site builds. A hook with no `grove`, or with neither `format` nor `editor`,
fails the build.

## format

`format(value, { ring, sapling, grove })` runs as a ring is drawn on the
site (`TbRingValue`, through `useGroveHooks().format`). Return what to show
in place of the value; it is drawn as plain words, never as markup.
Return `undefined` to leave the ring as Timbrr draws it. The first hook
that matches a ring (by `ring`, else by `kind`) and returns something wins.
A hook that throws is skipped and said in the console; the page still
draws.

`useGroveHooks()` gives `{ hooks, format(ring, value, sapling, grove) }` to
a site's own components too.

## editor

`editor(ring, { grove })` adjusts what the studio's sapling editor shows
for a ring. It may answer any of `label`, `help`, `placeholder`, `prepend`,
`append`, `options`, `min`, `max`, `step`, `default`, `readOnly`, `hidden`
and `required`; anything else (a `key`, a `kind`) is dropped. The studio
then keeps only what doesn't loosen the grove's own rule:

- `required: true` makes a ring needed; nothing makes a needed ring optional.
- `min` and `max` only narrow (a higher minimum, a lower maximum).
- `options` keeps some of the ring's own options, by value, perhaps with
  other words; an option the ring doesn't have is dropped.
- Words are cut to their usual length.

Editor hooks change what the editor shows, not what the studio accepts:
every save is still read against the grove's own rings. To enforce a rule,
use a before webhook.

The manifest says the site has editor hooks (`groveHooks.editor`), and
the studio then asks `POST /__timbrr/grove-rings` with `{ grove: { key,
name, singular }, rings }`, waits up to two seconds, and keeps the answer a
minute. No answer, and the editor shows the grove's rings as they are.

## checkRingPassword

A password ring keeps its value scrambled in the studio, and nothing ever
sends it anywhere. The site's own server can ask whether a visitor's
answer matches:

```js
// server/api/members.post.js, in the site (checkRingPassword is auto-imported)
export default defineEventHandler(async (event) => {
 const { id, pin } = await readBody(event);
 const match = await checkRingPassword(event, { grove: 'members', sapling: id, ring: 'pin', password: pin });
 return { match };
});
```

It calls the studio's developer API (`docs/grove-api.md` in the studio)
with `NUXT_TIMBRR_API_KEY`, a key made under Site settings → Developers
that holds `site:groves.read`. Keep that key in the Worker's secrets: it
never reaches a browser. The studio allows ten tries a sapling and ring an
hour; past that, or when the studio can't be asked, the answer is `false`.

## Checks

`node layer/scripts/check-grove-hooks.mjs` (with the starter running on
`LAYER`, http://localhost:3001 unless set; `SKIP_LAYER=1` without it).
