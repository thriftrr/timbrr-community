import { z } from 'zod';
import { defineBlock } from '../schema/define.js';
import { ENTRY_ICON_OPTIONS } from '../app/utils/entry-icons.js';

// An entry's facts and its button in one card, for the page an entry is shown
// on (a class, an event, a room): a price, rows of date, time, places and level,
// a button, a note. Every word can hold the entry's tokens ({price},
// {starts}, {Level}), which the studio fills as it serves the page
// (docs/collections.md, "Tokens"), so it works for any collection. A row marked
// "places left" is a number: "8 places left", and "Full" at 0, which also
// takes the button away. On a phone the card becomes a bar fixed to the
// bottom of the screen: the price, the places and the button; the rows stay
// in the page.
export default defineBlock({
 type: 'collection_summary',
 label: 'Entry summary',
 description: 'Price, date, places left and a button for an entry',
 category: 'dynamic',
 icon: 'collection_summary',
 inside: true,
 keywords: ['collections', 'entry', 'booking', 'book', 'price', 'summary', 'card', 'class', 'event', 'places', 'sticky'],
 schema: z.object({
  price: z.string().max(60).default(''),
  price_before: z.string().max(12).default(''),
  price_after: z.string().max(40).default(''),
  items: z
   .array(
    z.object({
     icon: z.enum(ENTRY_ICON_OPTIONS.map((one) => one.value)).default('calendar'),
     text: z.string().max(160).default(''),
     places: z.boolean().default(false),
    }),
   )
   .max(8)
   .default([]),
  button: z.string().max(60).default(''),
  button_to: z.string().max(2000).default(''),
  note: z.string().max(200).default(''),
  full_note: z.string().max(200).default(''),
  sticky: z.boolean().default(true),
 }),
 fields: [
  { key: 'price', label: 'Price', widget: 'text', inline: true, placeholder: '{price}', help: 'Type a field’s name in braces to bring in the entry’s own: {price}.' },
  { key: 'price_before', label: 'Before the price', widget: 'text', placeholder: '£' },
  { key: 'price_after', label: 'After the price', widget: 'text', placeholder: 'per person' },
  {
   key: 'items',
   label: 'Rows',
   widget: 'items',
   itemLabel: 'text',
   max: 8,
   subfields: [
    { key: 'text', label: 'Words', widget: 'text', inline: true, placeholder: '{starts}' },
    { key: 'icon', label: 'Icon', widget: 'icon', options: ENTRY_ICON_OPTIONS },
    { key: 'places', label: 'These are the places left', widget: 'switch', help: 'The words are a number: “8 places left”, or “Full” at 0.' },
   ],
  },
  { key: 'button', label: 'Button', widget: 'text', inline: true, placeholder: 'Book a place', help: 'Leave it empty for no button. A full entry has none.' },
  { key: 'button_to', label: 'Button goes to', widget: 'text', link: true, when: { button: { filled: true } }, placeholder: '/book or https://…' },
  { key: 'note', label: 'Small note', widget: 'text', inline: true, placeholder: 'Free to cancel up to 7 days before.' },
  { key: 'full_note', label: 'When it is full', widget: 'text', placeholder: 'This one is full.', help: 'Said above the rows when the places left are 0.' },
  { key: 'sticky', label: 'On a phone, keep the price and button at the bottom', widget: 'switch' },
 ],
 defaults: {
  price: '',
  price_before: '',
  price_after: '',
  items: [
   { icon: 'calendar', text: '', places: false },
   { icon: 'people', text: '', places: true },
  ],
  button: 'Book a place',
  button_to: '',
  note: '',
  full_note: '',
  sticky: true,
 },
 wys: { price: [], button: [], note: [], 'items.*.text': [] },
});
