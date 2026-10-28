import { z } from 'zod';
import { defineBlock, richText, richTextSchema } from '../schema/define.js';

export default defineBlock({
 type: 'grid',
 label: 'Grid',
 description: 'Card grid, set column count',
 category: 'layout',
 icon: 'grid',
 schema: z.object({
  columns: z.enum(['2', '3', '4']).default('3'),
  items: z
   .array(
    z.object({
     title: z.string().max(80).default(''),
     body: richTextSchema.default(richText('')),
    }),
   )
   .max(12)
   .default([]),
 }),
 fields: [
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
   label: 'Cards',
   widget: 'items',
   itemLabel: 'title',
   max: 12,
   subfields: [
    { key: 'title', label: 'Title', widget: 'text', inline: true },
    { key: 'body', label: 'Body', widget: 'html', inline: true },
   ],
  },
 ],
 defaults: {
  columns: '3',
  items: [
   { title: 'Locally owned', body: richText('Run by people who live nearby.') },
   { title: 'Fair prices', body: richText('Posted up front. No surprises.') },
   { title: 'Easy to reach', body: richText('A real person answers the phone.') },
  ],
 },
 wys: { 'items.*.title': [], 'items.*.body': ['bold', 'italic'] },
});
