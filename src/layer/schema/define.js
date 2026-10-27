import { z } from 'zod';

// What a block definition may say. A studio renders the inspector from
// `fields`, so the widget set is fixed: a manifest can't invent a widget the
// studio doesn't ship.
export const CATEGORIES = ['content', 'common', 'layout', 'dynamic', 'cta'];
export const WIDGETS = ['text', 'textarea', 'html', 'select', 'buttons', 'items', 'image'];
export const WYS_TOOLS = ['bold', 'italic', 'underline', 'link', 'h2', 'h3', 'ul', 'ol', 'clear'];

// One block: its data shape (`schema`, zod), how the studio edits it
// (`fields`), what a new one starts with (`defaults`), and how it shows in
// the tray. The Vue component sits beside it by name:
// blocks/hero.js → app/components/blocks/Hero.global.vue.
//
//  type        unique; community and private blocks carry a prefix (buroak_hours)
//  category    content | common | layout | dynamic | cta
//  icon        a Lucide icon name; the studio draws it
//  fields      [{ key, label, widget, inline?, ai?, options?, subfields?, help? }]
//  wys         per-field formatting tools on the canvas; unlisted → bold, italic
//  owner       the brand that commissioned it (community and private tiers)
export function defineBlock(definition) {
 return definition;
}

// Rich text is stored as a small document tree, never HTML, so nothing a
// page holds can run as markup on the site (TbRich renders it).
export const richTextSchema = z.object({
 type: z.literal('doc'),
 content: z.array(z.record(z.string(), z.unknown())).default([]),
});

export function richText(...paragraphs) {
 return {
  type: 'doc',
  content: paragraphs.map((text) => ({ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] })),
 };
}

export const imageSchema = z.object({
 src: z.string().max(2000).default(''),
 alt: z.string().max(300).default(''),
});

export const buttonSchema = z.object({
 label: z.string().max(60).default(''),
 to: z.string().max(2000).default(''),
 style: z.enum(['solid', 'outline']).default('solid'),
});

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
  { key: 'to', label: 'Links to', widget: 'text', placeholder: '/contact or https://…' },
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
