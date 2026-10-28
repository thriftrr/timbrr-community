import { z } from 'zod';
import { defineBlock, imageSchema, taglineField } from '../schema/define.js';

// The brands a business sells, as a row of tiles: a brand's logo when it
// has one, its name when it doesn't.
export default defineBlock({
 type: 'brands_carried',
 label: 'Brands carried',
 description: 'Logo row for product lines',
 category: 'common',
 icon: 'brands_carried',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  items: z
   .array(
    z.object({
     title: z.string().max(60).default('Brand'),
     image: imageSchema.default({ src: '', alt: '' }),
    }),
   )
   .max(16)
   .default([]),
 }),
 fields: [
  taglineField,
  {
   key: 'items',
   label: 'Brands',
   widget: 'items',
   itemLabel: 'title',
   max: 16,
   subfields: [
    { key: 'title', label: 'Brand', widget: 'text', inline: true },
    { key: 'image', label: 'Logo', widget: 'image', help: "Optional. Without one, the brand's name shows instead." },
   ],
  },
 ],
 defaults: {
  tagline: 'Brands we sell & trust',
  items: [{ title: 'Oak & Iron' }, { title: 'Fieldstone' }, { title: 'Bright Co.' }, { title: 'Copper Hill' }, { title: 'Maple & Main' }, { title: 'Kettle Works' }],
 },
 wys: { tagline: [], 'items.*.title': [] },
});
