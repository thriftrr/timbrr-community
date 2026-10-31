import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

export default defineBlock({
 type: 'services',
 label: 'Services',
 description: 'Title, blurb, starting price',
 category: 'common',
 icon: 'services',
 retired: true,
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  items: z
   .array(
    z.object({
     title: z.string().max(80).default('New service'),
     body: richTextSchema.default(richText('')),
     price: z.string().max(40).default(''),
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
   label: 'Services',
   widget: 'items',
   itemLabel: 'title',
   max: 12,
   subfields: [
    { key: 'title', label: 'Service', widget: 'text', inline: true },
    { key: 'body', label: 'Blurb', widget: 'html', inline: true },
    { key: 'price', label: 'Starting price', widget: 'text', inline: true, placeholder: 'from $90', help: 'Leave it empty to show no price.' },
   ],
  },
 ],
 defaults: {
  tagline: 'What we do',
  headline: 'Services, and what they cost',
  items: [
   { title: 'Consultations', body: richText("Tell us what you need and we'll talk through the options."), price: 'Free' },
   { title: 'Full service', body: richText('Our most popular option, done start to finish.'), price: 'from $90' },
   { title: 'Same-day service', body: richText("Call before noon and we'll do our best to fit you in today."), price: 'from $140' },
   { title: 'By the hour', body: richText("For anything that doesn't fit a package. One-hour minimum."), price: '$60/hr' },
  ],
 },
 wys: { tagline: [], headline: [], 'items.*.title': [], 'items.*.body': ['bold', 'italic'], 'items.*.price': [] },
});
