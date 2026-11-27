import { z } from 'zod';

// Own blocks (docs/own-blocks.md): a block an owner makes on the site, kept as
// a small JSON document and drawn by one interpreter in the layer (TbOwnBlock),
// never as code. This file has a twin in timbrr-community
// (src/layer/schema/own-block.js) and the two must stay the same, byte for
// byte: scripts/check-own-blocks.mjs in each repo diffs them. It imports zod
// alone, so it runs in the studio, the layer and a check script.
//
//  checkOwnBlock(doc, { pro })  the document against schema 1: { ok, problems, doc }
//  ownBlockFields(doc)          the inspector fields, as a manifest names them
//  ownBlockSchema(doc)          the zod schema of a placed block's data
//  ownBlockManifestEntry(doc)   the block as the studio's manifest lists it
//  ownBlockDef(doc)             the block as the layer's renderer takes it
//  ownBlockWarnings(doc, data)  what a placed block's content is missing (alt, link words)
//  ownBlockData(doc, data)      what a placed block draws: its data, with the parts owners can't change at their starting values
//  ownBoxLook(node)             a box's look as the layer draws it: classes, and the custom properties its numbers become
//  ownAtomLook(node)            an atom's Mobile classes

export const OWN_BLOCK_VERSION = 1;
export const OWN_TYPE = /^own_[a-z0-9_]{1,44}$/;
export const OWN_KEY = /^[a-z][a-z0-9_]{0,39}$/;
export const OWN_BLOCK_LIMITS = Object.freeze({
 blocks: 25,
 fields: 30,
 nodes: 60,
 depth: 3,
 bytes: 64 * 1024,
 columns: 4,
 rowItems: 4,
 buttons: 3,
 items: 24,
 tags: 6,
 label: 60,
 help: 140,
 description: 200,
 category: 40,
 // Spacing and corners typed as numbers (the builder's "Lay it out"): whole pixels, from 0.
 space: 160,
 radius: 64,
});
export const OWN_LAYOUTS = ['stack', 'row', 'grid', 'split'];
// The tray's five groups; any other category ("Events") is kept and shown as Content.
const MANIFEST_CATEGORIES = ['content', 'common', 'layout', 'dynamic', 'cta'];

// Style is a choice from a Branding scale, never a value.
const SCALES = {
 color: ['heading', 'ink', 'body', 'muted', 'eyebrow', 'accent'],
 font: ['display', 'body', 'mono'],
 weight: ['regular', 'strong'],
 corners: ['none', 'site', 'round'],
 shadow: ['none', 'soft', 'strong'],
 gap: ['S', 'M', 'L'],
 align: ['start', 'center', 'end'],
 // A box's fill is a Branding surface; brand and dark repaint what's inside, as a band does.
 fill: ['none', 'page', 'soft', 'brand', 'dark'],
 // Fill the room it's given, or hug what it holds.
 sizing: ['fill', 'hug'],
 justify: ['start', 'center', 'end', 'between'],
};
// Gap and padding are a Branding step (S, M, L) or whole pixels; corners a
// Branding choice or whole pixels. Numbers become custom properties the
// layer's CSS reads (ownBoxLook), never a style string.
const isPx = (value, max = OWN_BLOCK_LIMITS.space) => Number.isInteger(value) && value >= 0 && value <= max;
const spaceOk = (value) => SCALES.gap.includes(value) || isPx(value);
const padOk = (value) => isPx(value) || (Array.isArray(value) && value.length === 4 && value.every((side) => isPx(side)));
const radiusOk = (value) => SCALES.corners.includes(value) || isPx(value, OWN_BLOCK_LIMITS.radius);
export const OWN_RATIOS = ['1:1', '4:3', '3:2', '16:9', '3:4', '2:3', 'auto'];

// Every atom: the field kinds it draws (null: no field, it's layout), the
// style keys it takes, its sizes, and for text its default and largest `max`.
export const OWN_ATOMS = {
 eyebrow: { kinds: ['text'], keys: ['color', 'font', 'align'], max: [40, 80] },
 heading: { kinds: ['text'], keys: ['size', 'color', 'font', 'weight', 'align'], sizes: ['S', 'M', 'L', 'XL'], max: [70, 120] },
 quote: { kinds: ['text', 'textarea'], keys: ['size', 'color', 'font', 'align'], sizes: ['S', 'M', 'L'], max: [200, 600] },
 text: { kinds: ['text', 'textarea'], keys: ['size', 'color', 'font', 'weight', 'align'], sizes: ['S', 'M'], max: [280, 1200] },
 rich: { kinds: ['html'], keys: ['size', 'color'], sizes: ['S', 'M'], max: [4000, 4000] },
 picture: { kinds: ['image'], keys: ['ratio', 'corners', 'shadow'] },
 buttons: { kinds: ['buttons'], keys: ['align'] },
 link: { kinds: ['link'], keys: ['color'] },
 icon: { kinds: ['icon'], keys: ['size', 'color'], sizes: ['S', 'M', 'L'] },
 number: { kinds: ['number'], keys: ['size', 'color', 'font'], sizes: ['S', 'M', 'L', 'XL'] },
 date: { kinds: ['date'], keys: ['size', 'color'], sizes: ['S', 'M'] },
 time: { kinds: ['time'], keys: ['size', 'color'], sizes: ['S', 'M'] },
 hours: { kinds: ['hours'], keys: [] },
 tags: { kinds: ['tags'], keys: ['align'] },
 divider: { kinds: null, keys: [] },
 space: { kinds: null, keys: ['size'], sizes: ['S', 'M', 'L'] },
};
// In the spec, built later: forms and collection lists need the Forms and
// Collections pieces wired first; a video or an embed loads a third party, which
// has to reach the site's "What this site collects" list first.
const LATER_ATOMS = { form: 'A form', collection: 'A collection list', video: 'A video', embed: 'An embed' };

export const OWN_FIELD_KINDS = ['text', 'textarea', 'html', 'image', 'buttons', 'link', 'icon', 'number', 'date', 'time', 'hours', 'tags', 'items'];
// What a field may say beyond the common keys, by kind.
const KIND_KEYS = {
 text: ['max'],
 textarea: ['max'],
 html: ['max'],
 image: ['ratios'],
 buttons: ['min', 'max'],
 link: [],
 icon: [],
 number: ['min', 'max', 'prefix', 'suffix'],
 date: [],
 time: [],
 hours: [],
 tags: ['max'],
 items: ['min', 'max', 'phoneMax', 'fields', 'itemLabel'],
};
// `fixed`: owners can't change it, so the inspector leaves it out and it always draws its starting value.
const FIELD_KEYS = ['key', 'kind', 'label', 'help', 'default', 'required', 'fixed', 'when'];
// What a box may set differently on Mobile, by kind. An atom's: its size, line-up and hidden.
const BOX_MOBILE = { stack: ['gap', 'pad', 'align'], row: ['gap', 'pad', 'align', 'justify', 'direction'], grid: ['gap', 'pad'], split: ['gap', 'pad'] };
const FRAME_KEYS = ['pad', 'fill', 'corners', 'shadow', 'sizing', 'mobile'];

// Link words that say nothing about where they go. A block's defaults may not
// use them; an owner's own words on a page only get a warning.
export const VAGUE_LINK_WORDS = ['click here', 'here', 'read more', 'learn more', 'more', 'click', 'link', 'this', 'go'];
export const vagueLinkText = (label) => VAGUE_LINK_WORDS.includes(String(label ?? '').trim().toLowerCase().replace(/[.!…→›»]+$/u, '').trim());

// The look every block gets (the layer's schema/define.js lookShape and
// lookFields; check-own-blocks.mjs in the layer holds them equal).
const lookShape = {
 background: z.enum(['page', 'soft', 'brand', 'dark']).default('page'),
 spacing: z.enum(['tight', 'normal', 'roomy']).default('normal'),
 above: z.enum(['tight', 'normal', 'roomy']).optional(),
 below: z.enum(['tight', 'normal', 'roomy']).optional(),
 divider: z.boolean().default(false),
};
export const OWN_LOOK_FIELDS = [
 {
  key: 'background',
  label: 'Background',
  widget: 'color',
  options: [
   { label: 'Page', value: 'page', swatch: 'bg' },
   { label: 'Soft', value: 'soft', swatch: 'surface' },
   { label: 'Brand', value: 'brand', swatch: 'accent' },
   { label: 'Dark', value: 'dark', swatch: 'dark' },
  ],
 },
 ...['above', 'below'].map((key) => ({
  key,
  label: key === 'above' ? 'Space above' : 'Space below',
  widget: 'buttons',
  fallback: 'spacing',
  options: [
   { label: 'Tight', value: 'tight' },
   { label: 'Normal', value: 'normal' },
   { label: 'Roomy', value: 'roomy' },
  ],
 })),
 { key: 'divider', label: 'Line above', widget: 'switch' },
];

// ── Values a placed block holds, by field kind ──

const TIME = /^(?:(?:[01]\d|2[0-3]):[0-5]\d)?$/;
const svgPath = z.string().max(2000).regex(/^[MLHVCSQTAZmlhvcsqtaz\d\s,.eE+-]+$/);
const imageValue = z.object({
 src: z.string().max(2000).default(''),
 alt: z.string().max(300).default(''),
 id: z.string().regex(/^[A-Za-z0-9_-]{16}$/).optional(),
 width: z.int().min(1).max(12000).optional(),
 height: z.int().min(1).max(12000).optional(),
 placeholder: z.string().max(64).optional(),
 focal: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).optional(),
 zoom: z.number().min(1).max(4).optional(),
 altFrom: z.enum(['library', 'page']).optional(),
 optimize: z.literal(false).optional(),
 // Ticked on purpose: the picture says nothing a reader needs, so its alt is empty.
 decorative: z.boolean().optional(),
});
const buttonValue = z.object({
 label: z.string().max(60).default(''),
 to: z.string().max(2000).default(''),
 style: z.enum(['solid', 'outline', 'text']).default('solid'),
});
const linkValue = z.object({ label: z.string().max(40).default(''), to: z.string().max(2000).default('') });
const richValue = (max) => z.union([z.object({ type: z.literal('doc'), content: z.array(z.any()).max(1000).default([]) }), z.string().max(max)]);
const iconValue = z.union([z.string().max(24), z.object({ name: z.string().max(60), paths: z.array(svgPath).min(1).max(24) })]);
const hoursValue = z.array(z.object({ closed: z.boolean().default(false), open: z.string().regex(TIME).default(''), close: z.string().regex(TIME).default('') })).max(7);

function valueSchema(field) {
 switch (field.kind) {
  case 'text':
  case 'textarea':
   return z.string().max(field.max ?? 280);
  case 'html':
   return richValue(field.max ?? 4000);
  case 'image':
   return imageValue;
  case 'buttons':
   return z.array(buttonValue).min(field.min ?? 0).max(field.max ?? OWN_BLOCK_LIMITS.buttons);
  case 'link':
   return linkValue;
  case 'icon':
   return iconValue;
  case 'number':
   return z.number().min(field.min ?? -1e9).max(field.max ?? 1e9).nullable();
  case 'date':
   return z.string().regex(/^(?:\d{4}-\d{2}-\d{2})?$/);
  case 'time':
   return z.string().regex(TIME);
  case 'hours':
   return hoursValue;
  case 'tags':
   return z.array(z.string().max(30)).max(field.max ?? OWN_BLOCK_LIMITS.tags);
  case 'items':
   return z.array(z.object(Object.fromEntries((field.fields ?? []).map((sub) => [sub.key, withDefault(sub)])))).min(field.min ?? 0).max(field.max ?? OWN_BLOCK_LIMITS.items);
  default:
   return z.never();
 }
}

// What a field starts as when the block is placed.
function emptyValue(field) {
 if (['text', 'textarea', 'html', 'icon', 'date', 'time'].includes(field.kind)) return '';
 if (field.kind === 'image') return { src: '', alt: '' };
 if (field.kind === 'link') return { label: '', to: '' };
 if (field.kind === 'number') return null;
 return [];
}
const startValue = (field) => (field.default !== undefined ? field.default : emptyValue(field));
const withDefault = (field) => valueSchema(field).default(startValue(field));

// ── The document ──

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const plain = (value, max) => typeof value === 'string' && value.trim() !== '' && value.length <= max && !/[<>\u0000-\u001f]/.test(value);
const CLASS_LIST = /^-?[A-Za-z_][\w-]{0,39}(?: -?[A-Za-z_][\w-]{0,39}){0,7}$/;
const ANCHOR = /^[a-z][a-z0-9-]{0,39}$/;

// Checks a block definition. `pro` (Pro mode on the site, at save) keeps
// `class`, `anchor` and `when`; without it they are checked, then dropped.
// The answer's `doc` is the one to store: every text field's `max` filled in.
export function checkOwnBlock(input, { pro = false } = {}) {
 const problems = [];
 const fail = (path, message) => problems.push({ path, message });
 if (!isObject(input)) return { ok: false, problems: [{ path: '', message: 'A block is a JSON object.' }], doc: null };
 let bytes = 0;
 try {
  bytes = new TextEncoder().encode(JSON.stringify(input)).length;
 } catch {
  return { ok: false, problems: [{ path: '', message: "That block can't be read as JSON." }], doc: null };
 }
 if (bytes > OWN_BLOCK_LIMITS.bytes) return { ok: false, problems: [{ path: '', message: `A block is at most ${OWN_BLOCK_LIMITS.bytes / 1024} KB.` }], doc: null, tooBig: true };
 const doc = JSON.parse(JSON.stringify(input));
 const stray = (value, allowed, path) => {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(path ? `${path}.${key}` : key, `“${key}” isn't something a block can say.`);
 };

 stray(doc, ['schema', 'type', 'label', 'description', 'icon', 'category', 'layout', 'fields', 'bind'], '');
 if (doc.schema !== OWN_BLOCK_VERSION) fail('schema', `Say "schema": ${OWN_BLOCK_VERSION}.`);
 if (!OWN_TYPE.test(doc.type ?? '')) fail('type', 'The type is own_ and up to 44 lowercase letters, digits or _.');
 if (!plain(doc.label, OWN_BLOCK_LIMITS.label)) fail('label', `Give the block a name, up to ${OWN_BLOCK_LIMITS.label} characters.`);
 if (doc.description !== undefined && !(typeof doc.description === 'string' && doc.description.length <= OWN_BLOCK_LIMITS.description && !/[<>]/.test(doc.description))) fail('description', `The description is plain text, up to ${OWN_BLOCK_LIMITS.description} characters.`);
 if (doc.icon !== undefined && !/^[a-z0-9-]{1,40}$/.test(doc.icon)) fail('icon', 'The icon is a name like "calendar".');
 if (doc.category !== undefined && !plain(doc.category, OWN_BLOCK_LIMITS.category)) fail('category', `The category is a word or two, up to ${OWN_BLOCK_LIMITS.category} characters.`);
 if (doc.bind !== undefined && doc.bind !== null) fail('bind', 'Filling a block from a collection is not available yet.');

 // Fields first, so the layout can be checked against them.
 const fields = Array.isArray(doc.fields) ? doc.fields : [];
 if (!Array.isArray(doc.fields)) fail('fields', 'List the block’s fields (it may be an empty list).');
 if (fields.length > OWN_BLOCK_LIMITS.fields) fail('fields', `A block has at most ${OWN_BLOCK_LIMITS.fields} fields.`);
 const byKey = new Map();
 const checkField = (field, path, inItems) => {
  if (!isObject(field)) return fail(path, 'A field is an object.');
  if (!OWN_FIELD_KINDS.includes(field.kind)) return fail(`${path}.kind`, `“${field.kind}” isn't a kind of field.`);
  stray(field, [...FIELD_KEYS, ...KIND_KEYS[field.kind]], path);
  if (!OWN_KEY.test(field.key ?? '')) fail(`${path}.key`, 'A field’s key is lowercase letters, digits and _, starting with a letter.');
  if (!plain(field.label, OWN_BLOCK_LIMITS.label)) fail(`${path}.label`, `Give the field a name, up to ${OWN_BLOCK_LIMITS.label} characters.`);
  if (field.help !== undefined && !(typeof field.help === 'string' && field.help.length <= OWN_BLOCK_LIMITS.help && !/[<>]/.test(field.help))) fail(`${path}.help`, `Help is plain text, up to ${OWN_BLOCK_LIMITS.help} characters.`);
  if (field.required !== undefined && typeof field.required !== 'boolean') fail(`${path}.required`, 'Required is true or false.');
  if (field.fixed !== undefined && typeof field.fixed !== 'boolean') fail(`${path}.fixed`, 'Fixed is true or false.');
  if (field.fixed === true && field.kind === 'image') fail(`${path}.fixed`, 'A picture is picked on each page, so owners can always change it.');
  else if (field.fixed === true && field.default === undefined) fail(`${path}.default`, 'A part owners can’t change needs a starting value.');
  if (field.when !== undefined && !(isObject(field.when) && Object.keys(field.when).length <= 5)) fail(`${path}.when`, 'A when is an object of up to 5 conditions.');
  const int = (key, lo, hi) => field[key] === undefined || (Number.isInteger(field[key]) && field[key] >= lo && field[key] <= hi) || fail(`${path}.${key}`, `${key} is a whole number from ${lo} to ${hi}.`);
  if (field.kind === 'buttons') int('min', 0, OWN_BLOCK_LIMITS.buttons), int('max', 1, OWN_BLOCK_LIMITS.buttons);
  if (field.kind === 'tags') int('max', 1, OWN_BLOCK_LIMITS.tags);
  if (field.kind === 'html') int('max', 1, 4000);
  if (field.kind === 'number') {
   for (const key of ['min', 'max']) if (field[key] !== undefined && !(Number.isFinite(field[key]) && Math.abs(field[key]) <= 1e9)) fail(`${path}.${key}`, `${key} is a number.`);
   for (const key of ['prefix', 'suffix']) if (field[key] !== undefined && !(typeof field[key] === 'string' && field[key].length <= 12 && !/[<>]/.test(field[key]))) fail(`${path}.${key}`, `${key} is up to 12 characters, like "$" or "min".`);
  }
  // A picture is picked on the page: a default one would be a file no page's usage counts.
  if (field.kind === 'image' && field.default !== undefined) fail(`${path}.default`, 'A picture starts empty; it’s picked on the page.');
  if (field.kind === 'image' && field.ratios !== undefined && !(Array.isArray(field.ratios) && field.ratios.length && field.ratios.every((ratio) => OWN_RATIOS.includes(ratio)))) fail(`${path}.ratios`, `Ratios are some of ${OWN_RATIOS.join(', ')}.`);
  if (['min', 'max'].every((key) => Number.isFinite(field[key])) && field.min > field.max) fail(`${path}.min`, 'min is more than max.');
  if (field.kind === 'items') {
   if (inItems) return fail(path, 'A list can’t hold another list.');
   int('min', 0, OWN_BLOCK_LIMITS.items), int('max', 1, OWN_BLOCK_LIMITS.items), int('phoneMax', 1, OWN_BLOCK_LIMITS.items);
   const subs = Array.isArray(field.fields) ? field.fields : [];
   if (!subs.length) fail(`${path}.fields`, 'A list needs the fields each item holds.');
   const seen = new Set();
   subs.forEach((sub, at) => {
    checkField(sub, `${path}.fields.${at}`, true);
    if (seen.has(sub?.key)) fail(`${path}.fields.${at}.key`, `“${sub.key}” is used twice in this list.`);
    seen.add(sub?.key);
   });
   if (field.itemLabel !== undefined && !seen.has(field.itemLabel)) fail(`${path}.itemLabel`, 'itemLabel names one of the list’s fields.');
  }
 };
 fields.forEach((field, at) => {
  checkField(field, `fields.${at}`, false);
  if (!isObject(field)) return;
  if (byKey.has(field.key) || Object.hasOwn(lookShape, field.key)) fail(`fields.${at}.key`, `“${field.key}” is used twice, or is one every block already has.`);
  byKey.set(field.key, field);
 });
 const subField = (key) => {
  const [list, sub] = String(key).split('.');
  return byKey.get(list)?.kind === 'items' ? byKey.get(list).fields?.find((field) => field.key === sub) : undefined;
 };

 // The layout: a tree of four kinds of box and the atoms in them.
 const used = new Map(); // field path → atom path
 let nodes = 0;
 const takesClass = (node, path) => {
  if (node.class !== undefined && !(typeof node.class === 'string' && CLASS_LIST.test(node.class))) fail(`${path}.class`, 'A class is up to 8 names of letters, digits, - and _.');
  if (node.anchor !== undefined && !(typeof node.anchor === 'string' && ANCHOR.test(node.anchor))) fail(`${path}.anchor`, 'An anchor is lowercase letters, digits and -, starting with a letter.');
 };
 const choice = (node, key, values, path) => node[key] === undefined || values.includes(node[key]) || fail(`${path}.${key}`, `${key} is one of ${values.join(', ')}.`);
 const atom = (node, path, depth, list) => {
  nodes += 1;
  const spec = OWN_ATOMS[node.atom];
  if (!spec) return fail(`${path}.atom`, LATER_ATOMS[node.atom] ? `${LATER_ATOMS[node.atom]} in a block is not available yet.` : `“${node.atom}” isn't an atom.`);
  if (depth > OWN_BLOCK_LIMITS.depth) fail(path, `A block is ${OWN_BLOCK_LIMITS.depth} levels deep at most.`);
  stray(node, ['atom', 'field', 'class', 'anchor', 'mobile', ...spec.keys], path);
  takesClass(node, path);
  if (node.mobile !== undefined) {
   const keys = ['hidden', ...(spec.sizes ? ['size'] : []), ...(spec.keys.includes('align') ? ['align'] : [])];
   if (!isObject(node.mobile)) fail(`${path}.mobile`, 'What changes on Mobile is an object.');
   else {
    stray(node.mobile, keys, `${path}.mobile`);
    if (node.mobile.size !== undefined && !spec.sizes?.includes(node.mobile.size)) fail(`${path}.mobile.size`, `size is one of ${(spec.sizes ?? []).join(', ')}.`);
    choice(node.mobile, 'align', SCALES.align, `${path}.mobile`);
    if (node.mobile.hidden !== undefined && typeof node.mobile.hidden !== 'boolean') fail(`${path}.mobile.hidden`, 'hidden is true or false.');
   }
  }
  for (const key of spec.keys) {
   if (key === 'size') choice(node, 'size', spec.sizes, path);
   else if (key === 'ratio') choice(node, 'ratio', OWN_RATIOS, path);
   else choice(node, key, SCALES[key], path);
  }
  if (!spec.kinds) {
   if (node.field !== undefined) fail(`${path}.field`, `A ${node.atom} has nothing to fill in.`);
   return;
  }
  const key = typeof node.field === 'string' ? node.field : '';
  const inList = key.includes('.');
  const field = inList ? subField(key) : byKey.get(key);
  if (!field) return fail(`${path}.field`, `Name the field this ${node.atom} shows.`);
  if (inList !== Boolean(list) || (list && !key.startsWith(`${list}.`))) return fail(`${path}.field`, inList ? `“${key}” is shown only inside its list’s grid.` : `Inside a list’s grid, a ${node.atom} shows one of the list’s fields (${list}.…).`);
  if (!spec.kinds.includes(field.kind)) return fail(`${path}.field`, `A ${node.atom} shows a ${spec.kinds.join(' or ')} field, and “${key}” is ${field.kind}.`);
  if (used.has(key)) return fail(`${path}.field`, `“${key}” is already shown by ${used.get(key)}.`);
  used.set(key, path);
  if (spec.max && ['text', 'textarea'].includes(field.kind)) {
   if (field.max === undefined) field.max = spec.max[0];
   else if (!(Number.isInteger(field.max) && field.max >= 1 && field.max <= spec.max[1])) fail(`fields.${key}.max`, `A ${node.atom} holds up to ${spec.max[1]} characters.`);
  }
 };
 // The look any box may take: padding, fill, corners, shadow, fill or hug, and what changes on Mobile.
 const frame = (node, path, mobileKeys) => {
  if (node.pad !== undefined && !padOk(node.pad)) fail(`${path}.pad`, `Padding is whole pixels from 0 to ${OWN_BLOCK_LIMITS.space}: one number, or four (top, right, bottom, left).`);
  choice(node, 'fill', SCALES.fill, path), choice(node, 'shadow', SCALES.shadow, path), choice(node, 'sizing', SCALES.sizing, path);
  if (node.corners !== undefined && !radiusOk(node.corners)) fail(`${path}.corners`, `Corners are ${SCALES.corners.join(', ')} or whole pixels from 0 to ${OWN_BLOCK_LIMITS.radius}.`);
  if (node.mobile === undefined) return;
  if (!isObject(node.mobile) || !mobileKeys) return fail(`${path}.mobile`, 'What changes on Mobile is an object.');
  const mobile = node.mobile;
  stray(mobile, mobileKeys, `${path}.mobile`);
  if (mobile.gap !== undefined && !spaceOk(mobile.gap)) fail(`${path}.mobile.gap`, `gap is S, M, L or whole pixels from 0 to ${OWN_BLOCK_LIMITS.space}.`);
  if (mobile.pad !== undefined && !padOk(mobile.pad)) fail(`${path}.mobile.pad`, `Padding is whole pixels from 0 to ${OWN_BLOCK_LIMITS.space}.`);
  choice(mobile, 'align', SCALES.align, `${path}.mobile`), choice(mobile, 'justify', SCALES.justify, `${path}.mobile`), choice(mobile, 'direction', ['row', 'column'], `${path}.mobile`);
 };
 const gapOk = (node, path) => node.gap === undefined || spaceOk(node.gap) || fail(`${path}.gap`, `gap is S, M, L or whole pixels from 0 to ${OWN_BLOCK_LIMITS.space}.`);
 const box = (node, path, depth, list = '') => {
  if (!isObject(node)) return fail(path, 'Each piece is an object.');
  if (node.atom !== undefined) return atom(node, path, depth, list);
  nodes += 1;
  if (!OWN_LAYOUTS.includes(node.kind)) return fail(`${path}.kind`, `A box is one of ${OWN_LAYOUTS.join(', ')}.`);
  if (depth > OWN_BLOCK_LIMITS.depth - 1) return fail(path, `A box can’t go this deep: a block is ${OWN_BLOCK_LIMITS.depth} levels at most.`);
  if (node.kind === 'split' && depth !== 1) return fail(path, 'A split is only ever the whole block.');
  takesClass(node, path);
  frame(node, path, BOX_MOBILE[node.kind]);
  gapOk(node, path);
  const children = (key, max, nested = list) => {
   const items = node[key];
   if (!Array.isArray(items) || !items.length) return fail(`${path}.${key}`, `Put something in the ${node.kind}.`);
   if (items.length > max) fail(`${path}.${key}`, `A ${node.kind} holds ${max} at most.`);
   items.forEach((child, at) => box(child, `${path}.${key}.${at}`, depth + 1, nested));
  };
  if (node.kind === 'stack') {
   stray(node, ['kind', 'align', 'width', 'gap', 'items', 'class', 'anchor', ...FRAME_KEYS], path);
   choice(node, 'align', SCALES.align, path), choice(node, 'width', ['narrow', 'wide'], path);
   children('items', OWN_BLOCK_LIMITS.nodes);
  } else if (node.kind === 'row') {
   stray(node, ['kind', 'gap', 'align', 'justify', 'wrap', 'items', 'class', 'anchor', ...FRAME_KEYS], path);
   choice(node, 'align', SCALES.align, path), choice(node, 'justify', SCALES.justify, path);
   if (node.wrap !== undefined && typeof node.wrap !== 'boolean') fail(`${path}.wrap`, 'wrap is true or false.');
   children('items', OWN_BLOCK_LIMITS.rowItems);
  } else if (node.kind === 'split') {
   stray(node, ['kind', 'media', 'ratio', 'align', 'phone', 'gap', 'slots', 'class', 'anchor', ...FRAME_KEYS], path);
   // behind: the picture fills the block and the words sit over it (Overlay).
   choice(node, 'media', ['left', 'right', 'behind'], path), choice(node, 'ratio', ['50/50', '40/60', '60/40'], path), choice(node, 'align', SCALES.align, path), choice(node, 'phone', ['media_first', 'text_first'], path);
   if (!isObject(node.slots)) return fail(`${path}.slots`, 'A split has two slots: media and text.');
   stray(node.slots, ['media', 'text'], `${path}.slots`);
   for (const slot of ['media', 'text']) {
    const items = node.slots[slot];
    if (!Array.isArray(items) || !items.length) fail(`${path}.slots.${slot}`, `Put something in the ${slot} side.`);
    else items.forEach((child, at) => box(child, `${path}.slots.${slot}.${at}`, depth + 1, list));
   }
  } else {
   stray(node, ['kind', 'columns', 'gap', 'phone', 'carousel', 'field', 'item', 'items', 'class', 'anchor', ...FRAME_KEYS], path);
   if (!(Number.isInteger(node.columns) && node.columns >= 1 && node.columns <= OWN_BLOCK_LIMITS.columns)) fail(`${path}.columns`, `A grid has 1 to ${OWN_BLOCK_LIMITS.columns} columns.`);
   choice(node, 'phone', [1, 2], path);
   if (node.carousel !== undefined && typeof node.carousel !== 'boolean') fail(`${path}.carousel`, 'carousel is true or false.');
   if (node.carousel === true && node.field === undefined) fail(`${path}.carousel`, 'A carousel slides through a list’s items.');
   if (node.field !== undefined) {
    // A grid of a list: each item drawn by `item`, a stack or row of atoms on the list's fields.
    if (list) return fail(`${path}.field`, 'A list’s grid can’t sit inside another list.');
    const field = byKey.get(node.field);
    if (field?.kind !== 'items') return fail(`${path}.field`, 'A grid repeats a list field (kind "items").');
    if (used.has(node.field)) return fail(`${path}.field`, `“${node.field}” is already shown by ${used.get(node.field)}.`);
    used.set(node.field, path);
    if (node.items !== undefined) fail(`${path}.items`, 'A grid repeats a list or holds pieces, not both.');
    const item = node.item;
    if (!isObject(item) || !['stack', 'row'].includes(item.kind)) return fail(`${path}.item`, 'Say how each item looks: a stack or a row.');
    // Each item may be a card: padding, fill, corners and shadow.
    stray(item, ['kind', 'gap', 'align', 'items', 'pad', 'fill', 'corners', 'shadow'], `${path}.item`);
    choice(item, 'align', SCALES.align, `${path}.item`);
    gapOk(item, `${path}.item`);
    frame(item, `${path}.item`, null);
    if (!Array.isArray(item.items) || !item.items.length) return fail(`${path}.item.items`, 'Put something in each item.');
    item.items.forEach((child, at) => (isObject(child) && child.atom !== undefined ? atom(child, `${path}.item.items.${at}`, depth + 1, node.field) : fail(`${path}.item.items.${at}`, 'An item holds atoms only.')));
   } else {
    if (node.item !== undefined) fail(`${path}.item`, 'item goes with a list field.');
    if (node.phone === 2) fail(`${path}.phone`, 'Two on phones is for a list’s grid.');
    children('items', OWN_BLOCK_LIMITS.columns * 3);
   }
  }
 };
 if (!isObject(doc.layout)) fail('layout', 'Give the block a layout: stack, row, grid or split.');
 else if (doc.layout.atom !== undefined) fail('layout', 'The whole block is a stack, row, grid or split, with the atoms inside it.');
 else box(doc.layout, 'layout', 1);
 if (nodes > OWN_BLOCK_LIMITS.nodes) fail('layout', `A block has ${OWN_BLOCK_LIMITS.nodes} pieces at most.`);

 // Every field is shown by exactly one atom, and starts as something it can hold.
 const allFields = fields.flatMap((field) => (isObject(field) ? [[field.key, field], ...(field.kind === 'items' && Array.isArray(field.fields) ? field.fields.filter(isObject).map((sub) => [`${field.key}.${sub.key}`, sub]) : [])] : []));
 for (const [key, field] of allFields) {
  if (!problems.length && !used.has(key)) fail(`fields.${key}`, `“${key}” isn't shown anywhere. Show it, or take it out.`);
  if (field.default !== undefined && OWN_FIELD_KINDS.includes(field.kind)) {
   let fits = false;
   try {
    fits = valueSchema(field).safeParse(field.default).success;
   } catch {}
   if (!fits) fail(`fields.${key}.default`, `The starting ${field.label ?? key} doesn't fit the field's own limits.`);
  }
  if (field.required === true && field.default === undefined && !['image', 'items', 'hours'].includes(field.kind)) fail(`fields.${key}.default`, 'A required field needs a starting value, so a new block never draws empty.');
  const labels = field.kind === 'buttons' && Array.isArray(field.default) ? field.default.map((button) => button?.label) : field.kind === 'link' ? [field.default?.label] : [];
  if (labels.some(vagueLinkText)) fail(`fields.${key}.default`, 'Say where the link goes ("Book a seat"), not "Click here" or "Learn more".');
 }

 if (!pro) {
  const strip = (node) => {
   if (!isObject(node)) return;
   delete node.class;
   delete node.anchor;
   for (const child of [...(node.items ?? []), ...(node.item?.items ?? []), ...(node.slots?.media ?? []), ...(node.slots?.text ?? [])]) strip(child);
  };
  strip(doc.layout);
  for (const [, field] of allFields) delete field.when;
 }
 return { ok: !problems.length, problems: problems.slice(0, 20), doc: problems.length ? null : doc };
}

// ── What a checked document becomes ──

const WIDGET = { text: 'text', textarea: 'textarea', html: 'html', image: 'image', buttons: 'items', link: 'group', icon: 'icon', number: 'number', date: 'date', time: 'time', hours: 'hours', tags: 'tags', items: 'items' };
const BUTTON_FIELDS = [
 { key: 'label', label: 'Label', widget: 'text', inline: true },
 { key: 'to', label: 'Link', widget: 'text', link: true, placeholder: '/contact or https://…' },
 { key: 'style', label: 'Style', widget: 'buttons', draws: 'button', options: [{ label: 'Solid', value: 'solid' }, { label: 'Outline', value: 'outline' }, { label: 'Text', value: 'text' }] },
];
const LINK_FIELDS = [
 { key: 'label', label: 'Words', widget: 'text' },
 { key: 'to', label: 'Link', widget: 'text', link: true, placeholder: '/contact or https://…' },
];

function inspectorField(field) {
 const out = { key: field.key, label: field.label, widget: WIDGET[field.kind] };
 if (field.help) out.help = field.help;
 if (field.when) out.when = field.when;
 if (['text', 'textarea', 'html'].includes(field.kind)) out.inline = true;
 if (field.kind === 'buttons') Object.assign(out, { itemLabel: 'label', subfields: BUTTON_FIELDS, ...(field.min !== undefined ? { min: field.min } : {}), max: field.max ?? OWN_BLOCK_LIMITS.buttons });
 if (field.kind === 'link') out.subfields = LINK_FIELDS;
 if (field.kind === 'icon') Object.assign(out, { any: true, options: [{ label: 'None', value: '' }] });
 if (field.kind === 'number') for (const key of ['min', 'max']) if (field[key] !== undefined) out[key] = field[key];
 if (field.kind === 'number' && (field.prefix || field.suffix)) out.unit = [field.prefix, field.suffix].filter(Boolean).join(' ');
 if (field.kind === 'tags') out.max = field.max ?? OWN_BLOCK_LIMITS.tags;
 if (field.kind === 'items') Object.assign(out, { subfields: field.fields.filter((sub) => sub.fixed !== true).map(inspectorField), ...(field.itemLabel ? { itemLabel: field.itemLabel } : {}), ...(field.min !== undefined ? { min: field.min } : {}), max: field.max ?? OWN_BLOCK_LIMITS.items });
 return out;
}

// The inspector's fields, the look ones after, as any block's.
export function ownBlockFields(doc) {
 return [...doc.fields.filter((field) => field.fixed !== true).map(inspectorField), ...OWN_LOOK_FIELDS];
}

// The data a placed block holds: its fields' values, then the look's.
export function ownBlockSchema(doc) {
 return z.object({ ...Object.fromEntries(doc.fields.map((field) => [field.key, withDefault(field)])), ...lookShape });
}

// The block as the layer's renderer takes it (TbBlockScope): `own` carries the
// document for TbOwnBlock, the rest is a defineBlock's shape.
export function ownBlockDef(doc) {
 const schema = ownBlockSchema(doc);
 return { type: doc.type, label: doc.label, category: 'content', schema, fields: ownBlockFields(doc), defaults: schema.parse({}), own: doc };
}

// The block as the studio's manifest lists it (the layer's buildManifest
// shape), so the tray, the inspector, checkBlocks and the MCP tools see it as
// any other. Tier `private`: the tray shows it with the site's own blocks.
export function ownBlockManifestEntry(doc) {
 const schema = ownBlockSchema(doc);
 return {
  type: doc.type,
  tier: 'private',
  owner: null,
  layer: 'own',
  component: 'TbOwnBlock',
  label: doc.label,
  description: doc.description ?? '',
  category: MANIFEST_CATEGORIES.includes(doc.category) ? doc.category : 'content',
  icon: doc.icon ?? 'square',
  fields: ownBlockFields(doc),
  defaults: schema.parse({}),
  wys: {},
  schema: z.toJSONSchema(schema, { io: 'input', unrepresentable: 'throw' }),
  own: doc,
 };
}

// What a placed block's content is missing, as warnings (owners' words are
// theirs, so these never refuse a save): [{ field, message }]. A picture
// with no alt that isn't marked decorative; a link that says only "Click here".
export function ownBlockWarnings(doc, data) {
 const out = [];
 const look = (fields, value, prefix) => {
  for (const field of fields) {
   const held = value?.[field.key];
   const path = `${prefix}${field.key}`;
   if (field.kind === 'image' && held?.src && !String(held.alt ?? '').trim() && held.decorative !== true) out.push({ field: path, message: `${field.label} needs alt text, or to be marked decorative.` });
   if (field.kind === 'buttons' && Array.isArray(held) && held.some((button) => vagueLinkText(button?.label))) out.push({ field: path, message: `${field.label}: say where the button goes.` });
   if (field.kind === 'link' && held?.to && vagueLinkText(held.label)) out.push({ field: path, message: `${field.label}: say where the link goes.` });
   if (field.kind === 'items' && Array.isArray(held)) held.forEach((row, at) => look(field.fields, row, `${path}.${at}.`));
  }
 };
 look(doc?.fields ?? [], data ?? {}, '');
 return out;
}

// What a placed block draws: its data, with every part owners can't change
// (`fixed`) at its starting value, whatever the page holds.
export function ownBlockData(doc, data) {
 const out = { ...(data ?? {}) };
 for (const field of doc?.fields ?? []) {
  if (field.fixed === true) out[field.key] = JSON.parse(JSON.stringify(field.default));
  else if (field.kind === 'items' && Array.isArray(out[field.key]) && (field.fields ?? []).some((sub) => sub.fixed === true)) {
   out[field.key] = out[field.key].map((row) => ({ ...row, ...Object.fromEntries(field.fields.filter((sub) => sub.fixed === true).map((sub) => [sub.key, JSON.parse(JSON.stringify(sub.default))])) }));
  }
 }
 return out;
}

// A box's look as the layer draws it: { classes, style }. Every choice is a
// class over --site-* tokens; a number (gap, padding, corners) becomes a
// custom property in whole pixels, read by a fixed rule in the layer's CSS.
// Mobile's own values sit beside them, used under the layer's Mobile width.
const pxOf = (value) => `${value}px`;
const spaceOf = (value) => (typeof value === 'number' ? pxOf(value) : `var(--tb-own-gap-${String(value).toLowerCase()})`);
const padOf = (value) => (Array.isArray(value) ? value.map(pxOf).join(' ') : pxOf(value));
export function ownBoxLook(node) {
 const classes = [];
 const style = {};
 if (!isObject(node)) return { classes, style };
 if (node.gap !== undefined) {
  if (typeof node.gap === 'number') style['--tb-own-gap'] = pxOf(node.gap);
  else classes.push(`tb-own--gap-${node.gap.toLowerCase()}`);
 }
 if (node.pad !== undefined) classes.push('tb-own--pad'), (style['--tb-own-pad'] = padOf(node.pad));
 if (node.fill === 'page') classes.push('tb-own--fill', 'tb-own--fill-page');
 else if (['soft', 'brand', 'dark'].includes(node.fill)) classes.push('tb-own--fill', `tb-look--${node.fill}`);
 if (typeof node.corners === 'number') classes.push('tb-own--radius'), (style['--tb-own-radius'] = pxOf(node.corners));
 else if (node.corners) classes.push(`tb-own--corners-${node.corners}`);
 if (node.shadow && node.shadow !== 'none') classes.push(`tb-own--shadow-${node.shadow}`);
 if (node.sizing === 'hug') classes.push('tb-own--hug');
 if (node.justify) classes.push(`tb-own--justify-${node.justify}`);
 const mobile = isObject(node.mobile) ? node.mobile : {};
 if (mobile.gap !== undefined) classes.push('tb-own--m-gap'), (style['--tb-own-m-gap'] = spaceOf(mobile.gap));
 if (mobile.pad !== undefined) classes.push('tb-own--m-pad'), (style['--tb-own-m-pad'] = padOf(mobile.pad));
 if (mobile.align) classes.push(`tb-own--m-align-${mobile.align}`);
 if (mobile.justify) classes.push(`tb-own--m-justify-${mobile.justify}`);
 if (mobile.direction === 'row') classes.push('tb-own--m-row');
 return { classes, style };
}

// An atom's Mobile classes: its size, its line-up, or hidden there.
export function ownAtomLook(node) {
 const mobile = isObject(node?.mobile) ? node.mobile : {};
 return [mobile.size && `tb-own--m-size-${String(mobile.size).toLowerCase()}`, mobile.align && `tb-own--m-align-${mobile.align}`, mobile.hidden === true && 'tb-own--m-hidden'].filter(Boolean);
}
