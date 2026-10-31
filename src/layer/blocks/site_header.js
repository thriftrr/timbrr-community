import { defineBlock } from '../schema/define.js';
import { HEADER_DEFAULTS, headerSchema } from '../schema/frames.js';

// The site's header, kept in the studio's Library. A site's pages draw it
// through <TbSiteHeader>, and so does this block's component, so what's
// built is what they show. `frame: true` keeps it out of the tray: it lives
// in the Library's own Header & footer tab, one block to an item. It has no
// fields because the studio edits it with a panel of its own, by block type
// (docs/manifest.md § Header and footer).
export default defineBlock({
 type: 'site_header',
 label: 'Header',
 description: 'The bar across the top of every page',
 category: 'layout',
 icon: 'site_header',
 frame: true,
 schema: headerSchema,
 fields: [],
 defaults: HEADER_DEFAULTS,
});
