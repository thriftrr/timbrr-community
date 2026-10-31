import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

// Each tier carries its own button (`label` + `to`), so TbButton draws it
// straight from the tier: <TbButton :field="'tiers.' + i" />. A price list
// holds the same rows, set one to a line, and leaves the buttons out. Which
// tier stands out is one choice on the block, not a switch on each tier, so
// there's only ever the one.
export default defineBlock({
 type: 'pricing',
 label: 'Pricing',
 description: 'Plans, passes or a simple price list',
 category: 'common',
 icon: 'pricing',
 keywords: ['plans', 'prices', 'price list', 'rates', 'passes', 'membership', 'menu'],
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  layout: z.enum(['plans', 'list']).default('plans'),
  highlight: z.enum(['none', '1', '2', '3', '4']).default('none'),
  highlight_label: z.string().max(40).default(''),
  tiers: z
   .array(
    z.object({
     name: z.string().max(60).default('New tier'),
     price: z.string().max(30).default('$0'),
     period: z.string().max(30).default(''),
     features: richTextSchema.default(richText('')),
     label: z.string().max(60).default('Sign up'),
     to: z.string().max(2000).default('/contact'),
    }),
   )
   .max(24)
   .default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  {
   key: 'layout',
   label: 'Layout',
   widget: 'buttons',
   options: [
    { label: 'Plans', value: 'plans' },
    { label: 'Price list', value: 'list' },
   ],
   help: 'A price list is one line per item, with no buttons.',
  },
  {
   key: 'highlight',
   label: 'Highlight',
   widget: 'buttons',
   options: [
    { label: 'None', value: 'none' },
    { label: '1st', value: '1' },
    { label: '2nd', value: '2' },
    { label: '3rd', value: '3' },
    { label: '4th', value: '4' },
   ],
  },
  { key: 'highlight_label', label: 'Highlight tag', widget: 'text', inline: true, placeholder: 'Most popular', help: 'A small tag on the highlighted one. Leave it empty for none.' },
  {
   key: 'tiers',
   label: 'Tiers',
   widget: 'items',
   itemLabel: 'name',
   max: 24,
   subfields: [
    { key: 'name', label: 'Name', widget: 'text', inline: true },
    { key: 'price', label: 'Price', widget: 'text', inline: true, placeholder: '$40' },
    { key: 'period', label: 'Period', widget: 'text', inline: true, placeholder: '/month' },
    { key: 'features', label: 'Features', widget: 'html', inline: true },
    { key: 'label', label: 'Button', widget: 'text', inline: true, help: 'Leave it empty for no button.' },
    { key: 'to', label: 'Links to', widget: 'text', link: true, placeholder: '/contact or https://…' },
   ],
  },
 ],
 defaults: {
  tagline: 'Plans',
  headline: 'Regular visits cost less',
  layout: 'plans',
  highlight: 'none',
  highlight_label: 'Most popular',
  tiers: [
   {
    name: 'Every 2 weeks',
    price: '$60',
    period: '/visit',
    features: richText('One-hour visit · cancel anytime'),
    label: 'Sign up',
    to: '/contact',
   },
   {
    name: 'Weekly',
    price: '$50',
    period: '/visit',
    features: richText('One-hour visit · cancel anytime · first pick of times'),
    label: 'Sign up',
    to: '/contact',
   },
  ],
 },
 wys: {
  tagline: [],
  headline: [],
  highlight_label: [],
  'tiers.*.name': [],
  'tiers.*.price': [],
  'tiers.*.period': [],
  'tiers.*.features': ['bold'],
  'tiers.*.label': [],
  'tiers.*.to': [],
 },
});
