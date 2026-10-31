import { z } from 'zod';
import { CATEGORIES, WIDGETS, WYS_TOOLS } from './define.js';

// The manifest: everything a studio needs to edit this site's blocks without
// holding any of their code. Contract: docs/manifest.md. `version` changes
// only when the shape breaks.
export const MANIFEST_VERSION = 1;

const TYPE = /^[a-z][a-z0-9_]{0,47}$/;

// hero → BlocksHero, buroak_hours → BlocksBuroakHours (Nuxt's name for
// app/components/blocks/BuroakHours.global.vue).
export function componentName(type) {
 return `Blocks${type
  .split('_')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join('')}`;
}

// Every field, a list's row fields included, has to be in the schema: a
// mistyped key would save where the block never reads it.
function checkFields(fields, shape, where) {
 if (!Array.isArray(fields)) throw new Error(`${where}: fields must be a list`);
 for (const field of fields) {
  if (!WIDGETS.includes(field.widget)) throw new Error(`${where}.${field.key}: unknown widget "${field.widget}"`);
  if (!Object.hasOwn(shape, field.key)) throw new Error(`${where}.${field.key}: not in the schema`);
  if (field.widget === 'items') {
   const list = bare(shape[field.key]);
   const row = list?.type === 'array' ? bare(list.element) : null;
   if (row?.type !== 'object') throw new Error(`${where}.${field.key}: the schema must be a list of objects`);
   checkFields(field.subfields ?? [], row.shape, `${where}.${field.key}`);
  }
  if (field.widget === 'group') {
   const group = bare(shape[field.key]);
   if (group?.type !== 'object') throw new Error(`${where}.${field.key}: the schema must be an object`);
   checkFields(field.subfields ?? [], group.shape, `${where}.${field.key}`);
  }
  if (field.widget === 'nav') {
   const value = bare(shape[field.key]);
   const row = !field.single && value?.type === 'array' ? bare(value.element) : value;
   if (row?.type !== 'object') throw new Error(`${where}.${field.key}: the schema must be ${field.single ? 'an object' : 'a list of objects'}`);
  }
  if ((field.widget === 'select' || field.widget === 'buttons') && !field.options?.length) {
   throw new Error(`${where}.${field.key}: needs options`);
  }
 }
}

// Ways to start a block. Each one's data goes over the block's defaults,
// and the whole has to fit: a preset that didn't would add a broken block.
function checkPresets(def, where) {
 if (def.presets === undefined) return;
 if (!Array.isArray(def.presets)) throw new Error(`${where}: presets must be a list`);
 const keys = new Set();
 for (const preset of def.presets) {
  if (typeof preset?.key !== 'string' || typeof preset.label !== 'string') throw new Error(`${where}: a preset has no key or label`);
  if (keys.has(preset.key)) throw new Error(`${where}: preset "${preset.key}" is repeated`);
  keys.add(preset.key);
  if (!def.schema.safeParse({ ...def.defaults, ...preset.data }).success) throw new Error(`${where}: preset "${preset.key}" doesn't fit the schema`);
 }
}

// Where a block comes from, for the studio's tray: a site's own blocks are
// private; shared ones are Timbrr's base library unless a brand owns them
// (commissioned by one site, shared with every site: the community shelf).
export function tierOf(def, layer) {
 if (layer.tier === 'private') return 'private';
 return def.owner ? 'community' : 'base';
}

// Checks every definition and turns it into its manifest entry. A broken
// definition is a build error that names the block, never a quiet skip.
export function buildManifest(site, layers, definitions) {
 const seen = new Map();
 const blocks = definitions.map(({ def, layer }) => {
  const where = `block "${def?.type}" (${layer.name})`;
  if (!TYPE.test(def?.type ?? '')) throw new Error(`${where}: type must be lowercase letters, digits and _`);
  if (seen.has(def.type)) throw new Error(`${where}: type already defined by ${seen.get(def.type)}`);
  seen.set(def.type, layer.name);
  if (!CATEGORIES.includes(def.category)) throw new Error(`${where}: unknown category "${def.category}"`);
  if (!(def.schema instanceof z.ZodObject)) throw new Error(`${where}: schema must be a z.object`);
  checkFields(def.fields, def.schema.shape, where);
  for (const [key, tools] of Object.entries(def.wys ?? {})) {
   const bad = tools.find((tool) => !WYS_TOOLS.includes(tool));
   if (bad) throw new Error(`${where}: wys.${key} has unknown tool "${bad}"`);
  }
  if (def.advanced && def.retired) throw new Error(`${where}: a block can't be advanced and retired`);
  checkPresets(def, where);
  const defaults = def.schema.parse(def.defaults ?? {});
  return {
   type: def.type,
   tier: tierOf(def, layer),
   owner: def.owner ?? null,
   layer: layer.name,
   component: componentName(def.type),
   label: def.label,
   description: def.description ?? '',
   category: def.category,
   icon: def.icon ?? 'square',
   ...(def.frame === true ? { frame: true } : {}),
   ...(def.advanced === true ? { advanced: true } : {}),
   ...(def.retired === true ? { retired: true } : {}),
   ...(def.presets?.length ? { presets: def.presets } : {}),
   ...(def.keywords?.length ? { keywords: def.keywords } : {}),
   fields: def.fields,
   defaults,
   wys: def.wys ?? {},
   schema: z.toJSONSchema(def.schema, { io: 'input', unrepresentable: 'throw' }),
  };
 });
 return { version: MANIFEST_VERSION, generatedAt: new Date().toISOString(), site, layers, widgets: WIDGETS, blocks };
}

// What wraps a field's real shape (a default, a missing value allowed);
// what's inside says what the field holds.
const WRAPPERS = new Set(['default', 'prefault', 'optional', 'nullable', 'nonoptional', 'readonly', 'catch', 'lazy']);

function bare(schema) {
 let inner = schema;
 while (WRAPPERS.has(inner?.type) && typeof inner.unwrap === 'function') inner = inner.unwrap();
 return inner;
}

// The most a text field holds, by its path in a block's data
// ('items.0.title'): its schema's max length, or null when it has none.
// The canvas stops typing there, as the studio's inspector does.
export function textLimit(schema, path) {
 let node = bare(schema);
 for (const key of String(path).split('.')) {
  if (node?.type === 'object' && Object.hasOwn(node.shape, key)) node = bare(node.shape[key]);
  else if (node?.type === 'array' && /^\d+$/.test(key)) node = bare(node.element);
  else return null;
 }
 return node?.type === 'string' ? node.maxLength : null;
}

// A parse that never throws: a value nested deeper than the parser can
// follow (a rich-text document thousands of levels down) just doesn't fit.
function tryParse(schema, value) {
 try {
  return schema.safeParse(value);
 } catch {
  return { success: false };
 }
}

// `value` with every part that doesn't fit `schema` taken out, field by
// field and row by row, so the default shows in its place; undefined when
// none of it can be kept. Rows stay where they are (one that isn't a row at
// all comes back blank), since the canvas edits a row's fields by position.
function mend(schema, value) {
 if (tryParse(schema, value).success) return value;
 const inner = bare(schema);
 let kept;
 if (inner?.type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
  kept = Object.fromEntries(Object.entries(inner.shape).map(([key, field]) => [key, mend(field, value[key])]));
 } else if (inner?.type === 'array' && Array.isArray(value)) {
  const blank = bare(inner.element)?.type === 'object' ? {} : undefined;
  kept = value.map((row) => mend(inner.element, row) ?? blank);
 }
 return kept !== undefined && tryParse(schema, kept).success ? kept : undefined;
}

// A block's data with its defaults filled in, for rendering. A value that
// doesn't fit (an older shape, a hand edit, a field past its limit) shows
// its default, and only that value: the rest of the block stays as it is.
// Data that isn't a block's at all falls back to the block's defaults
// rather than breaking the page.
export function blockData(def, data) {
 const parsed = tryParse(def.schema, data ?? {});
 if (parsed.success) return parsed.data;
 const kept = tryParse(def.schema, mend(def.schema, data));
 return kept.success ? kept.data : def.schema.parse(def.defaults ?? {});
}
