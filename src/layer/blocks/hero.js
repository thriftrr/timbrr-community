import { z } from 'zod';
import { buttonSchema, buttonsField, defineBlock, headlineField, imageSchema, richText, richTextSchema, taglineField } from '../schema/define.js';

export default defineBlock({
 type: 'hero',
 label: 'Hero',
 description: 'The opening section: headline, buttons and a photo',
 category: 'common',
 icon: 'hero',
 keywords: ['banner', 'opener', 'intro', 'headline', 'full bleed'],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  description: richTextSchema.default(richText('')),
  layout: z.enum(['image_right', 'image_left', 'centered', 'bleed']).default('image_right'),
  image: imageSchema.default({ src: '', alt: '' }),
  buttons: z.array(buttonSchema).max(3).default([]),
  note: z.string().max(120).default(''),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'description', label: 'Description', widget: 'html', inline: true, ai: 'improve' },
  {
   key: 'layout',
   label: 'Layout',
   widget: 'buttons',
   options: [
    { label: 'Image right', value: 'image_right' },
    { label: 'Image left', value: 'image_left' },
    { label: 'Centered', value: 'centered' },
    { label: 'Full bleed', value: 'bleed' },
   ],
   help: 'Full bleed sets the words over a darkened photo, edge to edge.',
  },
  { key: 'image', label: 'Image', widget: 'image' },
  { ...buttonsField, max: 3 },
  { key: 'note', label: 'Note', widget: 'text', inline: true, help: 'Small print under the buttons.' },
 ],
 defaults: {
  tagline: 'Locally owned · Main Street',
  headline: 'Your neighborhood shop, open six days a week.',
  description: richText('Fair prices, friendly faces and the same good work every time. Call ahead, or just stop by and say hello.'),
  layout: 'image_right',
  buttons: [
   { label: 'Get in touch', to: '/contact', style: 'solid' },
   { label: 'Read our story', to: '/about', style: 'outline' },
  ],
  note: 'Walk-ins welcome · Free parking',
 },
 wys: { tagline: [], headline: [], description: ['bold', 'italic', 'link'], note: [], 'buttons.*.label': [] },
});
