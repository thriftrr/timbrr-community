import { z } from 'zod';
import { defineBlock, headlineField, imageSchema, richText, richTextSchema, taglineField } from '../schema/define.js';

export default defineBlock({
 type: 'story',
 label: 'Story',
 description: 'Image beside the about text',
 category: 'content',
 icon: 'story',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  body: richTextSchema.default(richText('')),
  note: z.string().max(120).default(''),
  layout: z.enum(['image_left', 'image_right']).default('image_left'),
  image: imageSchema.default({ src: '', alt: '' }),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'body', label: 'Body', widget: 'html', inline: true, ai: 'generate' },
  { key: 'note', label: 'Attribution', widget: 'text', inline: true, placeholder: '— Name, role' },
  {
   key: 'layout',
   label: 'Layout',
   widget: 'buttons',
   options: [
    { label: 'Image left', value: 'image_left' },
    { label: 'Image right', value: 'image_right' },
   ],
  },
  { key: 'image', label: 'Image', widget: 'image' },
 ],
 defaults: {
  tagline: 'Since 2019',
  headline: 'It started in a one-room shop.',
  body: richText(
   'We opened with two people, a few borrowed tools and a handful of neighbors who took a chance on us. The shop is bigger now and so is the team, and plenty of those first customers still come by every week.',
  ),
  note: '— Sam Rivera, owner',
  layout: 'image_left',
 },
 wys: { tagline: [], headline: [], body: ['bold', 'italic', 'link'], note: [] },
});
