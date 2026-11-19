import { z } from 'zod';
import { defineBlock } from '../schema/define.js';

// One product from the site's connected Shopify store (the studio's
// docs/adr/0022-shopify-commerce.md): its picture, price, choices and a Buy
// button that goes to Shopify's checkout. The block keeps only the
// product's handle and the owner's own label and heading; the title,
// description, prices and picture come live from Shopify every time.
export default defineBlock({
 type: 'product',
 label: 'Product',
 description: 'One product from your Shopify store',
 category: 'cta',
 icon: 'product',
 advanced: true,
 keywords: ['shop', 'shopify', 'buy', 'sell', 'product', 'gift card', 'store', 'checkout'],
 schema: z.object({
  product: z.string().max(255).default(''),
  label: z.string().max(80).default(''),
  heading: z.string().max(160).default(''),
  buyLabel: z.enum(['Buy now', 'Buy', 'Book now']).default('Buy now'),
 }),
 fields: [
  { key: 'product', label: 'Product', widget: 'shop_product' },
  { key: 'label', label: 'Label', widget: 'text', inline: true, help: 'Optional. A word or two above the heading.' },
  { key: 'heading', label: 'Heading', widget: 'text', inline: true, help: "Optional. The product's own name from Shopify shows under it." },
  {
   key: 'buyLabel',
   label: 'Button',
   widget: 'buttons',
   options: [
    { label: 'Buy now', value: 'Buy now' },
    { label: 'Buy', value: 'Buy' },
    { label: 'Book now', value: 'Book now' },
   ],
  },
 ],
 defaults: { product: '', label: '', heading: '', buyLabel: 'Buy now' },
 wys: { label: [], heading: [] },
});
