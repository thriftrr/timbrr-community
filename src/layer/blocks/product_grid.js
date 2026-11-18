import { z } from 'zod';
import { defineBlock } from '../schema/define.js';

// The first few products of one Shopify collection in the site's connected
// store, as cards to buy from (the studio's docs/adr/0022-shopify-commerce.md).
// The block keeps only the Shopify collection's handle and how it's shown;
// everything about the products comes live from Shopify.
export default defineBlock({
 type: 'product_grid',
 label: 'Product grid',
 description: 'Products from a Shopify collection',
 category: 'dynamic',
 icon: 'product_grid',
 advanced: true,
 keywords: ['shop', 'shopify', 'buy', 'sell', 'products', 'store', 'merch', 'collection'],
 schema: z.object({
  collection: z.string().max(255).default(''),
  label: z.string().max(80).default(''),
  heading: z.string().max(160).default(''),
  limit: z.enum(['3', '4', '8', '12']).default('4'), // text, like every buttons choice (cards' columns)
  showShopLink: z.boolean().default(true),
 }),
 fields: [
  { key: 'collection', label: 'Shopify collection', widget: 'shop_collection' },
  { key: 'label', label: 'Label', widget: 'text', inline: true, help: 'Optional. A word or two above the heading.' },
  { key: 'heading', label: 'Heading', widget: 'text', inline: true },
  {
   key: 'limit',
   label: 'How many',
   widget: 'buttons',
   options: ['3', '4', '8', '12'].map((value) => ({ label: value, value })),
  },
  { key: 'showShopLink', label: 'Link to the whole shop', widget: 'switch', help: 'Shown only when the store has its own web address.' },
 ],
 defaults: { collection: '', label: '', heading: '', limit: '4', showShopLink: true },
 wys: { label: [], heading: [] },
});
