import { z } from 'zod';
import { defineBlock, headlineField, imageSchema, richText, richTextSchema, taglineField } from '../schema/define.js';

// The people behind the business. Each person can have a booking link;
// the words on it are one field for the whole block, so every card says
// the same thing.
export default defineBlock({
 type: 'team',
 label: 'Team',
 description: 'Photo, role, book-with link',
 category: 'common',
 icon: 'team',
 retired: true,
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  items: z
   .array(
    z.object({
     title: z.string().max(80).default('Name'),
     eyebrow: z.string().max(60).default('Role'),
     body: richTextSchema.default(richText('')),
     image: imageSchema.default({ src: '', alt: '' }),
     to: z.string().max(2000).default(''),
    }),
   )
   .max(12)
   .default([]),
  link_label: z.string().max(40).default('Book with them'),
 }),
 fields: [
  taglineField,
  headlineField,
  {
   key: 'items',
   label: 'People',
   widget: 'items',
   itemLabel: 'title',
   max: 12,
   subfields: [
    { key: 'title', label: 'Name', widget: 'text', inline: true },
    { key: 'eyebrow', label: 'Role', widget: 'text', inline: true },
    { key: 'body', label: 'Bio', widget: 'html', inline: true },
    { key: 'image', label: 'Photo', widget: 'image', help: 'Shown in a circle, so a square photo works best. Until there is one, their initials stand in.' },
    { key: 'to', label: 'Booking link', widget: 'text', link: true, help: 'A booking page, or a phone or email link. Leave it empty for no link.' },
   ],
  },
  {
   key: 'link_label',
   label: 'Link text',
   widget: 'text',
   inline: true,
   placeholder: 'Book with them',
   help: 'Shown under everyone who has a booking link.',
  },
 ],
 defaults: {
  tagline: 'Our team',
  headline: "The people you'll meet",
  items: [
   { title: 'Alex Morgan', eyebrow: 'Owner', body: richText('Opened the doors in 2015. Still answers the phone most mornings.'), to: '/contact' },
   { title: 'Rosa Diaz', eyebrow: 'Manager', body: richText('Runs the day to day and knows where everything is.'), to: '/contact' },
   { title: 'Chris Patel', eyebrow: 'Front desk', body: richText('Your first call for bookings, quotes and questions.'), to: '/contact' },
  ],
  link_label: 'Book with them',
 },
 wys: {
  tagline: [],
  headline: [],
  'items.*.title': [],
  'items.*.eyebrow': [],
  'items.*.body': ['bold', 'italic'],
  link_label: [],
 },
});
