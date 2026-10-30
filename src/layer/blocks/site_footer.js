import { z } from 'zod';
import { defineBlock, navListSchema } from '../schema/define.js';

// The site's footer, kept in the studio's Library. A site's pages draw it
// through <TbSiteFooter>, and so does this block's component, so what's
// built is what they show. `frame: true` keeps it out of the tray.
export default defineBlock({
 type: 'site_footer',
 label: 'Footer',
 description: 'The band that closes every page',
 category: 'layout',
 icon: 'site_footer',
 frame: true,
 schema: z.object({
  style: z.enum(['full', 'slim']).default('full'),
  columns: navListSchema,
  legal: z.string().max(300).default(''),
 }),
 fields: [
  { key: 'columns', label: 'Links', widget: 'nav', max: 40, help: 'An item with links under it gets a column of its own. The rest share one.' },
  { key: 'legal', label: 'Small print', widget: 'text', inline: true, placeholder: '© 2026 Bur Oak Coffee', help: 'Leave it empty for the year and the site’s name.' },
  {
   key: 'style',
   label: 'Style',
   widget: 'buttons',
   options: [
    { label: 'Full', value: 'full' },
    { label: 'Slim', value: 'slim' },
   ],
  },
 ],
 defaults: { style: 'full', columns: [], legal: '' },
 wys: { legal: [] },
});
