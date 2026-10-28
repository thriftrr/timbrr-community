import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

// Not live from Google: the rating, the count and the reviews are typed in
// the studio, so the page never waits on Google or changes on its own.
export default defineBlock({
 type: 'reviews',
 label: 'Reviews',
 description: 'Google rating + recent reviews',
 category: 'dynamic',
 icon: 'reviews',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  rating: z.string().max(20).default(''),
  count: z.string().max(40).default(''),
  items: z
   .array(
    z.object({
     quote: richTextSchema.default(richText('')),
     name: z.string().max(80).default(''),
     role: z.string().max(80).default('Google'),
    }),
   )
   .max(12)
   .default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'rating', label: 'Rating', widget: 'text', inline: true, placeholder: '4.8', help: 'Out of 5, as Google shows it. The stars fill to match.' },
  { key: 'count', label: 'Count', widget: 'text', inline: true, placeholder: '312 reviews' },
  {
   key: 'items',
   label: 'Reviews',
   widget: 'items',
   itemLabel: 'quote',
   max: 12,
   help: "These don't update from Google on their own. Copy in new ones now and then.",
   subfields: [
    { key: 'quote', label: 'Quote', widget: 'html', inline: true },
    { key: 'name', label: 'Name', widget: 'text', inline: true },
    { key: 'role', label: 'Source', widget: 'text', inline: true, placeholder: 'Google · 2 weeks ago' },
   ],
  },
 ],
 defaults: {
  tagline: 'Google reviews',
  headline: 'What the neighborhood says',
  rating: '4.8',
  count: '312 reviews',
  items: [
   {
    quote: richText('Friendly from the first hello. They knew my name by my second visit.'),
    name: 'Chris L.',
    role: 'Google · 2 weeks ago',
   },
   {
    quote: richText('We use them for our office now. Reliable every single week, and the price never creeps up.'),
    name: 'Taylor B.',
    role: 'Google · 1 month ago',
   },
   {
    quote: richText('Brought my parents along once. Now they’re regulars, and they live an hour away.'),
    name: 'Morgan W.',
    role: 'Google · 2 months ago',
   },
  ],
 },
 wys: {
  tagline: [],
  headline: [],
  rating: [],
  count: [],
  'items.*.quote': ['italic'],
  'items.*.name': [],
  'items.*.role': [],
 },
});
