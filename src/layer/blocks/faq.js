import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

export default defineBlock({
 type: 'faq',
 label: 'FAQ',
 description: 'Parking, deposits, warranties',
 category: 'common',
 icon: 'faq',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  items: z
   .array(
    z.object({
     question: z.string().max(200).default('New question'),
     answer: richTextSchema.default(richText('')),
    }),
   )
   .max(30)
   .default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  {
   key: 'items',
   label: 'Questions',
   widget: 'items',
   itemLabel: 'question',
   max: 30,
   subfields: [
    { key: 'question', label: 'Question', widget: 'text', inline: true },
    { key: 'answer', label: 'Answer', widget: 'html', inline: true },
   ],
  },
 ],
 defaults: {
  tagline: 'Questions',
  headline: 'Good to know',
  items: [
   { question: 'Is there parking?', answer: richText('Yes. Free parking out front, and more on the street nearby.') },
   { question: 'How can I pay?', answer: richText('Card, cash or tap to pay. Whatever’s easiest for you.') },
  ],
 },
 wys: { tagline: [], headline: [], 'items.*.question': [], 'items.*.answer': ['bold', 'italic', 'link', 'ul'] },
});
