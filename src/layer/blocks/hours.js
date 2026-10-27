import { z } from 'zod';
import { defineBlock, headlineField, taglineField } from '../schema/define.js';

export default defineBlock({
 type: 'hours',
 label: 'Hours',
 description: 'When you are open',
 category: 'dynamic',
 icon: 'clock',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  address: z.string().max(300).default(''),
  items: z
   .array(z.object({ days: z.string().max(40).default(''), hours: z.string().max(60).default('') }))
   .max(14)
   .default([]),
  note: z.string().max(200).default(''),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'address', label: 'Address', widget: 'textarea', inline: true },
  {
   key: 'items',
   label: 'Days',
   widget: 'items',
   itemLabel: 'days',
   subfields: [
    { key: 'days', label: 'Days', widget: 'text', inline: true },
    { key: 'hours', label: 'Hours', widget: 'text', inline: true },
   ],
  },
  { key: 'note', label: 'Note', widget: 'text', inline: true, help: 'Holidays, closures.' },
 ],
 defaults: {
  tagline: 'Hours',
  headline: 'Come by',
  address: '123 Main Street',
  items: [
   { days: 'Mon – Fri', hours: '7:00 am – 6:00 pm' },
   { days: 'Sat – Sun', hours: '8:00 am – 4:00 pm' },
  ],
 },
 wys: { tagline: [], headline: ['italic'], note: [] },
});
