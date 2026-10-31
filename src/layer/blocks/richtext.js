import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

export default defineBlock({
 type: 'richtext',
 label: 'Rich text',
 description: 'Formatted prose',
 category: 'content',
 icon: 'richtext',
 retired: true,
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  alignment: z.enum(['left', 'center']).default('left'),
  content: richTextSchema.default(richText('')),
 }),
 fields: [
  taglineField,
  headlineField,
  {
   key: 'alignment',
   label: 'Alignment',
   widget: 'buttons',
   options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
   ],
  },
  { key: 'content', label: 'Content', widget: 'html', inline: true, ai: 'write' },
 ],
 defaults: {
  tagline: 'Good to know',
  headline: 'A note on how we work',
  alignment: 'left',
  // One paragraph with a bold phrase, so a new block shows off what it can do.
  content: {
   type: 'doc',
   content: [
    {
     type: 'paragraph',
     content: [
      {
       type: 'text',
       text: "We're a small team, and we like it that way: you'll see the same faces every time you come in or call. Send us a question and you'll hear back ",
      },
      { type: 'text', text: 'within one business day', marks: [{ type: 'bold' }] },
      { type: 'text', text: ', usually much sooner.' },
     ],
    },
   ],
  },
 },
 wys: {
  tagline: [],
  headline: [],
  content: ['bold', 'italic', 'underline', 'link', 'h2', 'h3', 'ul', 'ol', 'clear'],
 },
});
