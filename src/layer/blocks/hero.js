import { z } from 'zod';
import { buttonSchema, buttonsField, defineBlock, headlineField, imageSchema, richText, richTextSchema, taglineField } from '../schema/define.js';

export default defineBlock({
 type: 'hero',
 label: 'Hero',
 description: 'Headline + image opener',
 category: 'common',
 icon: 'panel-top',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  description: richTextSchema.default(richText('')),
  layout: z.enum(['image_right', 'image_left', 'centered']).default('image_right'),
  image: imageSchema.default({ src: '', alt: '' }),
  buttons: z.array(buttonSchema).max(3).default([]),
  note: z.string().max(120).default(''),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'description', label: 'Description', widget: 'html', ai: 'improve' },
  {
   key: 'layout',
   label: 'Layout',
   widget: 'buttons',
   options: [
    { label: 'Image right', value: 'image_right' },
    { label: 'Image left', value: 'image_left' },
    { label: 'Centered', value: 'centered' },
   ],
  },
  { key: 'image', label: 'Image', widget: 'image' },
  buttonsField,
  { key: 'note', label: 'Note', widget: 'text', inline: true, help: 'Small print under the buttons.' },
 ],
 defaults: {
  tagline: 'Small-batch · Since 2014',
  headline: 'A headline that says what you do.',
  description: richText('One or two sentences on who it is for and why it matters. Say it plainly.'),
  buttons: [
   { label: 'Get started', to: '/contact', style: 'solid' },
   { label: 'Learn more', to: '/about', style: 'outline' },
  ],
 },
 wys: { tagline: [], headline: ['italic'], description: ['bold', 'italic', 'link'], note: [] },
});
