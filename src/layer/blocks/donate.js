import { z } from 'zod';
import { defineBlock, headlineField } from '../schema/define.js';

// A Give button for a fund (the studio's docs/payments.md): three amounts
// and Other, then Stripe Checkout on the owner's own account. It needs the
// Payments add-on and a connected bank; without them it draws nothing on
// the live site, so a page never shows a button that can't work.
const amount = z.number().int().min(1).max(10000);

export default defineBlock({
 type: 'donate',
 label: 'Donate',
 description: 'Visitors give to a fund, any amount',
 category: 'cta',
 icon: 'donate',
 keywords: ['donate', 'donation', 'give', 'gift', 'fund', 'charity', 'support', 'payments'],
 schema: z.object({
  headline: z.string().max(120).default(''),
  body: z.string().max(400).default(''),
  fund: z.string().max(80).default(''),
  amount1: amount.default(25),
  amount2: amount.default(50),
  amount3: amount.default(100),
  label: z.string().max(40).default('Give'),
 }),
 fields: [
  headlineField,
  { key: 'body', label: 'Words', widget: 'textarea', inline: true, ai: 'generate' },
  { key: 'fund', label: 'Fund', widget: 'text', placeholder: 'Feed the block', help: 'What the gift is for. It shows on their receipt and in your Payments.' },
  { key: 'amount1', label: 'First amount', widget: 'number', min: 1, max: 10000, step: 1, unit: '$' },
  { key: 'amount2', label: 'Second amount', widget: 'number', min: 1, max: 10000, step: 1, unit: '$' },
  { key: 'amount3', label: 'Third amount', widget: 'number', min: 1, max: 10000, step: 1, unit: '$' },
  { key: 'label', label: 'Button', widget: 'text', inline: true, placeholder: 'Give' },
 ],
 defaults: {
  headline: 'Help us feed the block',
  body: 'Every gift goes straight to the people we serve.',
  fund: '',
  amount1: 25,
  amount2: 50,
  amount3: 100,
  label: 'Give',
 },
 wys: { headline: [], body: [], label: [] },
});
