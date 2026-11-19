// What a shop block draws (app/utils/shop.js): the answer of the site's
// /__timbrr/shop/<kind> (product or collection) for `query` ({ handle,
// first? }), as a ref, null until it's in. On a live page the site's server
// asks the store as the page is drawn, so names and prices are in the HTML.
// The studio's canvas has no site behind it: there the block asks the store
// itself, from the browser, with the public token the studio sent in the
// site (`site.shop`), and the answer has the same shape.
export async function useShopRead(kind, query) {
 const scope = useBlockScope();
 const site = useTimbrrSite();
 // The canvas page sets this from the start; a live page never does (composables/collections.js).
 const onCanvasPage = Boolean(useTimbrrCollections().value);
 const asks = !onCanvasPage && Boolean(toValue(query).handle);
 const { data } = await useFetch(`/__timbrr/shop/${kind}`, {
  key: `tb-shop-${kind}-${scope?.id}`,
  query,
  immediate: asks,
  watch: asks ? undefined : false,
  default: () => null,
 });
 if (!onCanvasPage) return data;

 const sent = ref(null);
 let asked = 0;
 watch(
  () => [site?.value?.shop ?? null, JSON.stringify(toValue(query))],
  async ([shop, json]) => {
   if (!import.meta.client) return;
   const mine = ++asked;
   if (shop) sent.value = null;
   const answer = await shopAnswer(shop, kind, JSON.parse(json));
   if (mine === asked) sent.value = answer;
  },
  { immediate: true },
 );
 return sent;
}

// What the address says came back from Buy for this block (cart.post.js):
// { reason: 'sold_out' | 'failed' | '', variant: the variant's full id or '' }.
export function useShopReturn() {
 const route = useRoute();
 const scope = useBlockScope();
 return computed(() => {
  const mine = scope?.id && route.query.block === scope.id;
  const reason = mine && ['sold_out', 'failed'].includes(route.query.shop) ? route.query.shop : '';
  return { reason, variant: reason ? shopVariantId(route.query.variant) : '' };
 });
}
