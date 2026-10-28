import { z } from 'zod';
import { defineBlock, headlineField, imageSchema, taglineField } from '../schema/define.js';

export default defineBlock({
 type: 'gallery',
 label: 'Gallery',
 description: 'Interior, food, finished jobs',
 category: 'content',
 icon: 'gallery',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  columns: z.enum(['2', '3', '4']).default('3'),
  items: z
   .array(
    z.object({
     image: imageSchema.default({ src: '', alt: '' }),
     caption: z.string().max(120).default(''),
    }),
   )
   .max(24)
   .default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  {
   key: 'columns',
   label: 'Columns',
   widget: 'buttons',
   options: [
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
   ],
  },
  {
   key: 'items',
   label: 'Images',
   widget: 'items',
   itemLabel: 'caption',
   max: 24,
   subfields: [
    { key: 'image', label: 'Image', widget: 'image' },
    { key: 'caption', label: 'Caption', widget: 'text', inline: true },
   ],
  },
 ],
 defaults: {
  tagline: 'Take a look',
  headline: 'Come see for yourself',
  columns: '3',
  items: [{ caption: 'Out front' }, { caption: 'Inside' }, { caption: 'Our work' }],
 },
 wys: { tagline: [], headline: [], 'items.*.caption': [] },
});
