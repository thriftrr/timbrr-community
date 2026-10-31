import { defineBlock } from '../schema/define.js';
import { FOOTER_DEFAULTS, footerSchema } from '../schema/frames.js';

// The site's footer, kept in the studio's Library. A site's pages draw it
// through <TbSiteFooter>, and so does this block's component, so what's
// built is what they show. `frame: true` keeps it out of the tray, and the
// studio edits it with a panel of its own, so it has no fields.
export default defineBlock({
 type: 'site_footer',
 label: 'Footer',
 description: 'The band that closes every page',
 category: 'layout',
 icon: 'site_footer',
 frame: true,
 schema: footerSchema,
 fields: [],
 defaults: FOOTER_DEFAULTS,
});
