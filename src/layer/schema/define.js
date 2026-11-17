import { z } from 'zod';
import { BUTTON_ICONS } from '../app/utils/button-icons.js';

// What a block definition may say. A studio renders the inspector from
// `fields`, so the widget set is fixed: a manifest can't invent a widget the
// studio doesn't ship.
export const CATEGORIES = ['content', 'common', 'layout', 'dynamic', 'cta'];
// `stepper` is a whole number between the field's `min` and `max`, with a
// minus and a plus beside it; it saves a number, or its text where the
// schema is text. `table` is a grid of cells (`tableSchema`, below). `number` and `range` save the same way. What each widget
// holds and reads is in docs/manifest.md § Widgets.
export const WIDGETS = [
 'text',
 'textarea',
 'html',
 'select',
 'buttons',
 'items',
 'image',
 'nav',
 'switch',
 'group',
 'form',
 'stepper',
 'number',
 'range',
 'date',
 'time',
 'checks',
 'color',
 'icon',
 'tags',
 'code',
 'hours',
 'table',
 // What a Grove list draws from (docs/README.md § Groves): { grove, sort,
 // dir, limit, filter, show, branch, related }, picked in the studio.
 'grove',
 // Which ring of a sapling a Sapling ring block shows: a ring's key, picked
 // from the grove's own list. The studio's picker also sets `kind` and
 // `from` on the block beside it.
 'grove_ring',
 // retired: what the retired content blocks name; drop with them
 'content',
 'content_field',
];
// The widgets that pick from `options`.
export const CHOICE_WIDGETS = ['select', 'buttons', 'checks', 'color', 'icon'];
export const WYS_TOOLS = ['bold', 'italic', 'underline', 'link', 'h2', 'h3', 'ul', 'ol', 'clear'];

// What every block can set about how it sits on the page: its background,
// the room around it and a rule above it. They're what the Section, Spacer
// and Divider blocks used to do, and TbBlockScope turns them into classes on
// the block's root (site.css, § The look of a block), so a block needs no
// code of its own for them. Flat keys, because the inspector only sets
// top-level ones.
const lookShape = {
 background: z.enum(['page', 'soft', 'brand', 'dark']).default('page'),
 spacing: z.enum(['tight', 'normal', 'roomy']).default('normal'),
 divider: z.boolean().default(false),
};
const lookFields = [
 {
  key: 'background',
  label: 'Background',
  widget: 'color',
  // `swatch` names the brand color the studio fills each choice with.
  options: [
   { label: 'Page', value: 'page', swatch: 'bg' },
   { label: 'Soft', value: 'soft', swatch: 'surface' },
   { label: 'Brand', value: 'brand', swatch: 'accent' },
   { label: 'Dark', value: 'dark', swatch: 'dark' },
  ],
 },
 {
  key: 'spacing',
  label: 'Spacing',
  widget: 'buttons',
  options: [
   { label: 'Tight', value: 'tight' },
   { label: 'Normal', value: 'normal' },
   { label: 'Roomy', value: 'roomy' },
  ],
 },
 { key: 'divider', label: 'Line above', widget: 'switch' },
];

// One block: its data shape (`schema`, zod), how the studio edits it
// (`fields`), what a new one starts with (`defaults`), and how it shows in
// the tray. The Vue component sits beside it by name:
// blocks/hero.js → app/components/blocks/Hero.global.vue. Its root must be
// one element, which is what takes the look's classes.
//
//  type        unique; community and private blocks carry a prefix (buroak_hours)
//  category    content | common | layout | dynamic | cta
//  icon        a name in the studio's icon set; Timbrr's own blocks use
//              their type (unknown names draw as a square)
//  fields      [{ key, label, widget, inline?, link?, format?, ai?, options?,
//              subfields?, itemLabel?, min?, max?, step?, unit?, help?,
//              placeholder?, when? }]; `when` says when the field applies
//              ({ otherKey: value | [values] | { not } | { filled } }, an
//              option can carry one too: app/utils/when.js, docs/manifest.md
//              § Conditional fields): the studio shows it only then, and the
//              block must not draw it otherwise; `link` marks a text
//              field holding an address (the studio offers a page picker)
//  wys         per-field formatting tools on the canvas; unlisted → bold, italic
//  owner       the brand that commissioned it (community and private tiers)
//  frame       true: a site's header or footer, kept in the studio's Library
//              and never in the tray (docs/manifest.md § Header and footer)
//  advanced    true: offered in the tray only on sites staff turned it on for
//  retired     true: replaced by a Core block. Never in the tray; pages that
//              still hold one keep drawing and saving until they're converted
//  presets     [{ key, label, description?, data }]: ways to start this block,
//              found by name in the tray's search; `data` goes over `defaults`
//  keywords    more words the tray's search finds this block by
//  without     look fields this block has no use for (['divider']); the
//              key stays in its data, the inspector just doesn't offer it
export function defineBlock(definition) {
 if (definition.frame || definition.retired) return definition;
 return {
  ...definition,
  schema: definition.schema.extend(lookShape),
  fields: [...definition.fields, ...lookFields.filter((field) => !definition.without?.includes(field.key))],
 };
}

// A table: rows of cells under column alignments, with the first row and the
// first column as headings if it says so. Every row holds a cell for every
// column. A merged cell is the top-left one of its box, carrying how far it
// reaches (`colspan` across, `rowspan` down); the cells it covers stay in
// their rows, empty and not drawn, so a cell is always found by its row and
// column. `tableLayout` (app/utils/blocks.js) works out what to draw.
export const TABLE_LIMITS = { columns: 12, rows: 60, cell: 500 };
export const tableSchema = z
 .object({
  align: z
   .array(z.enum(['left', 'center', 'right']))
   .max(TABLE_LIMITS.columns)
   .default([])
   .describe('How each column lines up, left to right. A column left out is left.'),
  rows: z
   .array(
    z
     .array(
      z.object({
       text: z.string().max(TABLE_LIMITS.cell).default(''),
       colspan: z.number().int().min(1).max(TABLE_LIMITS.columns).optional().describe('Columns this cell reaches across, itself included. The cells it covers stay in the row, empty.'),
       rowspan: z.number().int().min(1).max(TABLE_LIMITS.rows).optional().describe('Rows this cell reaches down, itself included. The cells it covers stay in their rows, empty.'),
      }),
     )
     .max(TABLE_LIMITS.columns),
   )
   .max(TABLE_LIMITS.rows)
   .default([])
   .describe('Top to bottom; each row is its cells left to right, one for every column.'),
  header_row: z.boolean().default(true).describe('The first row is the column headings.'),
  header_col: z.boolean().default(false).describe('The first column names each row.'),
 })
 .default({ align: [], rows: [], header_row: true, header_col: false });

// Rich text is stored as a small document tree, never HTML, so nothing a
// page holds can run as markup on the site (TbRich renders it). A plain
// string is accepted too — older pages, imports — and drawn as paragraphs;
// the first edit in the studio turns it into a document.
//
// Every node is checked all the way down: a type name, text only ever as a
// string, marks as a list of named marks, children as more nodes. Anything
// else (text that's an object, say) doesn't fit, so the studio refuses to
// save it and the site draws the field's default instead. Attributes stay
// loose: TbRich only reads the few it draws (a heading's level, a list's
// start, a link's address) and checks those itself.
const richAttrsSchema = z.record(z.string(), z.unknown());
const richNodeSchema = z.object({
 type: z.string(),
 text: z.string().optional(),
 marks: z.array(z.object({ type: z.string(), attrs: richAttrsSchema.optional() })).optional(),
 attrs: richAttrsSchema.optional(),
 get content() {
  return z.array(richNodeSchema).optional();
 },
});
export const richDocSchema = z.object({
 type: z.literal('doc'),
 content: z.array(richNodeSchema).default([]),
});
export const richTextSchema = z.union([richDocSchema, z.string().max(20000)]);

export function richText(...paragraphs) {
 return {
  type: 'doc',
  content: paragraphs.map((text) => ({ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] })),
 };
}

// What an image field holds. `src` and `alt` are all a pasted address has;
// a picture picked from the studio's media library also carries what the
// library knows about it (docs/manifest.md § Widgets): its id, the size of
// the file the address points at, a ThumbHash placeholder and where the
// subject is, and a placement may be zoomed in. Every one of those is optional, so pages saved before the
// library existed validate as they are, and <TbImage> simply draws more
// with each key it finds.
export const imageSchema = z.object({
 src: z.string().max(2000).default(''),
 alt: z.string().max(300).default(''),
 id: z.string().regex(/^[A-Za-z0-9_-]{16}$/).optional(),
 width: z.int().min(1).max(12000).optional(),
 height: z.int().min(1).max(12000).optional(),
 placeholder: z.string().max(64).optional(),
 focal: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).optional(),
 // How far this placement is zoomed in about its focal point (the studio's
 // crop). Missing is 1: the picture just covers its box.
 zoom: z.number().min(1).max(4).optional(),
});

export const buttonSchema = z.object({
 label: z.string().max(60).default(''),
 to: z.string().max(2000).default(''),
 // 'text' is the words alone with an arrow; 'icon' is a round button that
 // shows only its icon (the label is still read out).
 style: z.enum(['solid', 'outline', 'text', 'icon']).default('solid'),
 // A key of BUTTON_ICONS (app/utils/button-icons.js), or '' for none.
 icon: z.string().max(24).default(''),
});

// One menu item, the NavItem the site's header and footer draw
// (docs/README.md § Header and footer), one level of children at most. The
// limits are the ones the canvas keeps to (navItem in schema/frames.js).
// `layout` says how an item opens: as a plain link (its children stay, not
// drawn), a dropdown or a big menu; missing is a dropdown with children and a
// link without. `group` is a big menu's column heading, on a child.
export const navEntrySchema = z.object({
 label: z.string().max(120).default(''),
 kind: z.enum(['page', 'external', 'none']).default('page'),
 to: z.string().max(2000).default(''),
 layout: z.enum(['link', 'dropdown', 'mega']).optional(),
 desc: z.string().max(200).optional(),
 group: z.string().max(60).optional(),
});
// A big menu can hold more than links: one feature card beside its columns
// (a picture, a heading, a line, somewhere to go) and a button under them.
export const navFeatureSchema = z.object({
 image: imageSchema.default({ src: '', alt: '' }),
 heading: z.string().max(80).default(''),
 text: z.string().max(200).default(''),
 to: z.string().max(2000).default(''),
});
export const navButtonSchema = z.object({ label: z.string().max(60).default(''), to: z.string().max(2000).default('') });
export const navItemSchema = navEntrySchema.extend({
 children: z.array(navEntrySchema).max(40).optional(),
 feature: navFeatureSchema.optional(),
 button: navButtonSchema.optional(),
});
export const navListSchema = z.array(navItemSchema).max(40).default([]);

// What a field with the `grove` widget holds (docs/README.md § Groves): which
// grove, in what order, how many, narrowed how. The studio's picker writes
// it and the studio reads it again on every request, so this only says what
// may be kept. A site's own block takes it the same way:
//  schema: z.object({ source: groveSourceSchema }), fields: [{ key: 'source', label: 'What to list', widget: 'grove' }]
//  filters   fixed: [{ ring, op, value }], up to 5; `in` takes a list, `filled` no value
//  choices   rings a visitor narrows the list by, up to 3, as a dropdown or buttons
//  related   'none', 'points_here' (saplings whose relation ring names the
//            sapling the page shows), 'same_branch' (sharing a branch of
//            `relatedSet` with it) or 'linked' (the saplings its relation
//            ring `relatedRing` names); true is 'points_here', as kept before
//  relatedTo, branch   set by the studio as it serves a page, never by a person
//  filter    the single filter kept before `filters`, read as one of them
export const GROVE_FILTER_OPS = ['eq', 'ne', 'gte', 'lte', 'in', 'filled'];
const groveKey = z.string().max(40);
export const groveSourceSchema = z
 .object({
  grove: groveKey.default(''),
  sort: groveKey.default('published'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().min(1).max(50).default(12),
  filters: z
   .array(z.object({ ring: groveKey, op: z.enum(GROVE_FILTER_OPS), value: z.union([z.string().max(200), z.array(z.string().max(200)).max(20)]).default('') }))
   .max(5)
   .default([]),
  filter: z.object({ ring: groveKey, op: z.enum(['eq', 'gte', 'lte']), value: z.string().max(200) }).nullable().default(null),
  choices: z
   .array(z.object({ ring: groveKey, ui: z.enum(['select', 'buttons']).default('select') }))
   .max(3)
   .default([]),
  show: z.array(groveKey).max(12).default([]),
  related: z.union([z.enum(['none', 'points_here', 'same_branch', 'linked']), z.boolean()]).default('none'),
  relatedSet: groveKey.default(''),
  relatedRing: groveKey.default(''),
  relatedTo: z.string().max(64).default(''),
  branch: z.object({ set: groveKey, slug: z.string().max(63) }).nullable().default(null),
 })
 .prefault({});

// Fields more than one block uses.
export const taglineField = { key: 'tagline', label: 'Tagline', widget: 'text', inline: true, ai: 'generate' };
export const headlineField = { key: 'headline', label: 'Headline', widget: 'text', inline: true, ai: 'generate' };
export const buttonsField = {
 key: 'buttons',
 label: 'Buttons',
 widget: 'items',
 itemLabel: 'label',
 subfields: [
  // Two fields, one stored key: a round icon button shows no words, so its
  // label is asked for as what it is there, the name a screen reader says.
  { key: 'label', label: 'Label', widget: 'text', inline: true, when: { style: { not: 'icon' } } },
  { key: 'label', label: 'Name, read aloud', widget: 'text', when: { style: 'icon' }, help: 'Not shown. Screen readers say it, so say where the button goes.' },
  { key: 'to', label: 'Links to', widget: 'text', link: true, placeholder: '/contact or https://…' },
  {
   key: 'style',
   label: 'Style',
   widget: 'buttons',
   draws: 'button', // the studio lists these as the buttons they make
   options: [
    { label: 'Solid', value: 'solid' },
    { label: 'Outline', value: 'outline' },
    { label: 'Text', value: 'text' },
    { label: 'Icon', value: 'icon' },
   ],
  },
  ...[
   { when: { style: { not: 'icon' } }, help: 'Sits beside the label. Pick None for words alone.' },
   { when: { style: 'icon' }, help: 'The whole button. With None it shows an arrow.' },
  ].map((by) => ({
   key: 'icon',
   label: 'Icon',
   widget: 'icon',
   ...by,
   // `paths` is what the studio draws each choice with.
   options: [
    ['None', ''],
    ['Arrow', 'arrow'],
    ['Phone', 'phone'],
    ['Envelope', 'mail'],
    ['Calendar', 'calendar'],
    ['Map pin', 'pin'],
    ['Download', 'download'],
    ['Play', 'play'],
    ['Opens elsewhere', 'external'],
    ['Shopping bag', 'bag'],
    ['Speech bubble', 'chat'],
   ].map(([label, value]) => ({ label, value, ...(value ? { paths: BUTTON_ICONS[value] } : {}) })),
  })),
 ],
};
