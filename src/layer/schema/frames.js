import { z } from 'zod';
import { imageSchema, navEntrySchema, navListSchema } from './define.js';
import { blockData } from './manifest.js';
import { BRAND_COLORS } from '../app/utils/brand.js';

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

// The site's palette, by Branding's own keys (utils/brand.js): a header or
// footer is only ever coloured from it, so nothing can clash with Branding,
// and it follows when Branding changes. '' means not chosen. `font` is one of
// the brand's two text fonts, and '' leaves the page's.
export const FRAME_COLOR_KEYS = BRAND_COLORS.map((color) => color.key);
const colorKey = z.enum(['', ...FRAME_COLOR_KEYS]).default('');
const frameFont = z.enum(['', 'display', 'body']).default('');

// The CSS the palette key stands for, or '' for anything that isn't one.
export function paletteVar(key) {
 const color = BRAND_COLORS.find((entry) => entry.key === key);
 return color ? `var(${color.variable})` : '';
}

const iconShape = z.object({ on, to: address }).default({ on: false, to: '' });

export const headerSchema = z.object({
 layout: z.enum(['left', 'center', 'button']).default('left'),
 // Never saved: the studio's hover preview of a phone menu style sets it, to
 // draw the menu open (FB-111).
 showMenu: z.boolean().optional(),
 // Where the menu sits on the bar when the logo is on the left: straight
 // after the logo, in the middle, or on the right beside the buttons.
 menuAt: z.enum(['left', 'center', 'right']).default('left'),
 // What stands for the site at the start of the bar: its logo (a picture,
 // or the site's name where there is none), or a wordmark (the site's name,
 // or `wordmark` when it's set, in the heading font).
 mark: z.enum(['logo', 'wordmark']).default('logo'),
 wordmark: z.string().max(60).default(''),
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
 // How the bar looks, all of it from the site's own colors and fonts, so
 // nothing here can clash with Branding. The defaults are how every header
 // looked before there was a choice.
 look: z
  .object({
   background: z.enum(['light', 'brand', 'dark']).default('light'),
   height: z.enum(['compact', 'regular', 'roomy']).default('regular'),
   edge: z.enum(['none', 'line', 'shadow']).default('line'),
   button: z.enum(['filled', 'outline']).default('filled'),
   logo: z.enum(['small', 'medium', 'large']).default('medium'),
   // Palette colours (FB-123): the bar's background, its words and links, the
   // main button (`buttonInk` its words). Any of them left '' keeps what
   // `background` gives.
   colors: z
    .object({ bg: colorKey, ink: colorKey, button: colorKey, buttonInk: colorKey })
    .default({ bg: '', ink: '', button: '', buttonInk: '' }),
   font: frameFont,
  })
  .default({ background: 'light', height: 'regular', edge: 'line', button: 'filled', logo: 'medium', colors: { bg: '', ink: '', button: '', buttonInk: '' }, font: '' }),
 // Show the site's social icons (Site details, FB-122) in the bar.
 showSocial: z.boolean().default(false),
 // The starting look the studio last applied, so it can say what's been
 // changed since and put it back. The site never reads it.
 start: z.string().max(40).default(''),
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

// Site details' networks (shared/utils/site-details.js in the studio), in the
// order their icons are drawn.
export const SOCIAL_NETWORKS = ['instagram', 'facebook', 'x', 'youtube', 'linkedin', 'tiktok', 'pinterest'];

export const footerSchema = z.object({
 layout: z.enum(['columns', 'centered', 'slim']).default('columns'),
 columns: navListSchema,
 newsletter: z
  .object({
   on,
   headline: z.string().max(160).default(''),
   label: z.string().max(60).default(''),
   to: address,
   // A form to show here, from the studio's Forms, in place of the button.
   form: z.string().max(64).default(''),
  })
  .default({ on: false, headline: '', label: '', to: '', form: '' }),
 contact: z
  .object({
   hours: on,
   address: on,
   phone: on,
  })
  .default({ hours: false, address: false, phone: false }),
 // Show the site's social icons, from Site details (FB-122). Missing means
 // the footer hasn't been converted yet: it follows `social`, which is its own
 // old list, drawn until convert-blocks folds it into Site details.
 showSocial: z.boolean().optional(),
 look: z
  .object({ colors: z.object({ bg: colorKey, ink: colorKey }).default({ bg: '', ink: '' }), font: frameFont })
  .default({ colors: { bg: '', ink: '' }, font: '' }),
 // The footer's own social list, from before Site details had one. Read, never
 // written by the studio any more.
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
 // One button that stays in the corner of every page as it scrolls: gift
 // cards, book now. It lives with the footer because it's the site's, not a
 // page's, and a site with no footer has none.
 floating: z
  .object({
   on,
   label: z.string().max(40).default(''),
   to: address,
  })
  .default({ on: false, label: '', to: '' }),
});

export const SOCIAL_MARKS = {
 instagram: {
  label: 'Instagram',
  line: true,
  path: 'M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM17.25 6.75h.01',
 },
 facebook: {
  label: 'Facebook',
  path: 'M13.5 21v-7.5H16l.5-3h-3V8.6c0-.9.3-1.6 1.6-1.6h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.3H8v3h2.5V21z',
 },
 x: {
  label: 'X',
  path: 'M17.5 3h3.1l-6.8 7.8L21.8 21h-6.3l-4.9-6.4L5 21H1.9l7.3-8.3L1.5 3H8l4.4 5.8zm-1.1 16.2h1.7L7 4.7H5.1z',
 },
 youtube: {
  label: 'YouTube',
  path: 'M22 8.2a3 3 0 0 0-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.5 12a31 31 0 0 0 .5 3.8 3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-3.8 31 31 0 0 0-.5-3.8zM10 15V9l5.2 3z',
 },
 linkedin: {
  label: 'LinkedIn',
  path: 'M5 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM3.3 9h3.4v11.5H3.3zM9 9h3.3v1.6h.1c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.2 2.4 4.2 5.4v6.4h-3.4v-5.7c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3v5.8H9z',
 },
 tiktok: {
  label: 'TikTok',
  path: 'M16.6 3c.3 2.2 1.6 3.6 3.9 3.8v3.1c-1.4.1-2.6-.3-3.9-1.1v5.9c0 3.7-2.7 6.3-6.1 6.3s-6-2.7-6-5.9c0-3.7 3.1-6.4 7-5.8v3.3c-1.9-.4-3.6.7-3.6 2.5 0 1.5 1.1 2.7 2.7 2.7 1.7 0 2.6-1.1 2.6-3V3z',
 },
 pinterest: {
  label: 'Pinterest',
  line: true,
  path: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM10.2 18l1.5-6.8M9.5 13.5c-.7-2.3.5-4.5 2.9-4.5 1.8 0 3 1.1 3 2.7 0 1.9-1.1 3.2-2.7 3.2-.9 0-1.5-.5-1.7-1.2',
 },
};

// The icons to draw for a site's social links: Site details' addresses
// (`details.social`, already checked by the studio) in the networks' own order,
// then any address a footer still lists that Site details hasn't (`legacy`,
// the old per-footer list, until convert-blocks has folded it in), so nothing
// goes missing in between. Each is { network, label, line, path, href }.
export function socialLinks(details, legacy = []) {
 const own = isObject(details?.social) ? details.social : {};
 const old = Array.isArray(legacy) ? legacy : [];
 return SOCIAL_NETWORKS.flatMap((network) => {
  const href = typeof own[network] === 'string' && own[network] ? own[network] : old.find((row) => row?.network === network && typeof row?.to === 'string')?.to ?? '';
  return href ? [{ network, ...SOCIAL_MARKS[network], href }] : [];
 });
}

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
// A big menu's feature card and button, or undefined when there's nothing
// in them to draw.
function navFeature(value) {
 if (!isObject(value)) return undefined;
 const image = isObject(value.image) && typeof value.image.src === 'string' ? { src: text(value.image.src, 2000), alt: text(value.image.alt, 300), width: value.image.width, height: value.image.height } : { src: '', alt: '' };
 const feature = { image, heading: text(value.heading, 80), text: text(value.text, 200), to: text(value.to, 2000) };
 return feature.heading.trim() || feature.image.src ? feature : undefined;
}

function navButton(value) {
 if (!isObject(value)) return undefined;
 const button = { label: text(value.label, 60), to: text(value.to, 2000) };
 return button.label.trim() ? button : undefined;
}

export function navItem(item, depth) {
 return {
  label: text(item.label, 120),
  kind: ['page', 'external', 'none'].includes(item.kind) ? item.kind : undefined,
  to: text(item.to, 2000),
  layout: ['link', 'dropdown', 'mega'].includes(item.layout) ? item.layout : undefined,
  desc: text(item.desc, 200),
  group: text(item.group, 60),
  children: depth > 0 ? navList(item.children, depth - 1) : [],
  ...(depth > 0 ? { feature: navFeature(item.feature), button: navButton(item.button) } : {}),
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
