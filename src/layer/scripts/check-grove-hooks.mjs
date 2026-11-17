// Checks grove hooks in a site's own code (docs/grove-hooks.md):
//   node layer/scripts/check-grove-hooks.mjs
// defineGroveHook's rules, `format` and `editor` against fixture hook files
// (a folder this script writes, so no site ever ships them), the generated
// #timbrr/grove-hooks module, the manifest's flag, and, when a site is
// running (LAYER, http://localhost:3001 unless set; SKIP_LAYER=1 to skip),
// its /__timbrr/grove-rings and manifest.json. Prints one line per case, or
// the first problem and exits 1.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineGroveHook, editorRings, formatRingValue, groveHookFlags } from '../schema/grove-hooks.js';
import { groveHookFiles, groveHooksModule } from '../modules/grove-hooks.js';

const LAYER = (process.env.LAYER ?? 'http://localhost:3001').replace(/\/$/, '');
const site = mkdtempSync(join(tmpdir(), 'grove-hooks-'));
mkdirSync(join(site, 'grove-hooks'));
const define = pathToFileURL(join(import.meta.dirname, '../schema/grove-hooks.js')).href;
// The fixture: what a site's grove-hooks/ folder holds.
writeFileSync(
 join(site, 'grove-hooks', 'events.js'),
 `import { defineGroveHook } from ${JSON.stringify(define)};
export default defineGroveHook({
 grove: 'events',
 ring: 'price',
 format: (value) => (value === 0 ? 'Free' : '$' + Number(value).toFixed(2)),
 editor: (ring) => ({ label: 'Price (USD)', prepend: '$', min: 0, required: true, key: 'stolen', kind: 'text', options: [] }),
});
`,
);
writeFileSync(
 join(site, 'grove-hooks', 'kinds.js'),
 `import { defineGroveHook } from ${JSON.stringify(define)};
export default defineGroveHook({ grove: 'events', kind: 'date', format: (value) => new Date(value + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }) });
`,
);
writeFileSync(
 join(site, 'grove-hooks', 'broken.js'),
 `import { defineGroveHook } from ${JSON.stringify(define)};
export default defineGroveHook({ grove: 'events', ring: 'note', format: () => { throw new Error('oops'); }, editor: () => { throw new Error('oops'); } });
`,
);
writeFileSync(join(site, 'grove-hooks', 'Not a hook.txt'), 'ignored');

const price = { key: 'price', label: 'Price', kind: 'number', min: 0, max: 1000 };
const starts = { key: 'starts', label: 'Starts', kind: 'date' };
const note = { key: 'note', label: 'Note', kind: 'text' };
const rows = { key: 'rows', label: 'Rows', kind: 'items', subrings: [{ ...price }] };

const cases = {
 'defineGroveHook refuses what it cannot use': () => {
  assert.throws(() => defineGroveHook({ grove: 'Events!', format: () => '' }), /grove/);
  assert.throws(() => defineGroveHook({ grove: 'events' }), /format or an editor/);
  assert.throws(() => defineGroveHook({ grove: 'events', format: 'x' }), /format must be a function/);
  assert.throws(() => defineGroveHook({ grove: 'events', ring: 'Bad key', format: () => '' }), /ring/);
  assert.equal(defineGroveHook({ grove: 'events', format: () => '' }).grove, 'events');
 },
 'the module finds each layer\'s hook files, sorted, and nothing else': () => {
  const files = groveHookFiles(site);
  assert.deepEqual(files.map((file) => file.split('/').at(-1)), ['broken.js', 'events.js', 'kinds.js']);
  assert.deepEqual(groveHookFiles(join(site, 'nowhere')), []);
  const code = groveHooksModule(files);
  assert.match(code, /import hook_0 from ".*broken\.js";/);
  assert.match(code, /export const groveHooks = \[hook_0, hook_1, hook_2\]/);
  assert.match(groveHooksModule([]), /export const groveHooks = \[\]/);
 },
 'the generated module loads, with every hook in it': async () => {
  writeFileSync(join(site, 'grove-hooks.mjs'), groveHooksModule(groveHookFiles(site)));
  const { groveHooks } = await import(pathToFileURL(join(site, 'grove-hooks.mjs')).href);
  assert.equal(groveHooks.length, 3);
  cases.hooks = groveHooks;
 },
 'format: by ring, then by kind; plain words; other groves and rings untouched': () => {
  const hooks = cases.hooks;
  assert.equal(formatRingValue(hooks, price, 12.5, {}, { key: 'events' }), '$12.50');
  assert.equal(formatRingValue(hooks, price, 0, {}, 'events'), 'Free');
  assert.equal(formatRingValue(hooks, starts, '2026-05-01', {}, { key: 'events' }), 'May 1');
  assert.equal(formatRingValue(hooks, price, 12.5, {}, { key: 'classes' }), 12.5);
  assert.equal(formatRingValue(hooks, { ...note, key: 'other' }, 'x', {}, { key: 'events' }), 'x');
  assert.equal(typeof formatRingValue([defineGroveHook({ grove: 'events', format: () => ({ html: '<b>' }) })], note, 'x', {}, { key: 'events' }), 'string');
 },
 'format: a hook that throws is skipped, never the page': () => {
  const quiet = console.error;
  console.error = () => {};
  try {
   assert.equal(formatRingValue(cases.hooks, note, 'Bring shoes', {}, { key: 'events' }), 'Bring shoes');
  } finally {
   console.error = quiet;
  }
 },
 'editor: only the settings a hook may change; key and kind never move; rows too': () => {
  const quiet = console.error;
  console.error = () => {};
  let out;
  try {
   out = editorRings(cases.hooks, { key: 'events' }, [price, note, rows]);
  } finally {
   console.error = quiet;
  }
  assert.equal(out[0].key, 'price');
  assert.equal(out[0].kind, 'number');
  assert.equal(out[0].label, 'Price (USD)');
  assert.equal(out[0].prepend, '$');
  assert.equal(out[0].required, true);
  assert.deepEqual(out[1], note);
  assert.equal(out[2].subrings[0].label, 'Price (USD)');
  assert.deepEqual(editorRings(cases.hooks, { key: 'classes' }, [price]), [price]);
 },
 'the manifest says which kinds of hook the site has': () => {
  assert.deepEqual(groveHookFlags(cases.hooks), { format: true, editor: true });
  assert.deepEqual(groveHookFlags([]), { format: false, editor: false });
  assert.deepEqual(groveHookFlags([defineGroveHook({ grove: 'a', format: () => '' })]), { format: true, editor: false });
 },
 'a running site: the manifest carries the flag': async () => {
  if (process.env.SKIP_LAYER) return 'skipped';
  const manifest = await (await fetch(`${LAYER}/__timbrr/manifest.json`)).json();
  assert.equal(typeof manifest.groveHooks?.format, 'boolean');
  assert.equal(typeof manifest.groveHooks?.editor, 'boolean');
 },
 'a running site: /__timbrr/grove-rings answers rings, and refuses what isn\'t a grove': async () => {
  if (process.env.SKIP_LAYER) return 'skipped';
  const post = (body) => fetch(`${LAYER}/__timbrr/grove-rings`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const answer = await post({ grove: { key: 'events' }, rings: [price, note] });
  assert.equal(answer.status, 200);
  const { rings } = await answer.json();
  assert.deepEqual(rings.map((ring) => [ring.key, ring.kind]), [['price', 'number'], ['note', 'text']]);
  assert.equal((await post({ grove: { key: 'Not a key' }, rings: [] })).status, 400);
  assert.equal((await post({ grove: { key: 'events' }, rings: Array.from({ length: 201 }, () => note) })).status, 400);
  assert.equal((await post({ rings: [] })).status, 400);
 },
};

let failed = false;
try {
 for (const [name, run] of Object.entries(cases)) {
  if (name === 'hooks') continue;
  try {
   const said = await run();
   console.log(`  ✓ ${name}${said === 'skipped' ? ' (skipped)' : ''}`);
  } catch (error) {
   console.log(`  ✗ ${name}\n${error.stack ?? error}`);
   failed = true;
   break;
  }
 }
} finally {
 rmSync(site, { recursive: true, force: true });
}
console.log(failed ? 'check-grove-hooks: failed' : 'check-grove-hooks: ok');
process.exit(failed ? 1 : 0);
