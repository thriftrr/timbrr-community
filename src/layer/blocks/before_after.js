import { z } from 'zod';
import { defineBlock, headlineField, imageSchema, taglineField } from '../schema/define.js';

export default defineBlock({
 type: 'before_after',
 label: 'Before / after',
 description: 'Two images, drag slider',
 category: 'content',
 icon: 'before_after',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  before_image: imageSchema.default({ src: '', alt: '' }),
  before: z.string().max(40).default(''),
  after_image: imageSchema.default({ src: '', alt: '' }),
  after: z.string().max(40).default(''),
  caption: z.string().max(200).default(''),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'before_image', label: 'Before image', widget: 'image', help: 'Take both photos from the same spot, so they line up.' },
  { key: 'before', label: 'Before label', widget: 'text', inline: true, placeholder: 'Before' },
  { key: 'after_image', label: 'After image', widget: 'image' },
  { key: 'after', label: 'After label', widget: 'text', inline: true, placeholder: 'After' },
  { key: 'caption', label: 'Caption', widget: 'text', inline: true },
 ],
 defaults: {
  tagline: 'Recent work',
  headline: 'Same space, new look',
  before: 'Before',
  after: 'After',
  caption: 'One week, start to finish',
 },
 wys: { tagline: [], headline: [], before: [], after: [], caption: [] },
});
