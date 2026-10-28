import { z } from 'zod';
import { defineBlock, headlineField, imageSchema, richText, richTextSchema, taglineField } from '../schema/define.js';

// Posts are written here, not pulled from a feed: each is a card with a
// photo, a date, a title and a few lines, and can link to the full post.
export default defineBlock({
 type: 'news',
 label: 'News',
 description: 'Latest posts',
 category: 'dynamic',
 icon: 'news',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  items: z
   .array(
    z.object({
     eyebrow: z.string().max(40).default(''),
     title: z.string().max(160).default(''),
     body: richTextSchema.default(richText('')),
     image: imageSchema.default({ src: '', alt: '' }),
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
   label: 'Posts',
   widget: 'items',
   itemLabel: 'title',
   max: 12,
   subfields: [
    { key: 'eyebrow', label: 'Date', widget: 'text', inline: true, placeholder: 'Nov 2' },
    { key: 'title', label: 'Title', widget: 'text', inline: true },
    { key: 'body', label: 'Excerpt', widget: 'html', inline: true },
    { key: 'image', label: 'Image', widget: 'image' },
    { key: 'to', label: 'Links to', widget: 'text', link: true, help: 'The full post. With a link, the whole card opens it.' },
   ],
  },
 ],
 defaults: {
  tagline: 'News',
  headline: "What's new",
  items: [
   {
    eyebrow: 'Nov 2',
    title: 'Winter hours start Monday',
    body: richText('We open an hour later on weekdays through February. Weekend hours stay the same.'),
   },
   {
    eyebrow: 'Oct 19',
    title: 'New this season',
    body: richText('A few new favorites just came in. Stop by and see them before they sell out.'),
   },
   {
    eyebrow: 'Oct 5',
    title: 'Thanks for ten good years',
    body: richText('We opened our doors ten years ago this week. Thank you for every visit since.'),
   },
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
