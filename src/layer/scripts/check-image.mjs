// The image field's shape: a placement's focal point and zoom are kept in
// range, and a value saved before either existed still parses as it is.
// `altFrom` says whose alt text it is. mediaSrcset builds the same list as
// before without image delivery, and Cloudflare resizing addresses with it.
// Run: node scripts/check-image.mjs
import { deepEqual, equal, ok } from 'node:assert/strict';
import { z } from 'zod';
import { imageSchema } from '../schema/define.js';
import { mediaSrcset } from '../app/utils/timbrr.js';

const old = { src: 'https://example.com/a.jpg', alt: 'A' };
deepEqual(imageSchema.parse(old), old);
deepEqual(imageSchema.parse({ ...old, focal: { x: 0.2, y: 1 }, zoom: 2.5 }), { ...old, focal: { x: 0.2, y: 1 }, zoom: 2.5 });
for (const bad of [{ zoom: 0.5 }, { zoom: 4.01 }, { zoom: '2' }, { focal: { x: 1.2, y: 0 } }, { focal: { x: -0.1, y: 0 } }]) {
 ok(!imageSchema.safeParse({ ...old, ...bad }).success, JSON.stringify(bad));
}
// What the studio checks saves against (the manifest's JSON Schema).
const json = z.toJSONSchema(imageSchema, { io: 'input', unrepresentable: 'throw' });
equal(json.properties.zoom.minimum, 1);
equal(json.properties.zoom.maximum, 4);
// altFrom: the two markers parse, anything else is refused.
for (const altFrom of ['library', 'page']) equal(imageSchema.parse({ ...old, altFrom }).altFrom, altFrom);
ok(!imageSchema.safeParse({ ...old, altFrom: 'site' }).success, 'an unknown altFrom is refused');
deepEqual(json.properties.altFrom.enum, ['library', 'page']);
// optimize: only `false` is stored (Optimize off); missing is on.
equal(imageSchema.parse({ ...old, optimize: false }).optimize, false);
ok(!imageSchema.safeParse({ ...old, optimize: true }).success, 'optimize: true is never stored');
equal(json.properties.optimize.const, false);

// mediaSrcset: without delivery, today's w480/w960/w1600 list.
const id = 'AbCdEfGhIjKlMnOp';
const master = `https://media.timbrr.app/${id}/0a1b2c3d/master.webp`;
equal(mediaSrcset(master, 2000), `https://media.timbrr.app/${id}/0a1b2c3d/w480.webp 480w, https://media.timbrr.app/${id}/0a1b2c3d/w960.webp 960w, https://media.timbrr.app/${id}/0a1b2c3d/w1600.webp 1600w, ${master} 2000w`);
equal(mediaSrcset(master, 800), `https://media.timbrr.app/${id}/0a1b2c3d/w480.webp 480w, ${master} 800w`);
equal(mediaSrcset(master, 2000, null), mediaSrcset(master, 2000));
// With delivery: each preset width under the picture's, then its own width
// capped at the largest preset.
const delivery = { origin: 'https://harbourbakery.co', widths: [480, 960, 1600], quality: 80 };
const cdn = (w) => `https://harbourbakery.co/cdn-cgi/image/width=${w},quality=80,format=auto,fit=scale-down,metadata=none/${id}/0a1b2c3d/master.webp ${w}w`;
equal(mediaSrcset(master, 2000, delivery), [480, 960, 1600].map(cdn).join(', '));
equal(mediaSrcset(master, 1200, delivery), [480, 960, 1200].map(cdn).join(', '));
ok(mediaSrcset(master, 2000, delivery).includes(`/cdn-cgi/image/width=960,quality=80,format=auto,fit=scale-down,metadata=none/${id}/0a1b2c3d/master.webp 960w`));
// A pasted address, or a library file that isn't the master, gets none either way.
for (const pasted of ['https://example.com/a.jpg', `https://media.timbrr.app/${id}/0a1b2c3d/w960.webp`]) {
 equal(mediaSrcset(pasted, 2000), '');
 equal(mediaSrcset(pasted, 2000, delivery), '');
}
equal(mediaSrcset(master, 0, delivery), '');

console.log('image: ok', 'additionalProperties' in json ? `(additionalProperties: ${json.additionalProperties})` : '(extra keys allowed)');
