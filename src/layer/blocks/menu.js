import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

export default defineBlock({
 type: 'menu',
 label: 'Menu',
 description: 'Items with price + dietary tags',
 category: 'common',
 icon: 'menu',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  items: z
   .array(
    z.object({
     title: z.string().max(80).default('New item'),
     price: z.string().max(30).default('$0'),
     body: richTextSchema.default(richText('')),
     eyebrow: z.string().max(80).default(''),
    }),
   )
   .max(40)
   .default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  {
   key: 'items',
   label: 'Items',
   widget: 'items',
   itemLabel: 'title',
   max: 40,
   subfields: [
    { key: 'title', label: 'Item', widget: 'text', inline: true },
    { key: 'price', label: 'Price', widget: 'text', inline: true, placeholder: '$4.50' },
    { key: 'body', label: 'Description', widget: 'html', inline: true },
    {
     key: 'eyebrow',
     label: 'Section · tags',
     widget: 'text',
     inline: true,
     placeholder: 'Lunch · vegan',
     help: 'The part of the menu it belongs to, then any dietary tags. Shows in small print under the item.',
    },
   ],
  },
 ],
 defaults: {
  tagline: 'Menu',
  headline: 'Eat in or take it to go',
  items: [
   { title: 'Latte', price: '$4.75', body: richText('Double shot, steamed milk'), eyebrow: 'Coffee · oat +.75' },
   { title: 'Drip coffee', price: '$3', body: richText('Free refills while you stay'), eyebrow: 'Coffee' },
   { title: 'Breakfast sandwich', price: '$8', body: richText('Egg, cheddar and greens on a toasted roll'), eyebrow: 'Breakfast · v' },
   { title: 'Soup of the day', price: '$6', body: richText("Made here every morning. Ask what's on."), eyebrow: 'Lunch · gf' },
   { title: 'Cinnamon roll', price: '$4', body: richText('Out of the oven at 7'), eyebrow: 'Bakery · v' },
   { title: 'Cookie', price: '$2.50', body: richText('Chocolate chunk, sea salt'), eyebrow: 'Bakery · v' },
  ],
 },
 wys: {
  tagline: [],
  headline: [],
  'items.*.title': [],
  'items.*.price': [],
  'items.*.body': ['bold', 'italic'],
  'items.*.eyebrow': [],
 },
});
