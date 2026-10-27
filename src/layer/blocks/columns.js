import { z } from 'zod';
import { defineBlock, headlineField, taglineField } from '../schema/define.js';

export default defineBlock({
 type: 'columns',
 label: 'Columns',
 description: '2–4 feature cards',
 category: 'layout',
 icon: 'columns-3',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  intro: z.string().max(400).default(''),
  items: z
   .array(
    z.object({
     eyebrow: z.string().max(40).default(''),
     title: z.string().max(80).default(''),
     body: z.string().max(400).default(''),
    }),
   )
   .max(4)
   .default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'intro', label: 'Intro', widget: 'textarea', inline: true },
  {
   key: 'items',
   label: 'Cards',
   widget: 'items',
   itemLabel: 'title',
   max: 4,
   subfields: [
    { key: 'eyebrow', label: 'Eyebrow', widget: 'text', inline: true },
    { key: 'title', label: 'Title', widget: 'text', inline: true },
    { key: 'body', label: 'Body', widget: 'textarea', inline: true },
   ],
  },
 ],
 defaults: {
  tagline: 'How it works',
  headline: 'Three things to know',
  items: [
   { eyebrow: '1', title: 'First', body: 'What happens first, in a sentence or two.' },
   { eyebrow: '2', title: 'Then', body: 'What comes next, and how long it takes.' },
   { eyebrow: '3', title: 'Finally', body: 'Where they end up, and what it costs.' },
  ],
 },
 wys: { tagline: [], headline: ['italic'], intro: ['bold', 'italic'] },
});
