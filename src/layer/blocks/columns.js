import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

export default defineBlock({
 type: 'columns',
 label: 'Columns',
 description: '2–4 feature cards',
 category: 'layout',
 icon: 'columns',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  intro: richTextSchema.default(richText('')),
  style: z.enum(['plain', 'steps', 'links']).default('steps'),
  items: z
   .array(
    z.object({
     title: z.string().max(80).default('New item'),
     eyebrow: z.string().max(40).default(''),
     body: richTextSchema.default(richText('')),
     to: z.string().max(2000).default(''),
    }),
   )
   .max(4)
   .default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'intro', label: 'Intro', widget: 'html', inline: true, ai: 'write' },
  {
   key: 'style',
   label: 'Style',
   widget: 'buttons',
   options: [
    { label: 'Plain', value: 'plain' },
    { label: 'Steps', value: 'steps' },
    { label: 'Links', value: 'links' },
   ],
  },
  {
   key: 'items',
   label: 'Items',
   widget: 'items',
   itemLabel: 'title',
   max: 4,
   subfields: [
    { key: 'title', label: 'Title', widget: 'text', inline: true },
    { key: 'eyebrow', label: 'Eyebrow', widget: 'text', inline: true, help: 'With Steps it fills the badge; leave it empty for the step number.' },
    { key: 'body', label: 'Body', widget: 'html', inline: true },
    { key: 'to', label: 'Links to', widget: 'text', link: true, placeholder: '/services or https://…', help: 'Used when the style is Links.' },
   ],
  },
 ],
 defaults: {
  tagline: 'How it works',
  headline: 'Three simple steps',
  style: 'steps',
  items: [
   { eyebrow: '1', title: 'Get in touch', body: richText('Call, write or stop by and tell us what you need.') },
   { eyebrow: '2', title: 'Get a price', body: richText('A clear price up front, before anything starts.') },
   { eyebrow: '3', title: 'Done right', body: richText('We do what we said, when we said we would.') },
  ],
 },
 wys: {
  tagline: [],
  headline: [],
  intro: ['bold', 'italic'],
  'items.*.title': [],
  'items.*.eyebrow': [],
  'items.*.body': ['bold', 'italic', 'link'],
  'items.*.to': [],
 },
});
