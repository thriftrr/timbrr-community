import { z } from 'zod';
import { defineBlock, navListSchema } from '../schema/define.js';

// The site's header, kept in the studio's Library. A site's pages draw it
// through <TbSiteHeader>, and so does this block's component, so what's
// built is what they show. `frame: true` keeps it out of the tray: it lives
// in the Library's own Header & footer tab, one block to an item.
export default defineBlock({
 type: 'site_header',
 label: 'Header',
 description: 'The bar across the top of every page',
 category: 'layout',
 icon: 'site_header',
 frame: true,
 schema: z.object({
  style: z.enum(['classic', 'minimal', 'bar']).default('classic'),
  menu: navListSchema,
  cta: z
   .object({
    label: z.string().max(60).default(''),
    to: z.string().max(2000).default(''),
   })
   .default({ label: '', to: '' }),
  bar: z.string().max(200).default(''),
 }),
 fields: [
  { key: 'menu', label: 'Menu', widget: 'nav', max: 40 },
  { key: 'cta', label: 'Button', widget: 'nav', single: true, help: 'Leave the label empty for no button.' },
  { key: 'bar', label: 'Announcement', widget: 'text', inline: true, placeholder: 'Closed Monday for the holiday', help: 'Shows above the header in the Bar style.' },
  {
   key: 'style',
   label: 'Style',
   widget: 'buttons',
   options: [
    { label: 'Classic', value: 'classic' },
    { label: 'Minimal', value: 'minimal' },
    { label: 'Bar', value: 'bar' },
   ],
  },
 ],
 defaults: { style: 'classic', menu: [], cta: { label: '', to: '' }, bar: '' },
 wys: { bar: [] },
});
