// Checks block definitions the way the build does, without a build:
//   node layer/scripts/check-blocks.mjs                 every block in layer/blocks
//   node layer/scripts/check-blocks.mjs blocks/hero.js  just these
// Prints one line per block, or the first problem and exits 1.
import { readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildManifest } from '../schema/manifest.js';
import { fieldsThatApply } from '../app/utils/when.js';

// A block must not draw what it hides (docs/manifest.md § Conditional
// fields). Code can't read a component, so these are the cases where a
// component draws a field under data its `when` was once wrong about:
// [type, data, path to the field that must show]. A path is key.key for a
// group's subfield.
const DRAWN = [
 // An embed link with no player draws the photo (Media.global.vue).
 ['media', { kind: 'embed' }, 'image'],
 // The map links to the typed address; Open now is off for typed hours (Visit.global.vue).
 ['visit', { show: ['map'] }, 'custom.address'],
 ['visit', { show: ['open_now'] }, 'custom.hours'],
];

function checkDrawnShown(blocks) {
 for (const [type, data, path] of DRAWN) {
  const block = blocks.find((entry) => entry.type === type);
  if (!block) continue;
  const root = { ...block.defaults, ...data };
  const [key, sub] = path.split('.');
  const field = fieldsThatApply(block.fields, root).find((entry) => entry.key === key);
  const shown = field && (!sub || fieldsThatApply(field.subfields, root[key] ?? {}, root).some((entry) => entry.key === sub));
  if (!shown) throw new Error(`${type} draws ${path} for ${JSON.stringify(data)}, but hides its field`);
 }
}

const layerDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const files = args.length
 ? args.map((file) => resolve(process.cwd(), file))
 : readdirSync(join(layerDir, 'blocks'))
    .filter((file) => /\.m?js$/.test(file))
    .sort()
    .map((file) => join(layerDir, 'blocks', file));

const layer = { name: '@timbrr/community', version: '0.0.0', tier: 'community' };
try {
 const definitions = [];
 for (const file of files) {
  const mod = await import(pathToFileURL(file).href);
  if (!mod.default) throw new Error(`${basename(file)} has no default export`);
  definitions.push({ def: mod.default, layer });
 }
 const manifest = buildManifest('check', [layer], definitions);
 for (const block of manifest.blocks) {
  console.log(`ok  ${block.type.padEnd(16)} ${block.category.padEnd(8)} ${block.fields.length} fields  ${block.label}`);
 }
 checkDrawnShown(manifest.blocks);
} catch (error) {
 console.error(`FAIL ${error.message}`);
 process.exit(1);
}
