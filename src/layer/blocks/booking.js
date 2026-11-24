import { z } from 'zod';
import { defineBlock, headlineField } from '../schema/define.js';

// Book a time on the site itself (the studio's docs/bookings.md): pick what,
// then a day and a free time, then a name and email. Only free times show,
// and the studio takes a time in one statement, so two people never get the
// same one. `mode` reserve is the table page: party size, day, time. It
// needs the Bookings add-on; without it the live site draws nothing.
export default defineBlock({
 type: 'booking',
 label: 'Book a time',
 description: 'Appointments, classes or a table, booked right here',
 category: 'cta',
 icon: 'booking',
 keywords: ['book', 'booking', 'appointment', 'class', 'reservation', 'reserve', 'table', 'schedule', 'calendar'],
 schema: z.object({
  headline: z.string().max(120).default(''),
  body: z.string().max(400).default(''),
  mode: z.enum(['book', 'reserve']).default('book'),
  label: z.string().max(40).default(''),
 }),
 fields: [
  headlineField,
  { key: 'body', label: 'Words', widget: 'textarea', inline: true, ai: 'generate' },
  {
   key: 'mode',
   label: 'Offers',
   widget: 'select',
   options: [
    { label: 'Services and classes', value: 'book' },
    { label: 'Tables', value: 'reserve' },
   ],
   help: 'What visitors can book here. Set them up in Bookings.',
  },
  { key: 'label', label: 'Button', widget: 'text', inline: true, placeholder: 'Book it' },
 ],
 defaults: {
  headline: 'Book a visit',
  body: 'Pick what you would like. You will choose a time next.',
  mode: 'book',
  label: 'Book it',
 },
 presets: [{ key: 'reserve', label: 'Reserve a table', description: 'Party size, day and time', data: { headline: 'Reserve a table', body: 'Pick your party size, a day and a time.', mode: 'reserve', label: 'Reserve' } }],
 wys: { headline: [], body: [], label: [] },
});
