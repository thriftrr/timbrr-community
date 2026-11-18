// Shop blocks (the studio's docs/adr/0022-shopify-commerce.md): what the
// Product and Product grid blocks read from a client's own Shopify store
// through the Storefront API, and the checks around buying. Plain fetch and
// GraphQL, nothing else. The site's server reads through /__timbrr/shop/…
// (server/utils/shopify.js); the studio's canvas, which has no site behind
// it, reads straight from the store with the public token the studio sent.
// Product data is never kept anywhere but the edge cache, for a minute.
// (Nuxt auto-imports app/utils, so every name here starts with `shop`.)

// The Storefront API version a store's config falls back to. Shopify keeps
// each one for at least a year, so bump it about once a year.
export const SHOP_API_VERSION = '2026-10';
export const SHOP_WAIT = 4000; // ms the store gets to answer
export const SHOP_KEEP = 60; // seconds an answer stays at the edge
export const SHOP_GRID_SIZES = [3, 4, 8, 12];
export const SHOP_PICKER_MAX = 5; // more choices than this: a native <select>

const HOST = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const VERSION = /^\d{4}-(01|04|07|10)$/;
const TOKEN = /^[A-Za-z0-9_-]{16,128}$/;
const ADMIN_TOKEN = /^shp(at|ca|pa|ss)_/; // never a public token: refused before any call
const HANDLE = /^[\p{Ll}\p{Lo}\p{N}][\p{Ll}\p{Lo}\p{N}_-]{0,254}$/u;
const VARIANT = /^gid:\/\/shopify\/ProductVariant\/(\d{1,20})$/;
const BLOCK = /^[A-Za-z0-9_.-]{1,80}$/;
const CONTROL = /[\u0000-\u001f\u007f]/;

// The store as the studio sends it ({ domain, token, apiVersion, shopUrl }),
// or null when it isn't one that can be asked.
export function shopConfig(value) {
 if (!value || typeof value !== 'object') return null;
 const domain = String(value.domain ?? '').toLowerCase();
 const token = String(value.token ?? '');
 if (!HOST.test(domain) || !TOKEN.test(token) || ADMIN_TOKEN.test(token)) return null;
 const shopUrl = typeof value.shopUrl === 'string' && /^https:\/\/[^/\\\s]+\/?$/.test(value.shopUrl) ? value.shopUrl.replace(/\/$/, '') : null;
 return { domain, token, apiVersion: VERSION.test(value.apiVersion) ? value.apiVersion : SHOP_API_VERSION, shopUrl };
}

export const shopHandle = (value) => typeof value === 'string' && HANDLE.test(value);

const PRODUCT_FIELDS = `
 handle title description availableForSale
 featuredImage { url altText width height }
 priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
 options { name }
 variants(first: 100) { nodes { id title availableForSale price { amount currencyCode } } }`;
export const SHOP_PRODUCT_QUERY = `query TimbrrProduct($handle: String!) { product(handle: $handle) { ${PRODUCT_FIELDS} } }`;
export const SHOP_COLLECTION_QUERY = `query TimbrrCollection($handle: String!, $first: Int!) { collection(handle: $handle) { handle title products(first: $first) { nodes { ${PRODUCT_FIELDS} } } } }`;
export const SHOP_CART_MUTATION = `mutation TimbrrCart($lines: [CartLineInput!]!) { cartCreate(input: { lines: $lines }) { cart { checkoutUrl totalQuantity } userErrors { code message } warnings { code message } } }`;

// One Storefront call: its `data`, or a thrown error (an answer that isn't
// 200, GraphQL errors, or no answer within SHOP_WAIT). `buyerIp` is the
// visitor's address, which the server sends so Shopify's limits count each
// buyer, not the Worker. With `cache` (the edge's caches.default) a good
// answer is kept SHOP_KEEP seconds under a key of its own, apart from the
// page's.
export async function shopFetch(shop, query, variables, { buyerIp, cache, wait = SHOP_WAIT } = {}) {
 const url = `https://${shop.domain}/api/${shop.apiVersion}/graphql.json`;
 const body = JSON.stringify({ query, variables });
 const key = cache ? `${url}?timbrr=${encodeURIComponent(body)}` : null;
 const kept = key ? await cache.match(key).catch(() => undefined) : undefined;
 if (kept) return (await kept.json()).data;
 const headers = { 'content-type': 'application/json', accept: 'application/json', 'X-Shopify-Storefront-Access-Token': shop.token };
 if (buyerIp) headers['Shopify-Storefront-Buyer-IP'] = buyerIp;
 const res = await fetch(url, { method: 'POST', headers, body, signal: AbortSignal.timeout(wait) });
 if (res.status !== 200) throw new Error(`Shopify answered ${res.status}`);
 const text = await res.text();
 const json = JSON.parse(text);
 if (json?.errors?.length) throw new Error(`Shopify said: ${json.errors[0]?.message ?? 'an error'}`);
 if (!json?.data) throw new Error('Shopify sent no data');
 if (key) await cache.put(key, new Response(text, { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${SHOP_KEEP}` } })).catch(() => {});
 return json.data;
}

// A product the way the blocks draw it, from Storefront's.
export function shopProduct(node) {
 if (!node || typeof node !== 'object') return null;
 const currency = node.priceRange?.minVariantPrice?.currencyCode ?? 'USD';
 const variants = (node.variants?.nodes ?? []).map((variant) => ({
  id: String(variant.id),
  title: String(variant.title ?? ''),
  available: variant.availableForSale === true,
  price: Number(variant.price?.amount) || 0,
 }));
 const image = node.featuredImage?.url ? { src: node.featuredImage.url, alt: node.featuredImage.altText ?? '', width: node.featuredImage.width ?? null, height: node.featuredImage.height ?? null } : null;
 return {
  handle: String(node.handle ?? ''),
  title: String(node.title ?? ''),
  description: String(node.description ?? ''),
  image,
  currency,
  min: Number(node.priceRange?.minVariantPrice?.amount) || 0,
  max: Number(node.priceRange?.maxVariantPrice?.amount) || 0,
  available: variants.some((variant) => variant.available),
  // What the choices are called ("Amount", "Size / Color"); one variant has none.
  choice: variants.length > 1 ? (node.options ?? []).map((option) => option.name).join(' / ') : '',
  variants,
 };
}

// { product } — null when the store has no such product, or it isn't on the
// channel the token belongs to.
export async function shopReadProduct(shop, handle, options) {
 const data = await shopFetch(shop, SHOP_PRODUCT_QUERY, { handle }, options);
 return { product: shopProduct(data.product) };
}

// { collection: { handle, title }, products } — collection null when the
// store has no such Shopify collection.
export async function shopReadCollection(shop, handle, first, options) {
 const data = await shopFetch(shop, SHOP_COLLECTION_QUERY, { handle, first }, options);
 const found = data.collection;
 return {
  collection: found ? { handle: String(found.handle ?? handle), title: String(found.title ?? '') } : null,
  products: (found?.products?.nodes ?? []).map(shopProduct),
 };
}

// What /__timbrr/shop/product and /collection answer (and the canvas reads
// the same way), for `kind` 'product' or 'collection':
//  { product, shopUrl } | { collection, products, shopUrl }  null: not in the store
//  { unavailable: true, shopUrl }  the store didn't answer in time, or refused
//  { product: null | collection: null, products: [], shop: false }  no store
export async function shopAnswer(shop, kind, { handle, first } = {}, options) {
 const empty = kind === 'product' ? { product: null } : { collection: null, products: [] };
 if (!shop || !shopHandle(handle)) return { ...empty, shop: Boolean(shop), shopUrl: shop?.shopUrl ?? null };
 try {
  const read = kind === 'product' ? await shopReadProduct(shop, handle, options) : await shopReadCollection(shop, handle, SHOP_GRID_SIZES.includes(Number(first)) ? Number(first) : 4, options);
  return { ...read, shopUrl: shop.shopUrl };
 } catch (error) {
  console.error(`[timbrr] Couldn't read ${kind} ${handle} from Shopify at ${shop.domain}: ${error.message}`);
  return { unavailable: true, shopUrl: shop.shopUrl };
 }
}

// A page on this site to come back to: a path from the root, and nothing a
// browser could read as another host. Anything else is null.
export function shopReturnPath(value) {
 if (typeof value !== 'string' || value.length > 512 || CONTROL.test(value)) return null;
 return /^\/(?![/\\])[^?#\\\s]*$/.test(value) ? value : null;
}

// Buy: what /__timbrr/shop/cart answers a form post with, as { status,
// location } (303 to Shopify's checkout, or back to the block with why), or
// { status: 400 } when there's nowhere safe to send the buyer back to.
export async function shopCheckout(shop, form, options) {
 const back = shopReturnPath(form?.return);
 if (!back) return { status: 400 };
 const block = BLOCK.test(form?.block ?? '') ? form.block : '';
 const variant = String(form?.variant ?? '');
 const number = VARIANT.exec(variant)?.[1];
 const again = (reason) => ({
  status: 303,
  location: `${back}?shop=${reason}${block ? `&block=${encodeURIComponent(block)}` : ''}${number ? `&variant=${number}` : ''}${block ? `#${encodeURIComponent(block)}` : ''}`,
 });
 if (!shop || !number) return again('failed');
 try {
  const data = await shopFetch(shop, SHOP_CART_MUTATION, { lines: [{ merchandiseId: variant, quantity: 1 }] }, options);
  const made = data.cartCreate ?? {};
  const codes = [...(made.userErrors ?? []), ...(made.warnings ?? [])].map((problem) => String(problem?.code ?? ''));
  if (codes.some((code) => /STOCK|SOLD_OUT/.test(code))) return again('sold_out');
  if (made.userErrors?.length || !/^https:\/\/[^/\\\s]+\//.test(made.cart?.checkoutUrl ?? '')) return again('failed');
  if (made.cart.totalQuantity === 0) return again('sold_out');
  return { status: 303, location: made.cart.checkoutUrl };
 } catch {
  return again('failed');
 }
}

// $50.00, or with `short` $50 for a whole amount (a button, a range).
export function shopMoney(amount, currency = 'USD', short = false) {
 const whole = short && Number.isInteger(amount);
 try {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(amount);
 } catch {
  return `${amount.toFixed(whole ? 0 : 2)} ${currency}`;
 }
}

// "$25 – $100", or "$25" when every choice costs the same.
export function shopRange(product) {
 const min = shopMoney(product.min, product.currency, true);
 return product.max > product.min ? `${min} – ${shopMoney(product.max, product.currency, true)}` : min;
}

// The variant to start on: the one named in the address when it's still in
// stock, or else the first in stock, or else the first.
export function shopStartVariant(product, wanted) {
 const variants = product?.variants ?? [];
 return variants.find((variant) => variant.id === wanted && variant.available) ?? variants.find((variant) => variant.available) ?? variants[0] ?? null;
}

// The variant id a return address names (?variant=123), in full.
export const shopVariantId = (number) => (/^\d{1,20}$/.test(String(number ?? '')) ? `gid://shopify/ProductVariant/${number}` : '');

// 'gift-card' → 'Gift card': a handle said as words, for a product the store no longer has.
export const shopHandleWords = (handle) => String(handle ?? '').replace(/[-_]+/g, ' ').replace(/^./, (first) => first.toUpperCase());
