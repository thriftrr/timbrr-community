// Checks the shop blocks' Storefront client and Buy (app/utils/shop.js)
// against recorded Storefront answers, with no network, build or Vue:
//   node layer/scripts/check-shop.mjs
import { deepEqual, equal, ok } from 'node:assert/strict';
import { shopAnswer, shopCheckout, shopConfig, shopMoney, shopRange, shopReturnPath, shopStartVariant, shopVariantNote } from '../app/utils/shop.js';

// Recorded Storefront answers, trimmed to what the queries ask for.
const variant = (id, title, amount, availableForSale = true) => ({ id: `gid://shopify/ProductVariant/${id}`, title, availableForSale, price: { amount, currencyCode: 'USD' } });
const GIFT_CARD = {
 handle: 'gift-card',
 title: 'Harbour Bakery gift card',
 description: 'Good for bread, pastries, coffee and classes.',
 availableForSale: true,
 featuredImage: { url: 'https://cdn.shopify.com/s/files/1/card.png?v=1', altText: null, width: 1200, height: 900 },
 priceRange: { minVariantPrice: { amount: '25.0', currencyCode: 'USD' }, maxVariantPrice: { amount: '100.0', currencyCode: 'USD' } },
 options: [{ name: 'Amount' }],
 variants: { nodes: [variant(101, '$25', '25.0'), variant(102, '$50', '50.0'), variant(103, '$100', '100.0')] },
};
const CLASS_PASS = {
 ...GIFT_CARD,
 handle: 'bread-class',
 title: 'Bread class, 4 sessions',
 featuredImage: null,
 priceRange: { minVariantPrice: { amount: '65.0', currencyCode: 'USD' }, maxVariantPrice: { amount: '65.0', currencyCode: 'USD' } },
 options: [{ name: 'Title' }],
 variants: { nodes: [variant(201, 'Default Title', '65.0', false)] },
};

// Every fetch the code makes, answered in turn by `answers`.
let calls = [];
function stub(...answers) {
 calls = [];
 globalThis.fetch = async (url, init) => {
  calls.push({ url, init, body: JSON.parse(init.body) });
  const next = answers.shift();
  if (typeof next === 'function') return next(init);
  return new Response(JSON.stringify(next), { status: 200, headers: { 'content-type': 'application/json' } });
 };
}
const quiet = console.error;
console.error = () => {}; // the failures below are meant to log

const shop = shopConfig({ domain: 'Harbour-Bakery.myshopify.com', token: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', apiVersion: '2026-10', shopUrl: 'https://shop.harbourbakery.co/' });
deepEqual(shop, { domain: 'harbour-bakery.myshopify.com', token: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', apiVersion: '2026-10', shopUrl: 'https://shop.harbourbakery.co' });

// An Admin token is never used, nor a store that isn't a host.
equal(shopConfig({ ...shop, token: 'shpat' + '_' + '0123456789abcdef0123456789abcdef' }), null);
equal(shopConfig({ ...shop, domain: 'evil.example/x?' }), null);
equal(shopConfig(null), null);
equal(shopConfig({ ...shop, apiVersion: 'unstable', shopUrl: 'javascript:alert(1)' }).apiVersion, '2026-10');
equal(shopConfig({ ...shop, shopUrl: 'http://shop.example' }).shopUrl, null);

// A product: mapped, its variants counted, the call made as the contract says.
stub({ data: { product: GIFT_CARD } });
const read = await shopAnswer(shop, 'product', { handle: 'gift-card' }, { buyerIp: '203.0.113.7' });
equal(calls.length, 1);
equal(calls[0].url, 'https://harbour-bakery.myshopify.com/api/2026-10/graphql.json');
equal(calls[0].init.method, 'POST');
equal(calls[0].init.headers['X-Shopify-Storefront-Access-Token'], shop.token);
equal(calls[0].init.headers['Shopify-Storefront-Buyer-IP'], '203.0.113.7');
ok(calls[0].init.signal instanceof AbortSignal);
deepEqual(calls[0].body.variables, { handle: 'gift-card' });
equal(read.shopUrl, 'https://shop.harbourbakery.co');
equal(read.product.title, 'Harbour Bakery gift card');
equal(read.product.variants.length, 3);
equal(read.product.choice, 'Amount');
equal(read.product.available, true);
equal(read.product.image.alt, '');
equal(shopRange(read.product), '$25 – $100');
equal(shopMoney(50, 'USD'), '$50.00');
equal(shopMoney(50, 'USD', true), '$50');
equal(shopMoney(12.5, 'USD', true), '$12.50');
equal(shopMoney(1000, 'JPY'), '¥1,000');
equal(shopMoney(1.5, 'KWD'), 'KWD 1.500');
equal(shopStartVariant(read.product, 'gid://shopify/ProductVariant/102').id, 'gid://shopify/ProductVariant/102');

// No Buyer-IP header without a visitor's address (the canvas, in a browser).
stub({ data: { product: GIFT_CARD } });
await shopAnswer(shop, 'product', { handle: 'gift-card' });
equal('Shopify-Storefront-Buyer-IP' in calls[0].init.headers, false);

// Sold out: said by the product, and one variant, no choices.
stub({ data: { product: CLASS_PASS } });
const sold = (await shopAnswer(shop, 'product', { handle: 'bread-class' })).product;
equal(sold.available, false);
equal(sold.choice, '');
equal(shopRange(sold), '$65');
equal(shopVariantNote({ choice: 'Color', variants: [{}, {}] }), '2 colors');
equal(shopVariantNote({ choice: 'Size / Color', variants: [{}, {}, {}] }), '3 options');
equal(shopVariantNote({ choice: '', variants: [{}] }), '');
equal(shopStartVariant(sold).id, 'gid://shopify/ProductVariant/201');
// The first in stock is where a product starts.
equal(shopStartVariant({ variants: [{ id: 'a', available: false }, { id: 'b', available: true }] }).id, 'b');

// Gone from the store, a bad handle, no store: nothing asked of Shopify where it needn't be.
stub({ data: { product: null } });
deepEqual(await shopAnswer(shop, 'product', { handle: 'gone' }), { product: null, shopUrl: 'https://shop.harbourbakery.co' });
stub();
deepEqual(await shopAnswer(shop, 'product', { handle: '../admin' }), { product: null, shop: true, shopUrl: 'https://shop.harbourbakery.co' });
deepEqual(await shopAnswer(null, 'collection', { handle: 'merch' }), { collection: null, products: [], shop: false, shopUrl: null });
equal(calls.length, 0);

// A Shopify collection, with how many asked for (only 3, 4, 8 or 12).
stub({ data: { collection: { handle: 'merch', title: 'Merch', products: { nodes: [GIFT_CARD, CLASS_PASS] } } } }, { data: { collection: { handle: 'merch', title: 'Merch', products: { nodes: [] } } } });
const grid = await shopAnswer(shop, 'collection', { handle: 'merch', first: '8' });
equal(calls[0].body.variables.first, 8);
deepEqual(grid.collection, { handle: 'merch', title: 'Merch' });
deepEqual(grid.products.map((product) => [product.variants.length, product.available]), [[3, true], [1, false]]);
await shopAnswer(shop, 'collection', { handle: 'merch', first: '500' });
equal(calls[1].body.variables.first, 4);

// The store too slow: the block's unavailable answer, never a thrown error.
// (Node doesn't wait on AbortSignal.timeout's timer, so this one holds it.)
const hold = setInterval(() => {}, 1000);
stub((init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason))));
deepEqual(await shopAnswer(shop, 'product', { handle: 'gift-card' }, { wait: 20 }), { unavailable: true, shopUrl: 'https://shop.harbourbakery.co' });
clearInterval(hold);
// …or answering with an error, or GraphQL errors.
stub(() => new Response('{}', { status: 401 }));
equal((await shopAnswer(shop, 'product', { handle: 'gift-card' })).unavailable, true);
stub({ errors: [{ message: 'Throttled' }] });
equal((await shopAnswer(shop, 'product', { handle: 'gift-card' })).unavailable, true);

// The edge cache: a second read within the minute doesn't ask Shopify.
const kept = new Map();
const cache = { match: async (key) => kept.get(key)?.clone(), put: async (key, res) => void kept.set(key, res) };
stub({ data: { product: GIFT_CARD } });
await shopAnswer(shop, 'product', { handle: 'gift-card' }, { cache });
equal((await shopAnswer(shop, 'product', { handle: 'gift-card' }, { cache })).product.title, 'Harbour Bakery gift card');
equal(calls.length, 1);
ok([...kept.values()][0].headers.get('cache-control').includes('max-age=60'));

// Buy: a cart, then a 303 to its checkout.
const form = { variant: 'gid://shopify/ProductVariant/102', return: '/gift-cards', block: 'b_7Hk2' };
stub({ data: { cartCreate: { cart: { checkoutUrl: 'https://shop.harbourbakery.co/cart/c/abc?key=1', totalQuantity: 1 }, userErrors: [], warnings: [] } } });
deepEqual(await shopCheckout(shop, form, { buyerIp: '203.0.113.7' }), { status: 303, location: 'https://shop.harbourbakery.co/cart/c/abc?key=1' });
deepEqual(calls[0].body.variables, { lines: [{ merchandiseId: 'gid://shopify/ProductVariant/102', quantity: 1 }] });
equal(calls[0].init.headers['Shopify-Storefront-Buyer-IP'], '203.0.113.7');

// Sold out on the way: back to the block, saying which.
stub({ data: { cartCreate: { cart: { checkoutUrl: 'https://shop.harbourbakery.co/cart/c/x', totalQuantity: 0 }, userErrors: [], warnings: [{ code: 'MERCHANDISE_OUT_OF_STOCK' }] } } });
deepEqual(await shopCheckout(shop, form), { status: 303, location: '/gift-cards?shop=sold_out&block=b_7Hk2&variant=102#b_7Hk2' });
stub({ data: { cartCreate: { cart: null, userErrors: [{ code: 'MERCHANDISE_NOT_ENOUGH_STOCK' }], warnings: [] } } });
equal((await shopCheckout(shop, form)).location, '/gift-cards?shop=sold_out&block=b_7Hk2&variant=102#b_7Hk2');

// Any other failure: back with failed, nothing charged.
stub({ data: { cartCreate: { cart: null, userErrors: [{ code: 'INVALID', message: 'nope' }], warnings: [] } } });
equal((await shopCheckout(shop, form)).location, '/gift-cards?shop=failed&block=b_7Hk2&variant=102#b_7Hk2');
stub(() => Promise.reject(new TypeError('fetch failed')));
equal((await shopCheckout(shop, form)).location, '/gift-cards?shop=failed&block=b_7Hk2&variant=102#b_7Hk2');
// A checkout address that isn't https is never followed.
stub({ data: { cartCreate: { cart: { checkoutUrl: 'javascript:alert(1)//', totalQuantity: 1 }, userErrors: [], warnings: [] } } });
equal((await shopCheckout(shop, form)).location, '/gift-cards?shop=failed&block=b_7Hk2&variant=102#b_7Hk2');
// No store connected.
equal((await shopCheckout(null, form)).location, '/gift-cards?shop=failed&block=b_7Hk2&variant=102#b_7Hk2');

// A variant id that isn't one: refused before Shopify is asked.
stub();
for (const bad of ['102', 'gid://shopify/Product/102', 'gid://shopify/ProductVariant/1x', '', undefined]) {
 equal((await shopCheckout(shop, { ...form, variant: bad })).location, '/gift-cards?shop=failed&block=b_7Hk2#b_7Hk2', String(bad));
}
equal(calls.length, 0);
// A block id that isn't one is left off.
equal((await shopCheckout(shop, { ...form, variant: 'x', block: '"><script>' })).location, '/gift-cards?shop=failed');

// Never back to another site: anything but a plain path here is a 400.
for (const bad of ['https://evil.example/', '//evil.example', '/\\evil.example', '/\t/evil.example', 'javascript:alert(1)', '/a?b=1', '/a#b', 'evil', '', undefined, `/${'a'.repeat(600)}`]) {
 deepEqual(await shopCheckout(shop, { ...form, return: bad }), { status: 400 }, String(bad));
 equal(shopReturnPath(bad), null, String(bad));
}
equal(calls.length, 0);
equal(shopReturnPath('/'), '/');
equal(shopReturnPath('/shop/gift-cards'), '/shop/gift-cards');

console.error = quiet;
console.log('ok  shopConfig, shopAnswer, the edge cache, shopCheckout');
