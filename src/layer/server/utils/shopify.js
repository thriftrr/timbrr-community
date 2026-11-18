import { getHeader } from 'h3';
import { shopConfig } from '../../app/utils/shop.js';
import { fetchPublished } from './studio.js';

// The site's server side of the shop blocks (app/utils/shop.js has the
// Storefront client, queries and checks, shared with the studio's canvas).

// This site's connected Shopify store, from what the studio publishes with
// its home page (`site.shop`, kept a minute like the page), or null when it
// has none, the studio sent none, or the studio can't be reached.
export async function siteShop(event) {
 const answer = await fetchPublished(event, `page?path=${encodeURIComponent('/')}`);
 return answer.status === 200 ? shopConfig(answer.data.site?.shop) : null;
}

// How every read and the cart call reach the store: the visitor's address
// goes along as Shopify-Storefront-Buyer-IP, and reads are kept at the edge.
export function shopOptions(event, { cache = true } = {}) {
 return {
  buyerIp: getHeader(event, 'cf-connecting-ip') || undefined,
  cache: cache ? globalThis.caches?.default : undefined,
 };
}
