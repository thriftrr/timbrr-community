import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

export default defineBlock({
 type: 'faq',
 label: 'FAQ',
 description: 'Parking, deposits, warranties',
 category: 'common',
 icon: 'faq',
 keywords: ['questions', 'answers', 'help', 'accordion'],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  columns: z.enum(['1', '2']).default('1'),
  items: z
   .array(
    z.object({
     question: z.string().max(200).default('New question'),
     answer: richTextSchema.default(richText('')),
     topic: z.string().max(60).default(''),
    }),
   )
   .max(30)
   .default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  {
   key: 'columns',
   label: 'Columns',
   widget: 'buttons',
   options: [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
   ],
  },
  {
   key: 'items',
   label: 'Questions',
   widget: 'items',
   itemLabel: 'question',
   max: 30,
   subfields: [
    { key: 'question', label: 'Question', widget: 'text', inline: true },
    { key: 'answer', label: 'Answer', widget: 'html', inline: true },
    { key: 'topic', label: 'Topic', widget: 'text', placeholder: 'Billing', help: 'Questions with the same topic sit together under it. Leave it empty for none.' },
   ],
  },
 ],
 defaults: {
  tagline: 'Questions',
  headline: 'Good to know',
  columns: '1',
  items: [
   { question: 'Is there parking?', answer: richText('Yes. Free parking out front, and more on the street nearby.') },
   { question: 'How can I pay?', answer: richText('Card, cash or tap to pay. Whatever’s easiest for you.') },
  ],
 },
 wys: { tagline: [], headline: [], 'items.*.question': [], 'items.*.answer': ['bold', 'italic', 'link', 'ul'] },
});
