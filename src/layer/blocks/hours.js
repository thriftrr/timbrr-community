import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

// The days and times are typed in, and so is the status line by the dot:
// it says the same thing at every hour, so its help asks for something
// that's always true.
export default defineBlock({
 type: 'hours',
 label: 'Hours',
 description: 'From settings, open-now indicator',
 category: 'dynamic',
 icon: 'hours',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  status: z.string().max(80).default(''),
  items: z
   .array(
    z.object({
     title: z.string().max(40).default(''),
     body: z.string().max(60).default(''),
    }),
   )
   .max(10)
   .default([]),
  note: richTextSchema.default(richText('')),
 }),
 fields: [
  taglineField,
  headlineField,
  {
   key: 'status',
   label: 'Open-now line',
   widget: 'text',
   inline: true,
   placeholder: 'Open seven days a week',
   help: "Shown by the dot under the headline. It doesn't change through the day, so keep it to something that's always true.",
  },
  {
   key: 'items',
   label: 'Days',
   widget: 'items',
   itemLabel: 'title',
   max: 10,
   subfields: [
    { key: 'title', label: 'Days', widget: 'text', inline: true, placeholder: 'Mon – Fri' },
    { key: 'body', label: 'Hours', widget: 'text', inline: true, placeholder: '9:00 am – 5:00 pm' },
   ],
  },
  { key: 'note', label: 'Holiday note', widget: 'html', inline: true },
 ],
 defaults: {
  tagline: 'Hours',
  headline: 'Come by',
  status: 'Open seven days a week',
  items: [
   { title: 'Mon – Fri', body: '8:00 am – 6:00 pm' },
   { title: 'Saturday', body: '9:00 am – 5:00 pm' },
   { title: 'Sunday', body: '10:00 am – 4:00 pm' },
  ],
  note: richText('Closed Thanksgiving & Dec 25. Holiday hours posted a week ahead.'),
 },
 wys: {
  tagline: [],
  headline: [],
  status: [],
  'items.*.title': [],
  'items.*.body': [],
  note: ['italic'],
 },
});
