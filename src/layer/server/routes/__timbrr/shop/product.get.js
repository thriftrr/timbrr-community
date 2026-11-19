import { defineEventHandler, getQuery, setResponseHeaders } from 'h3';
import { shopAnswer } from '../../../../app/utils/shop.js';
import { shopOptions, siteShop } from '../../../utils/shopify.js';

// /__timbrr/shop/product?handle=gift-card: one product from the site's
// Shopify store, for the Product block (the studio's docs/adr/0022), as
// shopAnswer says: { product, shopUrl }, { unavailable: true, shopUrl }, or
// { product: null, shop: false } with no store connected. The store's
// answer is kept a minute at the edge, apart from the page's, so a slow or
// broken store only ever costs the block, never the page.
export default defineEventHandler(async (event) => {
 const answer = await shopAnswer(await siteShop(event), 'product', { handle: getQuery(event).handle }, shopOptions(event));
 setResponseHeaders(event, { 'Cache-Control': answer.unavailable ? 'no-store' : 'public, max-age=60', 'X-Robots-Tag': 'noindex' });
 return answer;
});
