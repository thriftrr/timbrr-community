import { z } from 'zod';
import { defineBlock, headlineField, imageSchema, taglineField } from '../schema/define.js';

// Customers, sponsors, partners, brands carried: a logo when there is one,
// the name when there isn't. A `tier` on a row groups it under that heading,
// for sponsors by level. A scrolling strip has no room for headings, so it
// draws every row in one line.
export default defineBlock({
 type: 'logos',
 label: 'Logos',
 description: 'Customers, sponsors, brands carried',
 category: 'common',
 icon: 'logos',
 keywords: ['brands', 'sponsors', 'partners', 'customers', 'clients', 'press'],
 presets: [
  {
   key: 'brands_carried',
   label: 'Brands carried',
   description: 'The product lines you sell',
   data: {
    tagline: 'Brands we sell & trust',
    items: [{ title: 'Oak & Iron' }, { title: 'Fieldstone' }, { title: 'Bright Co.' }, { title: 'Copper Hill' }, { title: 'Maple & Main' }, { title: 'Kettle Works' }],
   },
  },
 ],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  layout: z.enum(['row', 'wall']).default('row'),
  scrolling: z.boolean().default(false),
  items: z
   .array(
    z.object({
     title: z.string().max(60).default('Brand'),
     image: imageSchema.default({ src: '', alt: '' }),
     tier: z.string().max(40).default(''),
     to: z.string().max(2000).default(''),
    }),
   )
   .max(32)
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
    { label: 'Row', value: 'row' },
    { label: 'Wall', value: 'wall' },
   ],
  },
  { key: 'scrolling', label: 'Keep scrolling', widget: 'switch', help: 'One strip that moves slowly sideways. It stands still for anyone who has asked for less motion.' },
  {
   key: 'items',
   label: 'Logos',
   widget: 'items',
   itemLabel: 'title',
   max: 32,
   subfields: [
    { key: 'title', label: 'Name', widget: 'text', inline: true },
    { key: 'image', label: 'Logo', widget: 'image', help: "Optional. Without one, the name shows instead." },
    { key: 'tier', label: 'Tier', widget: 'text', placeholder: 'Gold sponsors', help: 'Logos with the same tier sit together under it. Leave it empty for none.' },
    { key: 'to', label: 'Links to', widget: 'text', link: true, placeholder: 'https://…' },
   ],
  },
 ],
 defaults: {
  tagline: 'Proud to work with',
  layout: 'row',
  scrolling: false,
  items: [{ title: 'Riverside Co-op' }, { title: 'Main St. Bakery' }, { title: 'Hillcrest School' }, { title: 'North End Hardware' }, { title: 'Lakeside Clinic' }, { title: 'Parkway Inn' }],
 },
 wys: { tagline: [], headline: [], 'items.*.title': [] },
});
