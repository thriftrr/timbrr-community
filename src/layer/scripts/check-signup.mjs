// node scripts/check-signup.mjs — what the site draws for the Sign-up block
// (the studio's docs/marketing.md): the block's schema and defaults agree,
// the relay posts only to the studio's sign-up route, stays off on dev and
// staging and caps the body, the form carries the hidden bot box and sends
// the consent words, and text_club stays retired. Reads the files; no Nuxt.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

const { default: block } = await import('../blocks/signup.js');
assert.equal(block.type, 'signup');
assert.ok(!block.retired, 'in the tray');
assert.ok(block.schema.safeParse(block.defaults).success, 'defaults fit the schema');
for (const field of block.fields) assert.ok(Object.hasOwn(block.schema.shape, field.key), `${field.key} is in the schema`);
const { default: club } = await import('../blocks/text_club.js');
assert.equal(club.retired, true, 'text_club stays retired');

const relay = read('server/routes/__timbrr/signup.post.js');
assert.match(relay, /\/api\/public\/sites\/\$\{encodeURIComponent\(site\)\}\/signup`/, 'one route relayed');
assert.match(relay, /event\.context\.timbrrPreview \|\|/, 'not on dev or staging');
assert.match(relay, /'Cache-Control': 'no-store'/);
assert.match(relay, /body\.length > 4096/, 'body capped');
assert.match(relay, /'x-timbrr-visitor': visitorAddress\(event\)/);

const view = read('app/components/blocks/Signup.global.vue');
assert.match(view, /\$fetch\('\/__timbrr\/signup'/);
assert.match(view, /hp: hp\.value/, 'the hidden box goes along');
assert.match(view, /consent: props\.data\.consent/, 'the words they agreed to go along');
assert.match(view, /if \(canvas \|\| busy\.value\) return;/, 'the canvas never sends');
assert.match(view, /type="email"/);
assert.ok(!view.includes('v-html'), 'text only');
console.log('check-signup: ok');
