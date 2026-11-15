// The image field's shape: a placement's focal point and zoom are kept in
// range, and a value saved before either existed still parses as it is.
// Run: node scripts/check-image.mjs
import { deepEqual, equal, ok } from 'node:assert/strict';
import { z } from 'zod';
import { imageSchema } from '../schema/define.js';

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
console.log('image: ok', 'additionalProperties' in json ? `(additionalProperties: ${json.additionalProperties})` : '(extra keys allowed)');
