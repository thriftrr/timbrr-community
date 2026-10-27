import { z } from 'zod';
import { defineBlock, headlineField, taglineField } from '../schema/define.js';

export default defineBlock({
 type: 'testimonials',
 label: 'Testimonials',
 description: 'Hand-picked quotes',
 category: 'common',
 icon: 'quote',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  items: z
   .array(z.object({ quote: z.string().max(600).default(''), name: z.string().max(80).default(''), role: z.string().max(80).default('') }))
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
   itemLabel: 'name',
   subfields: [
    { key: 'quote', label: 'Quote', widget: 'textarea', inline: true },
    { key: 'name', label: 'Name', widget: 'text', inline: true },
    { key: 'role', label: 'Who they are', widget: 'text', inline: true },
   ],
  },
 ],
 defaults: {
  tagline: 'Regulars',
  headline: 'People keep coming back',
  items: [
   { quote: 'The best thing on the block. I come every week.', name: 'Dana R.', role: 'Neighbor' },
   { quote: 'They did exactly what they said, for the price they said.', name: 'Marcus T.', role: 'Customer' },
  ],
 },
 wys: { tagline: [], headline: ['italic'], 'items.*.quote': ['italic'] },
});
