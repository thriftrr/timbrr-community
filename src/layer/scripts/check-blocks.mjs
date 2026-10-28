// Checks block definitions the way the build does, without a build:
//   node layer/scripts/check-blocks.mjs                 every block in layer/blocks
//   node layer/scripts/check-blocks.mjs blocks/hero.js  just these
// Prints one line per block, or the first problem and exits 1.
import { readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildManifest } from '../schema/manifest.js';

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
} catch (error) {
 console.error(`FAIL ${error.message}`);
 process.exit(1);
}
