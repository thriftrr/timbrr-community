import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

// The map beside the areas is a drawing, not an embed: the page never loads
// a map script.
export default defineBlock({
 type: 'service_area',
 label: 'Service area',
 description: 'Neighborhoods served + map',
 category: 'common',
 icon: 'service_area',
 retired: true,
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  body: richTextSchema.default(richText('')),
  items: z
   .array(z.object({ title: z.string().max(60).default('Area') }))
   .max(24)
   .default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'body', label: 'Body', widget: 'html', inline: true, ai: 'generate' },
  {
   key: 'items',
   label: 'Areas',
   widget: 'items',
   itemLabel: 'title',
   max: 24,
   subfields: [{ key: 'title', label: 'Area', widget: 'text', inline: true, placeholder: 'Neighborhood or town' }],
  },
 ],
 defaults: {
  tagline: 'We come to you',
  headline: 'Where we work',
  body: richText('Free estimates and no trip charge anywhere in the areas below. Just outside the ring? Ask. We often make the trip anyway.'),
  items: [
   { title: 'Downtown' },
   { title: 'Midtown' },
   { title: 'Old Town' },
   { title: 'Riverside' },
   { title: 'North End' },
   { title: 'West Side' },
   { title: 'Lakeside' },
  ],
 },
 wys: { tagline: [], headline: [], body: ['bold', 'italic', 'link'], 'items.*.title': [] },
});
