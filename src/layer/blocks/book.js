import { z } from 'zod';
import { buttonSchema, buttonsField, defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

// Booking happens wherever the buttons go (the site's booking page, or a
// service like Square or Calendly); nothing is embedded. The calendar
// beside the words is a picture of the next four weeks that opens the
// first button's link.
export default defineBlock({
 type: 'book',
 label: 'Book',
 description: 'Appointment / reservation',
 category: 'cta',
 icon: 'book',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  body: richTextSchema.default(richText('')),
  provider: z.string().max(80).default(''),
  buttons: z.array(buttonSchema).max(2).default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'body', label: 'Body', widget: 'html', inline: true, ai: 'generate' },
  {
   key: 'provider',
   label: 'Provider',
   widget: 'text',
   inline: true,
   placeholder: 'Booked through Square',
   help: 'Small print beside the button: who takes the booking, or how it works.',
  },
  {
   ...buttonsField,
   max: 2,
   help: "The calendar opens the first button's link too.",
  },
 ],
 defaults: {
  tagline: 'Appointments',
  headline: 'Book a time that works for you',
  body: richText('Pick a day and a time online in about a minute. Same-day is fine when we have room.'),
  provider: 'Secure online booking',
  buttons: [{ label: 'Book now', to: '/book', style: 'solid' }],
 },
 wys: { tagline: [], headline: [], body: ['bold', 'italic', 'link'], provider: [], 'buttons.*.label': [] },
});
