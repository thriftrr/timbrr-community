import { z } from 'zod';
import { buttonSchema, buttonsField, defineBlock, headlineField, richText, richTextSchema } from '../schema/define.js';

export default defineBlock({
 type: 'order_online',
 label: 'Order online',
 description: 'Toast, Square, delivery app',
 category: 'cta',
 icon: 'order_online',
 advanced: true,
 keywords: ['order', 'takeout', 'delivery', 'toast', 'square'],
 schema: z.object({
  headline: z.string().max(160).default(''),
  body: richTextSchema.default(richText('')),
  eta: z.string().max(40).default(''),
  buttons: z.array(buttonSchema).max(2).default([]),
 }),
 fields: [
  headlineField,
  { key: 'body', label: 'Body', widget: 'html', inline: true, ai: 'generate' },
  { key: 'eta', label: 'ETA pill', widget: 'text', inline: true, placeholder: 'Ready in ~15 min', help: 'How long an order takes. Leave it empty for no pill.' },
  {
   ...buttonsField,
   max: 2,
   help: 'Link each one to where people order: your ordering page, or a delivery app.',
  },
 ],
 defaults: {
  headline: 'Order ahead, skip the line',
  body: richText("Order online, pay ahead, and it'll be ready when you walk in."),
  eta: 'Ready in ~15 min',
  buttons: [{ label: 'Start an order', to: '/order', style: 'solid' }],
 },
 wys: { headline: [], body: ['bold', 'italic', 'link'], eta: [], 'buttons.*.label': [] },
});
