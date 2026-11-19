import { defineEventHandler, getQuery, setResponseHeaders } from 'h3';
import { shopAnswer } from '../../../../app/utils/shop.js';
import { shopOptions, siteShop } from '../../../utils/shopify.js';

// /__timbrr/shop/collection?handle=merch&first=4: the first products (3, 4,
// 8 or 12) of one Shopify collection, for the Product grid block, kept like
// a product (shop/product.get.js): { collection, products, shopUrl },
// { unavailable: true, shopUrl }, or { collection: null, products: [],
// shop: false } with no store connected.
export default defineEventHandler(async (event) => {
 const { handle, first } = getQuery(event);
 const answer = await shopAnswer(await siteShop(event), 'collection', { handle, first }, shopOptions(event));
 setResponseHeaders(event, { 'Cache-Control': answer.unavailable ? 'no-store' : 'public, max-age=60', 'X-Robots-Tag': 'noindex' });
 return answer;
});
