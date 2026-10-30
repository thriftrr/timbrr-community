import { z } from 'zod';

// What a block definition may say. A studio renders the inspector from
// `fields`, so the widget set is fixed: a manifest can't invent a widget the
// studio doesn't ship.
export const CATEGORIES = ['content', 'common', 'layout', 'dynamic', 'cta'];
export const WIDGETS = ['text', 'textarea', 'html', 'select', 'buttons', 'items', 'image', 'nav'];
export const WYS_TOOLS = ['bold', 'italic', 'underline', 'link', 'h2', 'h3', 'ul', 'ol', 'clear'];

// One block: its data shape (`schema`, zod), how the studio edits it
// (`fields`), what a new one starts with (`defaults`), and how it shows in
// the tray. The Vue component sits beside it by name:
// blocks/hero.js → app/components/blocks/Hero.global.vue.
//
//  type        unique; community and private blocks carry a prefix (buroak_hours)
//  category    content | common | layout | dynamic | cta
//  icon        a name in the studio's icon set; Timbrr's own blocks use
//              their type (unknown names draw as a square)
//  fields      [{ key, label, widget, inline?, link?, ai?, options?, subfields?,
//              itemLabel?, max?, help?, placeholder? }]; `link` marks a text
//              field holding an address (the studio offers a page picker)
//  wys         per-field formatting tools on the canvas; unlisted → bold, italic
//  owner       the brand that commissioned it (community and private tiers)
//  frame       true: a site's header or footer, kept in the studio's Library
//              and never in the tray (docs/manifest.md § Header and footer)
export function defineBlock(definition) {
 return definition;
}

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
// subject is. Every one of those is optional, so pages saved before the
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
});

export const buttonSchema = z.object({
 label: z.string().max(60).default(''),
 to: z.string().max(2000).default(''),
 style: z.enum(['solid', 'outline']).default('solid'),
});

// One menu item, the NavItem the site's header and footer draw
// (docs/README.md § Header and footer), one level of children at most. The
// limits are the ones the canvas keeps to (navItem in pages/__timbrr/canvas.vue).
const navEntrySchema = z.object({
 label: z.string().max(120).default(''),
 kind: z.enum(['page', 'external', 'none']).default('page'),
 to: z.string().max(2000).default(''),
 layout: z.enum(['dropdown', 'mega']).optional(),
 desc: z.string().max(200).optional(),
});
export const navItemSchema = navEntrySchema.extend({ children: z.array(navEntrySchema).max(40).optional() });
export const navListSchema = z.array(navItemSchema).max(40).default([]);

// Fields more than one block uses.
export const taglineField = { key: 'tagline', label: 'Tagline', widget: 'text', inline: true };
export const headlineField = { key: 'headline', label: 'Headline', widget: 'text', inline: true, ai: 'generate' };
export const buttonsField = {
 key: 'buttons',
 label: 'Buttons',
 widget: 'items',
 itemLabel: 'label',
 subfields: [
  { key: 'label', label: 'Label', widget: 'text', inline: true },
  { key: 'to', label: 'Links to', widget: 'text', link: true, placeholder: '/contact or https://…' },
  {
   key: 'style',
   label: 'Style',
   widget: 'buttons',
   options: [
    { label: 'Solid', value: 'solid' },
    { label: 'Outline', value: 'outline' },
   ],
  },
 ],
};
