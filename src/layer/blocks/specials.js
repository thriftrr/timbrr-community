import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

// Deals as cards, each with a tag saying when it ends. The tag is words as
// they should read ("Ends Sunday", "Ongoing"), not a calendar date, so
// nothing here knows when a deal is over: the list's help says to take
// deals off once they end.
export default defineBlock({
 type: 'specials',
 label: 'Specials',
 description: 'Deals that expire themselves',
 category: 'cta',
 icon: 'specials',
 advanced: true,
 keywords: ['special', 'deals', 'offers', 'discount', 'promotion'],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  items: z
   .array(
    z.object({
     title: z.string().max(80).default(''),
     body: richTextSchema.default(richText('')),
     eyebrow: z.string().max(40).default(''),
    }),
   )
   .max(9)
   .default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  {
   key: 'items',
   label: 'Deals',
   widget: 'items',
   itemLabel: 'title',
   max: 9,
   help: "Take a deal off once it ends. The tag says when; it doesn't take the deal down by itself.",
   subfields: [
    { key: 'title', label: 'Deal', widget: 'text', inline: true, placeholder: 'First-visit discount' },
    { key: 'body', label: 'Details', widget: 'html', inline: true, placeholder: 'What you get, and when' },
    { key: 'eyebrow', label: 'Ends', widget: 'text', inline: true, placeholder: 'Ends Sunday', help: 'Shown in the tag at the top of the card. Leave it empty for no tag.' },
   ],
  },
 ],
 defaults: {
  tagline: 'Right now',
  headline: 'Specials',
  items: [
   { title: 'Weekday mornings', body: richText('15% off before 11 am, Monday to Thursday.'), eyebrow: 'This month only' },
   { title: 'First-visit discount', body: richText('Mention the website and take $10 off.'), eyebrow: 'Ongoing' },
   { title: 'Bring a friend', body: richText("Come in together and the second one's half off."), eyebrow: 'Ends Sunday' },
  ],
 },
 wys: {
  tagline: [],
  headline: [],
  'items.*.title': [],
  'items.*.body': ['bold', 'italic'],
  'items.*.eyebrow': [],
 },
});
