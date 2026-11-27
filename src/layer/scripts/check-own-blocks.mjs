// Own blocks (the studio's docs/own-blocks.md), with no build:
//   node layer/scripts/check-own-blocks.mjs
// The twin (schema/own-block.js) is the studio's shared/utils/own-block.js,
// byte for byte (STUDIO=<path to the studio's src/app>, else the sibling
// checkout is looked for; skipped, and said, when there's none); its look
// fields are defineBlock's; a block in each layout checks and its defaults
// parse; what can hurt a site is refused.
//
// With --render, it draws them: it starts a stand-in studio on PORT (4998)
// answering for site `demo` with one page holding a block in each layout,
// and reads that page from a site at RENDER (default http://localhost:3011)
// that you started against it:
//   cd starter && NUXT_TIMBRR_API=http://localhost:4998 NUXT_PUBLIC_SITE=demo npx nuxt dev --port 3011
//   node layer/scripts/check-own-blocks.mjs --render
import { deepEqual, equal, ok } from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { basename, join, resolve } from 'node:path';
import { z } from 'zod';
import { defineBlock } from '../schema/define.js';
import { OWN_LOOK_FIELDS, checkOwnBlock, ownBlockDef } from '../schema/own-block.js';

const here = resolve(import.meta.dirname, '..');
const repo = resolve(here, '../..');
let passed = 0;
const pass = (message) => {
 passed += 1;
 console.log(`  ✓ ${message}`);
};

// ── The twin and the look ──
const twinPaths = [process.env.STUDIO && join(process.env.STUDIO, 'shared/utils/own-block.js'), resolve(repo, '../../timbrr-stack', basename(repo), 'src/app/shared/utils/own-block.js'), resolve(repo, '../timbrr/src/app/shared/utils/own-block.js')].filter(Boolean);
const twin = twinPaths.find((path) => existsSync(path));
if (twin) {
 equal(readFileSync(twin, 'utf8'), readFileSync(join(here, 'schema/own-block.js'), 'utf8'), `the studio's copy (${twin}) differs`);
 pass(`the studio's twin is the same file (${twin})`);
} else console.log("  - the studio's twin: no studio checkout found, skipped (set STUDIO)");
const plain = defineBlock({ type: 'x', schema: z.object({}), fields: [] });
deepEqual(OWN_LOOK_FIELDS, plain.fields, 'the look fields drifted from defineBlock');
pass('own blocks get the same look fields as every block');
deepEqual(Object.keys(ownBlockDef(checkOwnBlock(stackBlock()).doc).schema.shape).slice(-5), Object.keys(plain.schema.shape), 'the look keys drifted');
pass('and the same look keys in their data');

// ── A block in each layout ──
function stackBlock() {
 return {
  schema: 1,
  type: 'own_team',
  label: 'Team',
  layout: {
   kind: 'stack',
   align: 'center',
   items: [
    { atom: 'heading', field: 'title', size: 'XL' },
    { atom: 'text', field: 'intro' },
    { kind: 'grid', columns: 3, phone: 2, field: 'people', item: { kind: 'stack', items: [{ atom: 'picture', field: 'people.photo', ratio: '1:1' }, { atom: 'heading', field: 'people.name', size: 'S' }] } },
   ],
  },
  fields: [
   { key: 'title', kind: 'text', label: 'Heading', default: 'Meet the team' },
   { key: 'intro', kind: 'textarea', label: 'Intro', default: 'Who we are.' },
   { key: 'people', kind: 'items', label: 'People', max: 8, phoneMax: 2, fields: [{ key: 'photo', kind: 'image', label: 'Photo' }, { key: 'name', kind: 'text', label: 'Name' }], default: [{ name: 'Sam' }, { name: 'Ana' }, { name: 'Lee' }] },
  ],
 };
}
const splitBlock = {
 schema: 1,
 type: 'own_class_card',
 label: 'Class card',
 layout: {
  kind: 'split',
  ratio: '40/60',
  media: 'right',
  phone: 'text_first',
  slots: {
   media: [{ atom: 'picture', field: 'photo', ratio: '4:3' }],
   text: [{ atom: 'eyebrow', field: 'when' }, { atom: 'heading', field: 'title' }, { kind: 'row', items: [{ atom: 'number', field: 'price' }, { atom: 'tags', field: 'tags' }] }, { atom: 'buttons', field: 'cta' }],
  },
 },
 fields: [
  { key: 'photo', kind: 'image', label: 'Photo' },
  { key: 'when', kind: 'text', label: 'Date line', default: 'Sat, Dec 14' },
  { key: 'title', kind: 'text', label: 'Class name', default: 'Sourdough for beginners' },
  { key: 'price', kind: 'number', label: 'Price', default: 85, prefix: '$' },
  { key: 'tags', kind: 'tags', label: 'Tags', default: ['Beginner'] },
  { key: 'cta', kind: 'buttons', label: 'Button', default: [{ label: 'Book a seat', to: '/book' }] },
 ],
};
const rowBlock = {
 schema: 1,
 type: 'own_stats',
 label: 'Stats',
 layout: { kind: 'row', items: [{ atom: 'number', field: 'a' }, { atom: 'date', field: 'b' }, { atom: 'time', field: 'c' }, { atom: 'icon', field: 'd' }] },
 fields: [
  { key: 'a', kind: 'number', label: 'A', default: 1200, suffix: 'climbers' },
  { key: 'b', kind: 'date', label: 'B', default: '2019-05-01' },
  { key: 'c', kind: 'time', label: 'C', default: '18:30' },
  { key: 'd', kind: 'icon', label: 'D' },
 ],
};
const gridBlock = {
 schema: 1,
 type: 'own_three_up',
 label: 'Three up',
 layout: { kind: 'grid', columns: 3, items: [{ atom: 'heading', field: 'a' }, { atom: 'heading', field: 'b' }, { atom: 'divider' }] },
 fields: [
  { key: 'a', kind: 'text', label: 'A', default: 'First cell' },
  { key: 'b', kind: 'text', label: 'B', default: 'Second cell' },
 ],
};
const blocks = [stackBlock(), splitBlock, rowBlock, gridBlock];
for (const doc of blocks) {
 const checked = checkOwnBlock(structuredClone(doc));
 ok(checked.ok, `${doc.type}: ${JSON.stringify(checked.problems)}`);
 const def = ownBlockDef(checked.doc);
 ok(def.schema.safeParse(def.defaults).success && def.own === checked.doc);
 pass(`${doc.layout.kind}: checks, and its defaults are its data`);
}
for (const [what, doc] of [
 ['a style attribute', { ...stackBlock(), layout: { kind: 'stack', style: 'position:fixed', items: [{ atom: 'heading', field: 'title' }] } }],
 ['a heading level', { ...gridBlock, layout: { kind: 'grid', columns: 3, items: [{ atom: 'heading', field: 'a', level: 1 }, { atom: 'heading', field: 'b' }] } }],
 ['html in a field', { ...gridBlock, fields: [{ key: 'a', kind: 'raw_html', label: 'A' }, gridBlock.fields[1]] }],
 ['a video atom (not yet: it loads a third party)', { ...gridBlock, layout: { kind: 'grid', columns: 2, items: [{ atom: 'video', field: 'a' }, { atom: 'heading', field: 'b' }] } }],
]) {
 ok(!checkOwnBlock(structuredClone(doc)).ok, what);
 pass(`refuses ${what}`);
}

// ── Feedback round eleven: box look, Mobile's own values, quote, carousel, fixed parts ──
{
 const comp = (name) => readFileSync(join(here, 'app/components', name), 'utf8');
 const node = comp('TbOwnNode.vue');
 const atom = comp('TbOwnAtom.vue');
 const block = comp('TbOwnBlock.vue');
 ok(/ownBoxLook/.test(node) && /:style="look\.style"/.test(node), 'TbOwnNode draws a box’s look from ownBoxLook');
 ok(/tb-own__grid--carousel/.test(node) && /scroll-snap-type: x mandatory/.test(block), 'a list with carousel slides, with CSS alone');
 ok(/node\.atom === 'quote'/.test(atom) && /ownAtomLook/.test(atom), 'TbOwnAtom draws a quote, and an atom’s Mobile classes');
 ok(/ownBlockData\(doc\.value, props\.data\)/.test(block), 'a part owners can’t change draws its starting value');
 for (const name of ['tb-own--pad', 'tb-own--radius', 'tb-own--hug', 'tb-own--m-gap', 'tb-own--m-pad', 'tb-own--m-hidden', 'tb-own__split--behind', 'tb-own__quote']) ok(block.includes(`.${name}`), `TbOwnBlock styles .${name}`);
 pass('the round-eleven keys each have their CSS');
 const card = {
  schema: 1,
  type: 'own_card',
  label: 'Card',
  layout: { kind: 'stack', gap: 16, pad: [24, 24, 24, 24], fill: 'soft', corners: 12, mobile: { gap: 8, pad: 16 }, items: [{ atom: 'heading', field: 'title', mobile: { size: 'S' } }, { atom: 'quote', field: 'words' }, { kind: 'grid', columns: 3, carousel: true, field: 'slides', item: { kind: 'stack', pad: 16, fill: 'page', corners: 'site', items: [{ atom: 'text', field: 'slides.name' }] } }] },
  fields: [
   { key: 'title', kind: 'text', label: 'Title', default: 'Youth climbing club', fixed: true },
   { key: 'words', kind: 'textarea', label: 'Quote', default: 'Best afternoon all year.' },
   { key: 'slides', kind: 'items', label: 'Slides', fields: [{ key: 'name', kind: 'text', label: 'Name' }], default: [{ name: 'One' }, { name: 'Two' }] },
  ],
 };
 const checked = checkOwnBlock(structuredClone(card));
 ok(checked.ok, JSON.stringify(checked.problems));
 ok(!ownBlockDef(checked.doc).fields.some((field) => field.key === 'title'), 'a fixed part is not in the inspector');
 pass('a card with numbers, a brand fill, Mobile values, a quote, a carousel and a fixed part checks');
 for (const [what, layout] of [
  ['a pixel string', { ...card.layout, pad: '24px' }],
  ['a raw colour fill', { ...card.layout, fill: '#ff0000' }],
  ['a gap past 160', { ...card.layout, gap: 400 }],
  ['a Mobile key the box can’t take', { ...card.layout, mobile: { columns: 2 } }],
 ]) {
  ok(!checkOwnBlock({ ...structuredClone(card), layout }).ok, what);
  pass(`refuses ${what}`);
 }
}

// ── --render: draw them through a real site ──
if (process.argv.includes('--render')) {
 const port = Number(process.env.PORT ?? 4998);
 const origin = process.env.RENDER ?? 'http://localhost:3011';
 const data = {
  own_team: { people: [{ name: 'Sam', photo: { src: 'https://picsum.photos/seed/a/400/400', alt: 'Sam at the oven' } }, { name: 'Ana', photo: { src: 'https://picsum.photos/seed/b/400/400', alt: '' } }, { name: 'Lee' }] },
  own_class_card: {},
  own_stats: {},
  own_three_up: {},
 };
 const page = {
  id: 'p1',
  title: 'Home',
  path: '/',
  blocks: blocks.map((doc, at) => ({ id: `b${at}`, type: doc.type, data: data[doc.type] })),
  frame: { header: null, footer: null },
  forms: {},
  meta: {},
  ownBlocks: Object.fromEntries(blocks.map((doc) => [doc.type, checkOwnBlock(structuredClone(doc)).doc])),
 };
 const site = { slug: 'demo', name: 'Demo', domain: '', accent: '#c2410c', brand: {}, nav: [], details: null };
 const server = createServer((req, res) => {
  const route = new URL(req.url, 'http://x').pathname.replace(/^\/api\/public\/sites\/demo\//, '');
  res.writeHead(route === 'epoch' || route === 'page' ? 200 : 404, { 'content-type': 'application/json' });
  res.end(JSON.stringify(route === 'epoch' ? { epoch: Date.now() } : route === 'page' ? { site, page } : { statusCode: 404 }));
 }).listen(port);
 try {
  const html = await (await fetch(`${origin}/`)).text();
  if (process.env.DUMP) writeFileSync(process.env.DUMP, html); // DUMP=<file> keeps the page to look at
  for (const kind of ['stack', 'split', 'row', 'grid']) ok(html.includes(`tb-own__${kind}`), `no ${kind} drawn`);
  pass('a site draws a block in each of the four layouts');
  const headings = [...html.matchAll(/<(h[1-6])[^>]*class="[^"]*tb-own__heading/g)].map((m) => m[1]);
  ok(headings.length && headings.every((tag) => tag === 'h2' || tag === 'h3') && headings.filter((tag) => tag === 'h2').length === 3, `headings: ${headings.join(',')}`);
  pass(`heading levels are worked out: each block's first is an h2 (the Stats block has none), the rest h3 (${headings.join(' ')})`);
  ok(html.includes('alt="Sam at the oven"') && !html.includes('seed/b/400/400'), 'alt rule');
  pass('a picture with alt text draws; one with none is left off the live site');
  ok(!/<iframe/.test(html), 'no frame');
  pass('an own block frames nothing (no third party loads)');
  ok(html.includes('$85') && html.includes('1,200 climbers') && html.includes('May 1, 2019') && html.includes('6:30 PM'), 'formats');
  pass('numbers and dates draw in the site’s format');
  ok(html.includes('tb-own__past-phone') && html.includes('tb-own__grid--phone-2') && html.includes('tb-own__split--text-first'), 'phone classes');
  pass('phone rules are on the page: past phoneMax hidden, two on phones, text first');
  ok(!/<[^>]+style="[^"]*position/i.test(html), 'no style from a definition');
  pass('nothing a definition says becomes a style');
 } finally {
  server.close();
 }
}

console.log(`\n${passed} checks passed.`);
