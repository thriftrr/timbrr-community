import { z } from 'zod';
import { defineBlock, headlineField } from '../schema/define.js';

// Order from the menu on the site itself (the studio's docs/ordering.md):
// categories and items, a cart, pickup or delivery and a time (or a table,
// from a table code's ?table= link), a name and email, then Stripe Checkout
// on the owner's own account. The studio prices the cart from the menu; the
// browser sends only item ids and counts. It needs the Ordering add-on and
// Payments taking money; without them the live site draws nothing.
export default defineBlock({
 type: 'order',
 label: 'Order',
 description: 'Your menu with a cart, pickup or delivery, paid up front',
 category: 'cta',
 icon: 'order',
 keywords: ['order', 'menu', 'cart', 'pickup', 'takeout', 'delivery', 'cafe', 'restaurant', 'checkout', 'table'],
 schema: z.object({
  headline: z.string().max(120).default(''),
  body: z.string().max(400).default(''),
  label: z.string().max(40).default(''),
 }),
 fields: [
  headlineField,
  { key: 'body', label: 'Words', widget: 'textarea', inline: true, ai: 'generate' },
  { key: 'label', label: 'Button', widget: 'text', inline: true, placeholder: 'Pay and order', help: 'The menu, hours and prices are set in Ordering.' },
 ],
 defaults: {
  headline: 'Order ahead',
  body: 'Pick what you would like and a time. It will be ready when you get here.',
  label: 'Pay and order',
 },
 wys: { headline: [], body: [], label: [] },
});
