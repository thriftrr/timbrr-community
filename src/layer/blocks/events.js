import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

// The date is words as they should read ("Sat · Nov 14"), not a calendar
// date, so nothing here knows when an event is over: the list's help says
// to take events off once they're done.
export default defineBlock({
 type: 'events',
 label: 'Events',
 description: 'Upcoming, past ones hide',
 category: 'dynamic',
 icon: 'events',
 retired: true,
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  items: z
   .array(
    z.object({
     eyebrow: z.string().max(40).default(''),
     title: z.string().max(120).default(''),
     body: richTextSchema.default(richText('')),
     to: z.string().max(2000).default(''),
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
   label: 'Events',
   widget: 'items',
   itemLabel: 'title',
   max: 12,
   help: "Take an event off once it's over. It stays on the page until you do.",
   subfields: [
    { key: 'eyebrow', label: 'Date', widget: 'text', inline: true, placeholder: 'Sat · Nov 14' },
    { key: 'title', label: 'Title', widget: 'text', inline: true },
    { key: 'body', label: 'Details', widget: 'html', inline: true, placeholder: 'Time · price · spots' },
    { key: 'to', label: 'RSVP link', widget: 'text', link: true, help: 'Where the RSVP button goes. Leave it empty to hide the button.' },
   ],
  },
 ],
 defaults: {
  tagline: 'Upcoming',
  headline: 'On the calendar',
  items: [
   { eyebrow: 'Sat · Nov 14', title: 'Open house', body: richText('10:00 am – 2:00 pm · free · bring a friend'), to: '/contact' },
   { eyebrow: 'Thu · Nov 19', title: 'Beginner workshop', body: richText('6:00 pm · $25 · 12 spots'), to: '/contact' },
   { eyebrow: 'Sat · Dec 5', title: 'Holiday party', body: richText('5:00 pm · free · snacks on us'), to: '/contact' },
  ],
 },
 wys: {
  tagline: [],
  headline: [],
  'items.*.eyebrow': [],
  'items.*.title': [],
  'items.*.body': ['bold', 'italic'],
  'items.*.to': [],
 },
});
