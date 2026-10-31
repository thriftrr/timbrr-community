import { z } from 'zod';
import { buttonSchema, buttonsField, defineBlock, headlineField, richText, richTextSchema, taglineField } from '../schema/define.js';

// Gift cards: a picture of the card beside a few words and a button to the
// checkout. The card shows the name the block gives it, since a block
// doesn't know the site's name.
export default defineBlock({
 type: 'gift_cards',
 label: 'Gift cards',
 description: 'Link to gift card checkout',
 category: 'cta',
 icon: 'gift_cards',
 retired: true,
 schema: z.object({
  tagline: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  body: richTextSchema.default(richText('')),
  buttons: z.array(buttonSchema).max(2).default([]),
  card_name: z.string().max(40).default(''),
  card_note: z.string().max(40).default(''),
 }),
 fields: [
  taglineField,
  headlineField,
  { key: 'body', label: 'Body', widget: 'html', inline: true, ai: 'generate' },
  {
   ...buttonsField,
   max: 2,
  },
  { key: 'card_name', label: 'Name on the card', widget: 'text', inline: true, help: 'Usually your business name.' },
  { key: 'card_note', label: 'Small print on the card', widget: 'text', inline: true, help: 'Runs along the bottom of the card.' },
 ],
 defaults: {
  tagline: 'The easy gift',
  headline: 'Gift cards, any amount',
  body: richText('Digital cards land in their inbox in a minute. Printed ones are at the register.'),
  buttons: [{ label: 'Buy a gift card', to: '/gift-cards', style: 'solid' }],
  card_name: 'Your business',
  card_note: 'Gift card · any amount',
 },
 wys: { tagline: [], headline: [], body: ['bold', 'italic', 'link'], 'buttons.*.label': [], card_name: [], card_note: [] },
});
