import { z } from 'zod';
import { defineBlock } from '../schema/define.js';

// A band of short promises (years in business, licensed and insured, a
// guarantee): a few words each with a line under them. No heading of its
// own, so it can sit right under a hero.
export default defineBlock({
 type: 'trust_badges',
 label: 'Trust badges',
 description: 'Licensed, insured, years in',
 category: 'common',
 icon: 'trust_badges',
 schema: z.object({
  items: z
   .array(
    z.object({
     title: z.string().max(60).default(''),
     body: z.string().max(80).default(''),
    }),
   )
   .max(8)
   .default([]),
 }),
 fields: [
  {
   key: 'items',
   label: 'Badges',
   widget: 'items',
   itemLabel: 'title',
   max: 8,
   help: 'Short and specific works best: years in business, a license, a guarantee.',
   subfields: [
    { key: 'title', label: 'Badge', widget: 'text', inline: true, placeholder: 'Licensed & insured' },
    { key: 'body', label: 'Detail', widget: 'text', inline: true, placeholder: 'Covered on every job', help: 'One short line under the badge. Leave it empty for none.' },
   ],
  },
 ],
 defaults: {
  items: [
   { title: 'Since 2015', body: 'Family owned' },
   { title: 'Licensed & insured', body: 'Covered on every job' },
   { title: 'Upfront prices', body: 'No surprise fees' },
   { title: 'Satisfaction guaranteed', body: "Or we'll make it right" },
  ],
 },
 wys: { 'items.*.title': [], 'items.*.body': [] },
});
