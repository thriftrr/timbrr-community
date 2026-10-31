import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

export default defineBlock({
 type: 'testimonials',
 label: 'Testimonials',
 description: 'Hand-picked quotes',
 category: 'common',
 icon: 'testimonials',
 retired: true,
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  items: z
   .array(
    z.object({
     quote: richTextSchema.default(richText('')),
     name: z.string().max(80).default(''),
     role: z.string().max(80).default(''),
    }),
   )
   .max(12)
   .default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  {
   key: 'items',
   label: 'Quotes',
   widget: 'items',
   itemLabel: 'quote',
   max: 12,
   subfields: [
    { key: 'quote', label: 'Quote', widget: 'html', inline: true },
    { key: 'name', label: 'Name', widget: 'text', inline: true },
    { key: 'role', label: 'Role', widget: 'text', inline: true, placeholder: 'Customer, neighbor, regular…' },
   ],
  },
 ],
 defaults: {
  tagline: 'Kind words',
  headline: 'People keep coming back',
  items: [
   { quote: richText('The best on this side of town, full stop.'), name: 'Jordan K.', role: 'Neighbor' },
   { quote: richText('Fair prices, honest advice, and always on time. Never once a letdown.'), name: 'Rosa M.', role: 'Customer' },
  ],
 },
 wys: { tagline: [], headline: [], 'items.*.quote': ['italic'], 'items.*.name': [], 'items.*.role': [] },
});
