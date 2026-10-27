import { z } from 'zod';
import { defineBlock, headlineField, taglineField } from '../schema/define.js';

export default defineBlock({
 type: 'faq',
 label: 'FAQ',
 description: 'Question / answer list',
 category: 'common',
 icon: 'circle-help',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  items: z
   .array(z.object({ question: z.string().max(200).default(''), answer: z.string().max(1200).default('') }))
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
   subfields: [
    { key: 'question', label: 'Question', widget: 'text', inline: true },
    { key: 'answer', label: 'Answer', widget: 'textarea', inline: true, ai: 'write' },
   ],
  },
 ],
 defaults: {
  tagline: 'Questions',
  headline: 'Good to know',
  items: [
   { question: 'Do I need an appointment?', answer: 'No. Walk in any time we are open.' },
   { question: 'Do you deliver?', answer: 'Yes, within ten miles, for orders over $30.' },
  ],
 },
 wys: { tagline: [], headline: ['italic'] },
});
