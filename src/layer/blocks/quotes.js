import { z } from 'zod';
import { defineBlock, headlineField, imageSchema, richText, richTextSchema, taglineField } from '../schema/define.js';

// Things customers said, chosen and typed in here. One large draws the first
// quote and keeps the rest, so switching back loses nothing.
export default defineBlock({
 type: 'quotes',
 label: 'Quotes',
 description: 'Hand-picked words from customers',
 category: 'common',
 icon: 'quotes',
 keywords: ['testimonials', 'reviews', 'customers', 'praise', 'kind words'],
 presets: [
  {
   key: 'testimonials',
   label: 'Testimonials',
   description: 'Several quotes on a soft band',
   data: { layout: 'several', background: 'soft' },
  },
 ],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  layout: z.enum(['one', 'several']).default('several'),
  items: z
   .array(
    z.object({
     quote: richTextSchema.default(richText('')),
     name: z.string().max(80).default(''),
     role: z.string().max(80).default(''),
     image: imageSchema.default({ src: '', alt: '' }),
    }),
   )
   .max(12)
   .default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  {
   key: 'layout',
   label: 'Layout',
   widget: 'buttons',
   options: [
    { label: 'One large', value: 'one' },
    { label: 'Several', value: 'several' },
   ],
   help: 'One large shows the first quote.',
  },
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
    { key: 'image', label: 'Photo', widget: 'image', help: 'Optional. Shown small, in a circle, beside the name.' },
   ],
  },
 ],
 defaults: {
  tagline: 'Kind words',
  headline: 'People keep coming back',
  layout: 'several',
  items: [
   { quote: richText('The best on this side of town, full stop.'), name: 'Jordan K.', role: 'Neighbor' },
   { quote: richText('Fair prices, honest advice, and always on time. Never once a letdown.'), name: 'Rosa M.', role: 'Customer' },
  ],
 },
 wys: { tagline: [], headline: [], 'items.*.quote': ['italic'], 'items.*.name': [], 'items.*.role': [] },
});
