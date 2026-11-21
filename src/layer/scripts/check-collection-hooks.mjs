// Checks collection hooks in a site's own code (docs/collection-hooks.md):
//   node layer/scripts/check-collection-hooks.mjs
// defineCollectionHook's rules, `format` and `editor` against fixture hook files
// (a folder this script writes, so no site ever ships them), the generated
// #timbrr/collection-hooks module, the manifest's flag, and, when a site is
// running (LAYER, http://localhost:3001 unless set; SKIP_LAYER=1 to skip),
// its /__timbrr/collection-fields and manifest.json. Prints one line per case, or
// the first problem and exits 1.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineCollectionHook, editorFields, formatFieldValue, collectionHookFlags, collectionHookList } from '../schema/collection-hooks.js';
import { buildManifest } from '../schema/manifest.js';
import { collectionHookFiles, collectionHookSourcesModule, collectionHooksModule, hookSource } from '../modules/collection-hooks.js';

const LAYER = (process.env.LAYER ?? 'http://localhost:3001').replace(/\/$/, '');
const site = mkdtempSync(join(tmpdir(), 'collection-hooks-'));
mkdirSync(join(site, 'collection-hooks'));
const define = pathToFileURL(join(import.meta.dirname, '../schema/collection-hooks.js')).href;
// The fixture: what a site's collection-hooks/ folder holds.
writeFileSync(
 join(site, 'collection-hooks', 'events.js'),
 `import { defineCollectionHook } from ${JSON.stringify(define)};
export default defineCollectionHook({
 collection: 'events',
 field: 'price',
 description: 'Shows 0 as Free.',
 format: (value) => (value === 0 ? 'Free' : '$' + Number(value).toFixed(2)),
 editor: (field) => ({ label: 'Price (USD)', prepend: '$', min: 0, required: true, key: 'stolen', kind: 'text', options: [] }),
});
`,
);
writeFileSync(
 join(site, 'collection-hooks', 'kinds.js'),
 `import { defineCollectionHook } from ${JSON.stringify(define)};
export default defineCollectionHook({ collection: 'events', kind: 'date', format: (value) => new Date(value + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }) });
`,
);
writeFileSync(
 join(site, 'collection-hooks', 'broken.js'),
 `import { defineCollectionHook } from ${JSON.stringify(define)};
export default defineCollectionHook({ collection: 'events', field: 'note', format: () => { throw new Error('oops'); }, editor: () => { throw new Error('oops'); } });
`,
);
writeFileSync(join(site, 'collection-hooks', 'Not a hook.txt'), 'ignored');

const price = { key: 'price', label: 'Price', kind: 'number', min: 0, max: 1000 };
const starts = { key: 'starts', label: 'Starts', kind: 'date' };
const note = { key: 'note', label: 'Note', kind: 'text' };
const rows = { key: 'rows', label: 'Rows', kind: 'items', subfields: [{ ...price }] };

const cases = {
 'defineCollectionHook refuses what it cannot use': () => {
  assert.throws(() => defineCollectionHook({ collection: 'Events!', format: () => '' }), /collection/);
  assert.throws(() => defineCollectionHook({ collection: 'events' }), /format or an editor/);
  assert.throws(() => defineCollectionHook({ collection: 'events', format: 'x' }), /format must be a function/);
  assert.throws(() => defineCollectionHook({ collection: 'events', field: 'Bad key', format: () => '' }), /field/);
  assert.equal(defineCollectionHook({ collection: 'events', format: () => '' }).collection, 'events');
  assert.throws(() => defineCollectionHook({ collection: 'events', description: 'x'.repeat(301), format: () => '' }), /description/);
  assert.throws(() => defineCollectionHook({ collection: 'events', description: 7, format: () => '' }), /description/);
  assert.equal(defineCollectionHook({ collection: 'events', description: 'x'.repeat(300), format: () => '' }).description.length, 300);
 },
 'the module finds each layer\'s hook files, sorted, and nothing else': () => {
  const files = collectionHookFiles(site);
  assert.deepEqual(files.map((file) => file.split('/').at(-1)), ['broken.js', 'events.js', 'kinds.js']);
  assert.deepEqual(collectionHookFiles(join(site, 'nowhere')), []);
  const code = collectionHooksModule(files);
  assert.match(code, /import hook_0 from ".*broken\.js";/);
  assert.match(code, /export const collectionHooks = \[hook_0, hook_1, hook_2\]/);
  assert.match(collectionHooksModule([]), /export const collectionHooks = \[\]/);
 },
 'the generated module loads, with every hook in it': async () => {
  writeFileSync(join(site, 'collection-hooks.mjs'), collectionHooksModule(collectionHookFiles(site)));
  writeFileSync(join(site, 'collection-hook-sources.mjs'), collectionHookSourcesModule(collectionHookFiles(site)));
  const { collectionHooks } = await import(pathToFileURL(join(site, 'collection-hooks.mjs')).href);
  const { collectionHookSources } = await import(pathToFileURL(join(site, 'collection-hook-sources.mjs')).href);
  assert.doesNotMatch(collectionHooksModule(collectionHookFiles(site)), /source/);
  assert.equal(collectionHooks.length, 3);
  assert.equal(collectionHookSources.length, 3);
  cases.hooks = collectionHooks;
  cases.sources = collectionHookSources;
 },
 'format: by field, then by kind; plain words; other collections and fields untouched': () => {
  const hooks = cases.hooks;
  assert.equal(formatFieldValue(hooks, price, 12.5, {}, { key: 'events' }), '$12.50');
  assert.equal(formatFieldValue(hooks, price, 0, {}, 'events'), 'Free');
  assert.equal(formatFieldValue(hooks, starts, '2026-05-01', {}, { key: 'events' }), 'May 1');
  assert.equal(formatFieldValue(hooks, price, 12.5, {}, { key: 'classes' }), 12.5);
  assert.equal(formatFieldValue(hooks, { ...note, key: 'other' }, 'x', {}, { key: 'events' }), 'x');
  assert.equal(typeof formatFieldValue([defineCollectionHook({ collection: 'events', format: () => ({ html: '<b>' }) })], note, 'x', {}, { key: 'events' }), 'string');
 },
 'format: a hook that throws is skipped, never the page': () => {
  const quiet = console.error;
  console.error = () => {};
  try {
   assert.equal(formatFieldValue(cases.hooks, note, 'Bring shoes', {}, { key: 'events' }), 'Bring shoes');
  } finally {
   console.error = quiet;
  }
 },
 'editor: only the settings a hook may change; key and kind never move; rows too': () => {
  const quiet = console.error;
  console.error = () => {};
  let out;
  try {
   out = editorFields(cases.hooks, { key: 'events' }, [price, note, rows]);
  } finally {
   console.error = quiet;
  }
  assert.equal(out[0].key, 'price');
  assert.equal(out[0].kind, 'number');
  assert.equal(out[0].label, 'Price (USD)');
  assert.equal(out[0].prepend, '$');
  assert.equal(out[0].required, true);
  assert.deepEqual(out[1], note);
  assert.equal(out[2].subfields[0].label, 'Price (USD)');
  assert.deepEqual(editorFields(cases.hooks, { key: 'classes' }, [price]), [price]);
 },
 'the manifest says which kinds of hook the site has': () => {
  assert.deepEqual(collectionHookFlags(cases.hooks), { format: true, editor: true });
  assert.deepEqual(collectionHookFlags([]), { format: false, editor: false });
  assert.deepEqual(collectionHookFlags([defineCollectionHook({ collection: 'a', format: () => '' })]), { format: true, editor: false });
 },
 'the manifest lists each hook file with its words and text': () => {
  const list = collectionHookList(cases.sources);
  assert.deepEqual(list.map((one) => one.file), ['collection-hooks/broken.js', 'collection-hooks/events.js', 'collection-hooks/kinds.js']);
  const events = list.find((one) => one.file.endsWith('events.js'));
  assert.deepEqual({ ...events, source: '' }, { file: 'collection-hooks/events.js', collection: 'events', field: 'price', kind: null, format: true, editor: true, description: 'Shows 0 as Free.', source: '' });
  assert.match(events.source, /defineCollectionHook/);
  assert.equal('cut' in events, false);
  const kinds = list.find((one) => one.file.endsWith('kinds.js'));
  assert.deepEqual([kinds.field, kinds.kind, kinds.format, kinds.editor, kinds.description], [null, 'date', true, false, '']);
  assert.deepEqual(collectionHookList([]), []);
  const layer = { name: 'check', version: '0.0.0', tier: 'community' };
  const manifest = buildManifest('check', [layer], [], cases.hooks, cases.sources);
  assert.deepEqual(Object.keys(manifest.collectionHooks).sort(), ['editor', 'format', 'list']);
  assert.equal(manifest.version, 1);
  assert.deepEqual(buildManifest('check', [layer], []).collectionHooks, { format: false, editor: false, list: [] });
 },
 'a long file is cut at 8000 characters, with no marker, and says so': () => {
  const long = join(site, 'collection-hooks', 'long.txt');
  writeFileSync(long, `${'a'.repeat(7999)}😀${'b'.repeat(50)}`);
  const cut = hookSource(long);
  assert.equal(cut.cut, true);
  assert.equal(cut.source, 'a'.repeat(7999));
  writeFileSync(long, 'a'.repeat(8000));
  assert.deepEqual([hookSource(long).cut, hookSource(long).source.length], [false, 8000]);
 },
 'a running site: the manifest carries the flag': async () => {
  if (process.env.SKIP_LAYER) return 'skipped';
  const manifest = await (await fetch(`${LAYER}/__timbrr/manifest.json`)).json();
  assert.equal(typeof manifest.collectionHooks?.format, 'boolean');
  assert.equal(typeof manifest.collectionHooks?.editor, 'boolean');
 },
 'a running site: /__timbrr/collection-fields answers fields, and refuses what isn\'t a collection': async () => {
  if (process.env.SKIP_LAYER) return 'skipped';
  const post = (body) => fetch(`${LAYER}/__timbrr/collection-fields`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const answer = await post({ collection: { key: 'events' }, fields: [price, note] });
  assert.equal(answer.status, 200);
  const { fields } = await answer.json();
  assert.deepEqual(fields.map((field) => [field.key, field.kind]), [['price', 'number'], ['note', 'text']]);
  assert.equal((await post({ collection: { key: 'Not a key' }, fields: [] })).status, 400);
  assert.equal((await post({ collection: { key: 'events' }, fields: Array.from({ length: 201 }, () => note) })).status, 400);
  assert.equal((await post({ fields: [] })).status, 400);
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
console.log(failed ? 'check-collection-hooks: failed' : 'check-collection-hooks: ok');
process.exit(failed ? 1 : 0);
