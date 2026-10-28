import { z } from 'zod';
import { buttonSchema, buttonsField, defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

export default defineBlock({
 type: 'cta',
 label: 'CTA banner',
 description: 'Headline + one or two buttons',
 category: 'cta',
 icon: 'cta',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  body: richTextSchema.default(richText('')),
  buttons: z.array(buttonSchema).max(2).default([]),
  note: z.string().max(120).default(''),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'body', label: 'Body', widget: 'html', inline: true, ai: 'generate' },
  {
   ...buttonsField,
   max: 2,
  },
  { key: 'note', label: 'Note', widget: 'text', inline: true, help: 'Small print under the buttons.' },
 ],
 defaults: {
  tagline: 'Work with us',
  headline: "Let's talk about what you need.",
  body: richText("Big job or small, tell us a little about it and we'll get back to you with a plan and a fair price."),
  buttons: [{ label: 'Start a conversation', to: '/contact', style: 'solid' }],
  note: 'Replies within one business day',
 },
 wys: { tagline: [], headline: [], body: ['bold', 'italic', 'link'], note: [], 'buttons.*.label': [] },
});
