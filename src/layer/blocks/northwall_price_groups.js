import { z } from 'zod';
import { defineBlock, headlineField, taglineField } from '../schema/define.js';

// A price list whose prices sit under group names that open and close:
// punch passes, memberships, rentals. A group heads several prices, so it's
// set on each one in the inspector, as an FAQ's topic is; prices with no
// group come first and are always showing.
export default defineBlock({
 type: 'northwall_price_groups',
 label: 'Folding price list',
 description: 'Prices in groups that open and close',
 category: 'common',
 icon: 'pricing',
 owner: 'North Wall',
 keywords: ['pricing', 'price list', 'accordion', 'rates', 'passes', 'membership', 'rentals'],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  opens: z.enum(['first', 'all']).default('first'),
  prices: z
   .array(
    z.object({
     group: z.string().max(60).default(''),
     name: z.string().max(60).default('New price'),
     price: z.string().max(30).default('$0'),
     period: z.string().max(30).default(''),
     detail: z.string().max(200).default(''),
    }),
   )
   .max(40)
   .default([]),
  note: z.string().max(300).default(''),
 }),
 fields: [
  taglineField,
  headlineField,
  {
   key: 'opens',
   label: 'To begin with',
   widget: 'buttons',
   options: [
    { label: 'First group open', value: 'first' },
    { label: 'All open', value: 'all' },
   ],
   help: 'With the first open, opening another closes it.',
  },
  {
   key: 'prices',
   label: 'Prices',
   widget: 'items',
   itemLabel: 'name',
   max: 40,
   subfields: [
    { key: 'group', label: 'Group', widget: 'text', placeholder: 'Punch pass', help: 'Prices with the same group fold away together under it.' },
    { key: 'name', label: 'Name', widget: 'text', inline: true },
    { key: 'price', label: 'Price', widget: 'text', inline: true, placeholder: '$40' },
    { key: 'period', label: 'Period', widget: 'text', inline: true, placeholder: '/month' },
    { key: 'detail', label: 'Detail', widget: 'text', inline: true, help: 'One line under the name. Leave it empty for none.' },
   ],
  },
  { key: 'note', label: 'Note', widget: 'text', inline: true, help: 'Small print under the list. Leave it empty for none.' },
 ],
 defaults: {
  tagline: '',
  headline: 'Prices',
  opens: 'first',
  prices: [
   { group: 'Day passes', name: 'Adults', price: '$17', period: '', detail: '' },
   { group: 'Day passes', name: 'Kids', price: '$13', period: '', detail: '12 and under' },
   { group: 'Rentals', name: 'Shoes', price: '$6', period: '', detail: '' },
   { group: 'Rentals', name: 'Harness', price: '$4', period: '', detail: '' },
  ],
  note: '',
 },
 wys: { tagline: [], headline: [], note: [], 'prices.*.name': [], 'prices.*.price': [], 'prices.*.period': [], 'prices.*.detail': [] },
});
