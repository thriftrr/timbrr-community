import { z } from 'zod';
import { buttonSchema, buttonsField, defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

// A price that changes with how many it's for and which extras are ticked:
// a membership for 1 to 6 climbers, with gear rental or without. The sum is
// calculatorTotal (app/utils/blocks.js). Prices are typed as words, like a
// Pricing tier's, and read for the number in them, so "$59" and "59" both
// work and a typo shows as 0 rather than refusing the save. Nothing is
// charged here: the button goes wherever signing up happens.
const price = z.string().max(12).default('0');

export default defineBlock({
 type: 'northwall_calculator',
 label: 'Price calculator',
 description: 'A price that adds up as visitors pick how many and which extras',
 category: 'common',
 icon: 'calculator',
 owner: 'North Wall',
 keywords: ['pricing', 'estimate', 'quote', 'membership', 'per person', 'add-ons', 'total'],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  body: richTextSchema.default(richText('')),
  unit: z.string().max(40).default('People'),
  most: z.enum(['2', '4', '6', '8', '10']).default('6'),
  price,
  extra: price,
  addons: z
   .array(
    z.object({
     label: z.string().max(60).default('New extra'),
     price,
     per: z.enum(['each', 'once']).default('each'),
    }),
   )
   .max(4)
   .default([]),
  currency: z.string().max(3).default('$'),
  period: z.string().max(30).default(''),
  note: z.string().max(300).default(''),
  buttons: z.array(buttonSchema).max(1).default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'body', label: 'Body', widget: 'html', inline: true, ai: 'generate' },
  { key: 'unit', label: 'Counting', widget: 'text', inline: true, placeholder: 'Climbers', help: 'What the number counts: people, climbers, seats.' },
  {
   key: 'most',
   label: 'Up to',
   widget: 'buttons',
   options: [
    { label: '2', value: '2' },
    { label: '4', value: '4' },
    { label: '6', value: '6' },
    { label: '8', value: '8' },
    { label: '10', value: '10' },
   ],
  },
  { key: 'price', label: 'Price for one', widget: 'text', placeholder: '59' },
  { key: 'extra', label: 'Each one after that', widget: 'text', placeholder: '15' },
  {
   key: 'addons',
   label: 'Extras',
   widget: 'items',
   itemLabel: 'label',
   max: 4,
   subfields: [
    { key: 'label', label: 'Name', widget: 'text', inline: true },
    { key: 'price', label: 'Price', widget: 'text', placeholder: '15' },
    {
     key: 'per',
     label: 'Charged',
     widget: 'buttons',
     options: [
      { label: 'For each', value: 'each' },
      { label: 'Once', value: 'once' },
     ],
    },
   ],
  },
  { key: 'currency', label: 'Currency sign', widget: 'text', placeholder: '$' },
  { key: 'period', label: 'Period', widget: 'text', inline: true, placeholder: 'per month' },
  { key: 'note', label: 'Note', widget: 'text', inline: true, help: 'Small print under the price. Leave it empty for none.' },
  { ...buttonsField, label: 'Button', max: 1 },
 ],
 defaults: {
  tagline: '',
  headline: 'Work out your price',
  body: richText('Pick how many of you there are and what you need. The price updates as you go.'),
  unit: 'People',
  most: '6',
  price: '59',
  extra: '15',
  addons: [{ label: 'Add gear rental', price: '15', per: 'each' }],
  currency: '$',
  period: 'per month',
  note: '',
  buttons: [{ label: 'Sign up', to: '/contact', style: 'solid' }],
 },
 wys: { tagline: [], headline: [], body: ['bold', 'italic', 'link'], unit: [], period: [], note: [], 'addons.*.label': [], 'buttons.*.label': [] },
});
