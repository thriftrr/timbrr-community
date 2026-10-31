import { z } from 'zod';
import { defineBlock, headlineField, taglineField } from '../schema/define.js';

// Big numbers with short labels. A number is words as they should read
// ("12,000+", "$4M", "98%"), not a value, so the block can say anything; the
// count-up finds the digits in it.
export default defineBlock({
 type: 'stats',
 label: 'Stats',
 description: 'Big numbers with short labels',
 category: 'common',
 icon: 'stats',
 keywords: ['numbers', 'figures', 'counter', 'metrics', 'years in business'],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  count_up: z.boolean().default(false),
  items: z
   .array(
    z.object({
     value: z.string().max(20).default('100'),
     label: z.string().max(80).default(''),
    }),
   )
   .max(4)
   .default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'count_up', label: 'Count up', widget: 'switch', help: 'The numbers climb to their value as they come into view. Anyone who has asked for less motion just sees the number.' },
  {
   key: 'items',
   label: 'Numbers',
   widget: 'items',
   itemLabel: 'label',
   max: 4,
   help: 'Two to four read best.',
   subfields: [
    { key: 'value', label: 'Number', widget: 'text', inline: true, placeholder: '12,000+' },
    { key: 'label', label: 'Label', widget: 'text', inline: true, placeholder: 'Jobs finished' },
   ],
  },
 ],
 defaults: {
  tagline: 'By the numbers',
  headline: 'A few good years',
  count_up: false,
  items: [
   { value: '12', label: 'Years on Main Street' },
   { value: '4,800+', label: 'Jobs finished' },
   { value: '4.9', label: 'Average rating' },
  ],
 },
 wys: { tagline: [], headline: [], 'items.*.value': [], 'items.*.label': [] },
});
