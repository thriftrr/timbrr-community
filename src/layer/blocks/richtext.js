import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

export default defineBlock({
 type: 'richtext',
 label: 'Rich text',
 description: 'Formatted prose',
 category: 'content',
 icon: 'text',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  content: richTextSchema.default(richText('')),
 }),
 fields: [taglineField, headlineField, { key: 'content', label: 'Text', widget: 'html', ai: 'write' }],
 defaults: {
  headline: 'A few words about this',
  content: richText(
   'Write the way you would explain it across the counter: short sentences, one idea at a time.',
   'Say the price. Say what happens next. Leave out what nobody asked.',
  ),
 },
 wys: {
  tagline: [],
  headline: ['italic'],
  content: ['bold', 'italic', 'underline', 'link', 'h2', 'h3', 'ul', 'ol', 'clear'],
 },
});
