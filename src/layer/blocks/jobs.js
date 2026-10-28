import { z } from 'zod';
import { defineBlock, headlineField, taglineField } from '../schema/define.js';

// A new opening starts as Open, since that's why it's being added.
export default defineBlock({
 type: 'jobs',
 label: 'Job openings',
 description: 'Careers list, no page rebuild',
 category: 'dynamic',
 icon: 'jobs',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  items: z
   .array(
    z.object({
     title: z.string().max(120).default(''),
     body: z.string().max(200).default(''),
     eyebrow: z.string().max(30).default('Open'),
     to: z.string().max(2000).default(''),
    }),
   )
   .max(20)
   .default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  {
   key: 'items',
   label: 'Openings',
   widget: 'items',
   itemLabel: 'title',
   max: 20,
   subfields: [
    { key: 'title', label: 'Role', widget: 'text', inline: true },
    { key: 'body', label: 'Details', widget: 'text', inline: true, placeholder: 'Hours · pay · schedule' },
    { key: 'eyebrow', label: 'Status', widget: 'text', inline: true, placeholder: 'Open', help: 'A short tag beside the role, like Open or Filled.' },
    {
     key: 'to',
     label: 'Apply link',
     widget: 'text',
     link: true,
     help: 'Where Apply goes: an application page, a job board or an email address. Leave it empty to hide Apply.',
    },
   ],
  },
 ],
 defaults: {
  tagline: 'Work here',
  headline: "We're hiring",
  items: [
   { title: 'Front counter (part-time)', body: '20 hrs/wk · $17/hr · weekends', eyebrow: 'Open', to: '/contact' },
   { title: 'Shift lead', body: 'Full-time · $22/hr · Tue – Sat', eyebrow: 'Open', to: '/contact' },
  ],
 },
 wys: {
  tagline: [],
  headline: [],
  'items.*.title': [],
  'items.*.body': [],
  'items.*.eyebrow': [],
  'items.*.to': [],
 },
});
