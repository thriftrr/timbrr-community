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

function checkFields(fields, shape, where) {
 if (!Array.isArray(fields)) throw new Error(`${where}: fields must be a list`);
 for (const field of fields) {
  if (!WIDGETS.includes(field.widget)) throw new Error(`${where}.${field.key}: unknown widget "${field.widget}"`);
  if (shape && !(field.key in shape)) throw new Error(`${where}.${field.key}: not in the schema`);
  if (field.widget === 'items') checkFields(field.subfields ?? [], null, `${where}.${field.key}`);
  if ((field.widget === 'select' || field.widget === 'buttons') && !field.options?.length) {
   throw new Error(`${where}.${field.key}: needs options`);
  }
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
   fields: def.fields,
   defaults,
   wys: def.wys ?? {},
   schema: z.toJSONSchema(def.schema, { io: 'input', unrepresentable: 'throw' }),
  };
 });
 return { version: MANIFEST_VERSION, generatedAt: new Date().toISOString(), site, layers, widgets: WIDGETS, blocks };
}

// A block's data with its defaults filled in, for rendering. Data that
// doesn't fit (an older shape, a hand edit) falls back to the defaults
// rather than breaking the page.
export function blockData(def, data) {
 const parsed = def.schema.safeParse(data ?? {});
 if (parsed.success) return parsed.data;
 return def.schema.parse(def.defaults ?? {});
}
