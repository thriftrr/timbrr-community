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
 // What a Collection list draws from (docs/README.md § Collections): { collection, sort,
 // dir, limit, filter, show, value, related }, picked in the studio.
 'collection',
 // Which field of an entry an Entry field block shows: a field's key, picked
 // from the collection's own list. The studio's picker also sets `kind` and
 // `from` on the block beside it.
 'collection_field',
 // A product in the site's connected Shopify store (docs/manifest.md §
 // Widgets): its handle, picked from a search of the store in the studio.
 'shop_product',
 // A Shopify collection in that store: its handle, picked the same way.
 'shop_collection',
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
 // Room above and below set apart (FB-106). Left out, each is `spacing`,
 // so pages saved before keep their look; the inspector shows it that way.
 above: z.enum(['tight', 'normal', 'roomy']).optional(),
 below: z.enum(['tight', 'normal', 'roomy']).optional(),
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
 ...['above', 'below'].map((key) => ({
  key,
  label: key === 'above' ? 'Space above' : 'Space below',
  widget: 'buttons',
  fallback: 'spacing', // shown, and drawn, from `spacing` while unset
  options: [
   { label: 'Tight', value: 'tight' },
   { label: 'Normal', value: 'normal' },
   { label: 'Roomy', value: 'roomy' },
  ],
 })),
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
//              placeholder?, when?, fallback? }]; `when` says when the field applies
//              ({ otherKey: value | [values] | { not } | { filled } }, an
//              option can carry one too: app/utils/when.js, docs/manifest.md
//              § Conditional fields): the studio shows it only then, and the
//              block must not draw it otherwise; `link` marks a text
//              field holding an address (the studio offers a page picker)
//              and `fallback` names the key whose value it shows while unset
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
//  loads       the third parties this block can load or send a visitor to, by id
//              in schema/third-parties.js (['youtube']); check-embed.mjs fails
//              the build when a block uses one it didn't list
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
// The caps are loose on purpose: far past anything the editor makes, but
// enough that one field can't be tens of thousands of nodes re-checked on
// every view, or so deep that drawing it runs out of stack. Too tight and the
// studio would refuse a real save, or the site would fall back to the default.
const RICH_DEPTH = 16;
const richNodeSchema = z.object({
 type: z.string(),
 text: z.string().optional(),
 marks: z.array(z.object({ type: z.string(), attrs: richAttrsSchema.optional() })).max(8).optional(),
 attrs: richAttrsSchema.optional(),
 get content() {
  return z.array(richNodeSchema).max(200).optional();
 },
});
const richDepth = (nodes) => (Array.isArray(nodes) && nodes.length ? 1 + Math.max(...nodes.map((node) => richDepth(node?.content))) : 0);
export const richDocSchema = z
 .object({
  type: z.literal('doc'),
  content: z.array(richNodeSchema).max(1000).default([]),
 })
 .refine((doc) => richDepth(doc.content) <= RICH_DEPTH, { message: `Rich text nests at most ${RICH_DEPTH} deep.` });
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
 // Whose alt text this is: 'library' follows the media library's alt on
 // live pages (the studio fills it in at read time), 'page' is this page's
 // own and is kept. Missing on values saved before the marker existed.
 altFrom: z.enum(['library', 'page']).optional(),
});

// An icon drawn by its paths: each the `d` of one path on a 24 × 24 grid,
// drawn as a 2px stroke. Path commands, numbers and the marks between them,
// nothing else.
const svgPath = z
 .string()
 .max(2000)
 .regex(/^[MLHVCSQTAZmlhvcsqtaz\d\s,.eE+-]+$/);
export const iconDrawing = z.object({ name: z.string().max(60), paths: z.array(svgPath).min(1).max(24) });

export const buttonSchema = z.object({
 label: z.string().max(60).default(''),
 to: z.string().max(2000).default(''),
 // 'text' is the words alone with an arrow; 'icon' is a round button that
 // shows only its icon (the label is still read out).
 style: z.enum(['solid', 'outline', 'text', 'icon']).default('solid'),
 // A key of BUTTON_ICONS (app/utils/button-icons.js), or '' for none; or
 // any icon from the studio's full set, carried with the paths that draw it
 // ({ name, paths }), so a site needs no icon library of its own.
 icon: z.union([z.string().max(24), iconDrawing]).default(''),
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

// What a field with the `collection` widget holds (docs/README.md § Collections): which
// collection, in what order, how many, narrowed how. The studio's picker writes
// it and the studio reads it again on every request, so this only says what
// may be kept. A site's own block takes it the same way:
//  schema: z.object({ source: collectionSourceSchema }), fields: [{ key: 'source', label: 'What to list', widget: 'collection' }]
//  filters   fixed: [{ field, op, value }], up to 5; `in` takes a list, `filled` no value
//  choices   fields a visitor narrows the list by, up to 3, as a dropdown or buttons
//  related   'none', 'points_here' (entries whose relation field names the
//            entry the page shows), 'same_dimension_value' (sharing a value of
//            `relatedSet` with it) or 'linked' (the entries its relation
//            field `relatedField` names); true is 'points_here', as kept before
//  relatedTo, value   set by the studio as it serves a page, never by a person
//  filter    the single filter kept before `filters`, read as one of them
export const COLLECTION_FILTER_OPS = ['eq', 'ne', 'gte', 'lte', 'in', 'filled'];
const collectionKey = z.string().max(40);
export const collectionSourceSchema = z
 .object({
  collection: collectionKey.default(''),
  sort: collectionKey.default('published'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().min(1).max(50).default(12),
  filters: z
   .array(z.object({ field: collectionKey, op: z.enum(COLLECTION_FILTER_OPS), value: z.union([z.string().max(200), z.array(z.string().max(200)).max(20)]).default('') }))
   .max(5)
   .default([]),
  filter: z.object({ field: collectionKey, op: z.enum(['eq', 'gte', 'lte']), value: z.string().max(200) }).nullable().default(null),
  choices: z
   .array(z.object({ field: collectionKey, ui: z.enum(['select', 'buttons']).default('select') }))
   .max(3)
   .default([]),
  show: z.array(collectionKey).max(12).default([]),
  related: z.union([z.enum(['none', 'points_here', 'same_dimension_value', 'linked']), z.boolean()]).default('none'),
  relatedSet: collectionKey.default(''),
  relatedField: collectionKey.default(''),
  relatedTo: z.string().max(64).default(''),
  dimensionValue: z.object({ set: collectionKey, slug: z.string().max(63) }).nullable().default(null),
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
  { key: 'label', label: 'Name', widget: 'text', when: { style: 'icon' }, help: 'Not shown. Screen readers say it, so say where the button goes.' },
  { key: 'to', label: 'Link', widget: 'text', link: true, placeholder: '/contact or https://…' },
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
  {
   key: 'icon',
   label: 'Icon',
   widget: 'icon',
   // A studio that knows `any` searches every icon it has, beyond these,
   // and saves the one picked as { name, paths } (buttonSchema).
   any: true,
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
  },
 ],
};
