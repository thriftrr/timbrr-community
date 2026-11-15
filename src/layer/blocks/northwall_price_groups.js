import { z } from 'zod';
import { defineBlock, headlineField, taglineField } from '../schema/define.js';

// A price list in groups that open and close: day passes, memberships,
// rentals. A group has a name and its own prices, so a price is added to
// the group it belongs under. A group with no name is always showing.
//
// `prices` is what the block held before groups were their own thing (each
// price named its group). It stays in the schema, unedited, so a page that
// still has it keeps saving and drawing until its prices are put in groups.
const price = z.object({
 name: z.string().max(60).default('New price'),
 price: z.string().max(30).default('$0'),
 period: z.string().max(30).default(''),
 detail: z.string().max(200).default(''),
});

export default defineBlock({
 type: 'northwall_price_groups',
 label: 'Grouped price list',
 description: 'Prices in groups that open and close',
 category: 'common',
 icon: 'pricing',
 owner: 'North Wall',
 keywords: ['pricing', 'price list', 'accordion', 'rates', 'passes', 'membership', 'rentals', 'groups'],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  opens: z.enum(['first', 'all']).default('first'),
  groups: z
   .array(z.object({ name: z.string().max(60).default('New group'), prices: z.array(price).max(40).default([]) }))
   .max(20)
   .default([]),
  prices: z
   .array(price.extend({ group: z.string().max(60).default('') }))
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
   key: 'groups',
   label: 'Groups',
   widget: 'items',
   itemLabel: 'name',
   max: 20,
   subfields: [
    { key: 'name', label: 'Group name', widget: 'text', inline: true, placeholder: 'Day passes', help: 'Leave it empty for prices that always show.' },
    {
     key: 'prices',
     label: 'Rows',
     widget: 'items',
     itemLabel: 'name',
     max: 40,
     subfields: [
      { key: 'name', label: 'Name', widget: 'text', inline: true },
      { key: 'price', label: 'Price', widget: 'text', inline: true, placeholder: '$40' },
      { key: 'period', label: 'Period', widget: 'text', inline: true, placeholder: '/month' },
      { key: 'detail', label: 'Detail', widget: 'text', inline: true, help: 'One line under the name. Leave it empty for none.' },
     ],
    },
   ],
  },
  { key: 'note', label: 'Note', widget: 'text', inline: true, help: 'Small print under the list. Leave it empty for none.' },
 ],
 defaults: {
  tagline: '',
  headline: 'Prices',
  opens: 'first',
  groups: [
   {
    name: 'Day passes',
    prices: [
     { name: 'Adults', price: '$17', period: '', detail: '' },
     { name: 'Kids', price: '$13', period: '', detail: '12 and under' },
    ],
   },
   {
    name: 'Rentals',
    prices: [
     { name: 'Shoes', price: '$6', period: '', detail: '' },
     { name: 'Harness', price: '$4', period: '', detail: '' },
    ],
   },
  ],
  note: '',
 },
 wys: {
  tagline: [],
  headline: [],
  note: [],
  'groups.*.name': [],
  'groups.*.prices.*.name': [],
  'groups.*.prices.*.price': [],
  'groups.*.prices.*.period': [],
  'groups.*.prices.*.detail': [],
  'prices.*.name': [],
  'prices.*.price': [],
  'prices.*.period': [],
  'prices.*.detail': [],
 },
});
