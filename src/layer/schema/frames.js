import { z } from 'zod';
import { imageSchema, navEntrySchema, navListSchema } from './define.js';
import { blockData } from './manifest.js';

// What a site's header and footer hold (docs/manifest.md § Header and footer),
// and the small pure sums <TbSiteHeader> and <TbSiteFooter> draw from. It all
// lives apart from the components so the block definitions, the canvas and
// scripts/check-frames.mjs can read it without Vue.

const on = z.boolean().default(false);
const address = z.string().max(2000).default('');

const buttonShape = z
 .object({
  label: z.string().max(60).default(''),
  to: address,
 })
 .default({ label: '', to: '' });

const iconShape = z.object({ on, to: address }).default({ on: false, to: '' });

export const headerSchema = z.object({
 layout: z.enum(['left', 'center', 'button']).default('left'),
 logo: imageSchema.default({ src: '', alt: '' }),
 announce: z
  .object({
   on,
   text: z.string().max(200).default(''),
   to: address,
  })
  .default({ on: false, text: '', to: '' }),
 utility: z
  .object({
   on,
   links: z.array(navEntrySchema).max(6).default([]),
  })
  .default({ on: false, links: [] }),
 menu: navListSchema,
 primary: buttonShape,
 secondary: buttonShape,
 icons: z
  .object({
   search: iconShape,
   account: iconShape,
   cart: iconShape,
   phone: z.object({ on }).default({ on: false }),
   language: z
    .object({
     on,
     to: address,
     label: z.string().max(20).default(''),
    })
    .default({ on: false, to: '', label: '' }),
  })
  .default({
   search: { on: false, to: '' },
   account: { on: false, to: '' },
   cart: { on: false, to: '' },
   phone: { on: false },
   language: { on: false, to: '', label: '' },
  }),
 sticky: z.enum(['never', 'always', 'up']).default('never'),
 transparent: z.boolean().default(false),
 phone: z
  .object({
   style: z.enum(['accordion', 'drill', 'full']).default('accordion'),
   pins: z
    .object({
     button: on,
     phone: on,
     cart: on,
    })
    .default({ button: false, phone: false, cart: false }),
  })
  .default({ style: 'accordion', pins: { button: false, phone: false, cart: false } }),
});

export const SOCIAL_NETWORKS = ['instagram', 'facebook', 'x', 'youtube', 'linkedin', 'tiktok'];

export const footerSchema = z.object({
 layout: z.enum(['columns', 'centered', 'slim']).default('columns'),
 columns: navListSchema,
 newsletter: z
  .object({
   on,
   headline: z.string().max(160).default(''),
   label: z.string().max(60).default(''),
   to: address,
  })
  .default({ on: false, headline: '', label: '', to: '' }),
 contact: z
  .object({
   hours: on,
   address: on,
   phone: on,
  })
  .default({ hours: false, address: false, phone: false }),
 social: z
  .array(
   z.object({
    network: z.enum(SOCIAL_NETWORKS).default('instagram'),
    to: address,
   }),
  )
  .max(6)
  .default([]),
 legal: z.string().max(300).default(''),
 legal_links: z.array(navEntrySchema).max(4).default([]),
});

export const HEADER_DEFAULTS = headerSchema.parse({});
export const FOOTER_DEFAULTS = footerSchema.parse({});

function isObject(value) {
 return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

const text = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');

// ── Menus ──
// Only strings and items of the shape a menu holds, cut to what the schema
// takes: one row past a limit would otherwise lose the whole list to its
// default. The canvas keeps the site's menu through these too. A `layout` of
// 'link' stays, and so do the children under it, so switching a dropdown to a
// link and back loses nothing.
export function navItem(item, depth) {
 return {
  label: text(item.label, 120),
  kind: ['page', 'external', 'none'].includes(item.kind) ? item.kind : undefined,
  to: text(item.to, 2000),
  layout: ['link', 'dropdown', 'mega'].includes(item.layout) ? item.layout : undefined,
  desc: text(item.desc, 200),
  group: text(item.group, 60),
  children: depth > 0 ? navList(item.children, depth - 1) : [],
 };
}

export function navList(list, depth) {
 return Array.isArray(list)
  ? list
     .filter(isObject)
     .slice(0, 40)
     .map((item) => navItem(item, depth))
  : [];
}

// ── The old shapes ──
// A frame saved before this one has `style` where this has `layout`, and the
// layer reads both until the studio's conversion has run, so a site that
// updates first still draws its header. `layout` is the mark of the new shape,
// and data with it comes back untouched, whatever else it holds.

export function upgradeHeader(data) {
 if (!isObject(data)) return headerSchema.parse({});
 if (typeof data.layout === 'string' || !['style', 'cta', 'bar'].some((key) => key in data)) return data;
 return {
  ...headerSchema.parse({}),
  menu: Array.isArray(data.menu) ? data.menu : [],
  // The words stay even where they weren't showing: the announcement only
  // comes on for the Bar style, and an owner can switch it on later.
  announce: { on: data.style === 'bar', text: text(data.bar, 200), to: '' },
  primary: { label: text(data.cta?.label, 60), to: text(data.cta?.to, 2000) },
 };
}

export function upgradeFooter(data) {
 if (!isObject(data)) return footerSchema.parse({});
 if (typeof data.layout === 'string' || !('style' in data)) return data;
 return {
  ...footerSchema.parse({}),
  layout: data.style === 'slim' ? 'slim' : 'columns',
  columns: Array.isArray(data.columns) ? data.columns : [],
  legal: text(data.legal, 300),
 };
}

// A site with no frame, as header or footer data, so there's one way of
// drawing them.
export function headerFromSite(site) {
 const cta = isObject(site?.cta) ? site.cta : null;
 return {
  ...headerSchema.parse({}),
  menu: navList(site?.nav, 1),
  primary: { label: text(cta?.label, 60), to: cta?.kind === 'none' ? '' : text(cta?.to, 2000) },
 };
}

export function footerFromSite(site) {
 return { ...footerSchema.parse({}), columns: navList(site?.nav, 1) };
}

// What a component draws from stored data of either shape: upgraded, then
// checked field by field as a block's data is, so anything that doesn't fit
// shows its default and the rest stays.
export function headerData(data) {
 return blockData({ schema: headerSchema }, upgradeHeader(data));
}

export function footerData(data) {
 return blockData({ schema: footerSchema }, upgradeFooter(data));
}

// ── Big menus ──
// A big menu's columns, each { title, links }. With a group on any child,
// one column per group in the order they first appear, and children without
// one in a column headed "More". With none, three columns with no heading,
// as even as they'll go; a menu of fewer than three links has fewer.
export function megaColumns(children) {
 const list = Array.isArray(children) ? children : [];
 const groupOf = (child) => (typeof child?.group === 'string' ? child.group.trim() : '');
 if (!list.some(groupOf)) {
  const rest = [...list];
  return [3, 2, 1].map((left) => ({ title: '', links: rest.splice(0, Math.ceil(rest.length / left)) })).filter((column) => column.links.length);
 }
 const columns = [];
 for (const child of list) {
  const title = groupOf(child) || 'More';
  const column = columns.find((entry) => entry.title === title);
  if (column) column.links.push(child);
  else columns.push({ title, links: [child] });
 }
 return columns;
}

// ── From Site details ──

// The number to dial as an address: its digits (and a leading +), less any
// extension. One with words in it (1-800-FLOWERS) gives '', so it stays text
// rather than dial the wrong number, as the Call now block does.
export function telHref(phone) {
 const number = String(phone ?? '').replace(/\s*(?:ext\.?|extension|x)\s*\d+\s*$/i, '');
 if (/[a-z]/i.test(number)) return '';
 const digits = number.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
 return /\d{3}/.test(digits) ? `tel:${digits}` : '';
}

// An address as the lines it reads in: the street, then "Rockford, IL 61101".
export function addressLines(details) {
 const city = [details?.city, [details?.region, details?.postal].filter(Boolean).join(' ')].filter(Boolean).join(', ');
 return [details?.street, city].filter(Boolean);
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// '17:30' → '5:30 pm'; anything else → ''.
function clock(value) {
 const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value ?? ''));
 if (!match) return '';
 const hour = Number(match[1]);
 return `${hour % 12 || 12}:${match[2]} ${hour < 12 ? 'am' : 'pm'}`;
}

// Days in a row read as a range, the rest as a list: 'Mon – Fri', 'Mon, Wed',
// 'Mon – Wed, Sat'. Two together don't need the dash.
function dayNames(days) {
 const runs = [];
 for (const day of days) {
  const run = runs.at(-1);
  if (run && run[1] === day - 1) run[1] = day;
  else runs.push([day, day]);
 }
 return runs
  .map(([first, last]) => {
   if (first === last) return DAYS[first];
   return last === first + 1 ? `${DAYS[first]}, ${DAYS[last]}` : `${DAYS[first]} – ${DAYS[last]}`;
  })
  .join(', ');
}

// Site details' seven rows (Monday first), with the days that share their
// hours together: [{ days: 'Mon – Fri', hours: '9:00 am – 5:00 pm' },
// { days: 'Sun', hours: 'Closed' }]. A row with no sense in it is left out.
export function groupHours(hours) {
 if (!Array.isArray(hours)) return [];
 const groups = [];
 hours.slice(0, 7).forEach((row, day) => {
  const open = clock(row?.open);
  const close = clock(row?.close);
  const label = row?.closed === true ? 'Closed' : open && close ? `${open} – ${close}` : '';
  if (!label) return;
  const group = groups.find((entry) => entry.hours === label);
  if (group) group.days.push(day);
  else groups.push({ hours: label, days: [day] });
 });
 return groups.map((group) => ({ days: dayNames(group.days), hours: group.hours }));
}
