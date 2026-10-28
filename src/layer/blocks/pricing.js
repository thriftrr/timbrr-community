import { z } from 'zod';
import { defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

// Each tier carries its own button (`label` + `to`), so TbButton draws it
// straight from the tier: <TbButton :field="'tiers.' + i" />.
export default defineBlock({
 type: 'pricing',
 label: 'Pricing',
 description: 'Tiered plan table',
 category: 'common',
 icon: 'pricing',
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
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
   .max(4)
   .default([]),
 }),
 fields: [
  taglineField,
  headlineField,
  {
   key: 'tiers',
   label: 'Tiers',
   widget: 'items',
   itemLabel: 'name',
   max: 4,
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
  'tiers.*.name': [],
  'tiers.*.price': [],
  'tiers.*.period': [],
  'tiers.*.features': ['bold'],
  'tiers.*.label': [],
  'tiers.*.to': [],
 },
});
