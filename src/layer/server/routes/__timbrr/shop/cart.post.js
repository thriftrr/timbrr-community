import { defineEventHandler, readBody, sendRedirect, setResponseHeaders, setResponseStatus } from 'h3';
import { shopCheckout } from '../../../../app/utils/shop.js';
import { shopOptions, siteShop } from '../../../utils/shopify.js';

// POST /__timbrr/shop/cart: a Buy button, as a plain form post, so it works
// without JavaScript. Fields: `variant` (gid://shopify/ProductVariant/…),
// `return` (the page's path) and `block` (the block's id). It makes a
// one-line Shopify cart and sends the buyer to its checkout with a 303;
// Shopify checks the price and stock again there. Sold out since the page
// was cached, or Shopify failing, sends them back to the block instead:
// <return>?shop=sold_out|failed&block=<id>&variant=<number>#<id>. Never
// kept: every post is a new cart.
export default defineEventHandler(async (event) => {
 setResponseHeaders(event, { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
 const form = await readBody(event).catch(() => null);
 const shop = await siteShop(event);
 const answer = await shopCheckout(shop, form && typeof form === 'object' ? form : {}, shopOptions(event, { cache: false }));
 if (answer.status === 303) return sendRedirect(event, answer.location, 303);
 setResponseStatus(event, 400);
 return { statusCode: 400, message: "That isn't a page on this site to come back to." };
});
