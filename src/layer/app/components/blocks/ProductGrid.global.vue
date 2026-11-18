<script setup>
 // The first few products of one Shopify collection as cards: picture,
 // title, price, and what to do, pinned to the card's foot. One choice: Buy,
 // straight to checkout. More: Choose, never Buy, so nobody buys a choice
 // they didn't pick. Choose, or a tap on any card's picture or title, opens
 // that product's panel: its own full-width row under the card's row, with
 // the description, the choices and Buy. Without JavaScript the same links
 // load the page with the panel open (?choose=), and Buy still posts.
 // Everything but the label and heading comes live from Shopify
 // (useShopRead); the canvas says what's missing, the live site draws
 // nothing.
 const props = defineProps({ data: { type: Object, required: true } });

 const canvas = useCanvas();
 const scope = useBlockScope();
 const route = useRoute();
 const back = useShopReturn();
 const shows = useFieldShown();
 const answer = await useShopRead('collection', computed(() => ({ handle: props.data.collection, first: Number(props.data.limit) || 4 })));
 const products = computed(() => answer.value?.products ?? []);
 const down = computed(() => answer.value?.unavailable === true);
 const shopUrl = computed(() => (props.data.showShopLink && answer.value?.shopUrl ? answer.value.shopUrl : null));

 const note = computed(() => {
  if (!canvas || !answer.value || products.value.length || down.value) return null;
  if (answer.value.shop === false) return { title: 'Connect your Shopify store first', text: "About five minutes, with your Shopify login. Shop blocks turn on when it's connected." };
  if (!props.data.collection) return { title: 'Pick a Shopify collection to show here', text: 'Search your Shopify store in the panel on the right.' };
  if (!answer.value.collection) return { title: `${shopHandleWords(props.data.collection)} is no longer in your store`, text: 'It was deleted or taken off the Headless channel in Shopify. Buyers see nothing here.' };
  return { title: `The ${answer.value.collection.title} collection is empty`, text: 'Buyers see nothing here until you add products to it in Shopify.' };
 });

 // The open panel's product, by place: the one the address names (?choose=,
 // or the variant Buy came back about), until a tap picks another.
 const named = computed(() => {
  if (back.value.variant) return products.value.findIndex((product) => product.variants.some((variant) => variant.id === back.value.variant));
  return route.query.block === scope?.id ? products.value.findIndex((product) => product.handle === route.query.choose) : -1;
 });
 const tapped = ref(null);
 const open = computed(() => tapped.value ?? named.value);
 const shown = computed(() => products.value[open.value] ?? null);
 const variant = ref('');
 const picked = computed(() => shown.value?.variants.find((one) => one.id === variant.value) ?? null);

 const panel = ref(null);
 function choose(index) {
  tapped.value = open.value === index ? -1 : index;
  if (tapped.value === index) nextTick(() => panel.value?.focus());
 }
 const chooseHref = (product) => `?choose=${encodeURIComponent(product.handle)}&block=${encodeURIComponent(scope?.id ?? '')}#${scope?.id ?? ''}`;

 // The panel comes after the last card of the open card's row: a row is 3
 // or 4 cards wide, and 2 on a phone (the styles below say the same).
 const wide = computed(() => (props.data.limit === '3' ? 3 : 4));
 function after(columns) {
  const end = Math.min(Math.ceil((open.value + 1) / columns) * columns, products.value.length) - 1;
  return 2 * end + 1;
 }

 const priceOf = (product) => (product.max > product.min ? shopRange(product) : shopMoney(product.min, product.currency));
 const image = (product) => (product.image && safeSrc(product.image.src) ? product.image : null);
</script>

<template>
 <section v-if="products.length || down || note" :id="scope?.id" class="tb-section tb-shop-grid">
  <div class="tb-wrap">
   <TbShopState v-if="note" :title="note.title" :text="note.text" />
   <div v-else class="tb-shop-grid__inner">
    <div class="tb-shop-grid__head">
     <TbText v-if="shows('label', data.label)" :data="data" field="label" tag="p" class="tb-shop-label" />
     <TbText v-if="shows('heading', data.heading)" :data="data" field="heading" tag="h2" class="tb-heading tb-shop-grid__heading" />
    </div>
    <TbShopState v-if="down" down :shop-url="answer.shopUrl" class="tb-shop-grid__down" />
    <template v-else>
     <a v-if="shopUrl" :href="shopUrl" class="tb-shop-grid__all">See the whole shop</a>
     <ul class="tb-shop-grid__list" :style="{ '--tb-shop-columns': wide }">
      <li v-for="(product, index) in products" :key="product.handle" class="tb-shop-card" :style="{ order: 2 * index }">
       <a :href="chooseHref(product)" class="tb-shop-card__picture" tabindex="-1" aria-hidden="true" @click.prevent="choose(index)">
        <img v-if="image(product)" :src="image(product).src" :alt="image(product).alt" :width="image(product).width" :height="image(product).height" loading="lazy" />
       </a>
       <h3 class="tb-shop-card__title">
        <a :href="chooseHref(product)" :aria-expanded="open === index" @click.prevent="choose(index)">{{ product.title }}</a>
       </h3>
       <p class="tb-shop-card__price">{{ priceOf(product) }}<span v-if="shopVariantNote(product)" class="tb-shop-card__note">{{ shopVariantNote(product) }}</span></p>
       <div v-if="open !== index" class="tb-shop-card__actions">
        <button v-if="!product.available" type="button" class="tb-button tb-shop-card__sold" disabled>Sold out</button>
        <a v-else-if="product.variants.length > 1" :href="chooseHref(product)" class="tb-button tb-button--outline tb-shop-card__choose" @click.prevent="choose(index)">Choose</a>
        <TbShopBuy v-else :product="product" label="Buy" :priced="false" :choices="false" wide />
       </div>
      </li>
      <li
       v-if="shown"
       ref="panel"
       :key="`panel-${shown.handle}`"
       class="tb-shop-panel"
       tabindex="-1"
       :aria-label="shown.title"
       :style="{ '--tb-shop-after-wide': after(wide), '--tb-shop-after-narrow': after(2) }"
      >
       <div class="tb-shop-panel__top">
        <h3 class="tb-shop-panel__title">{{ shown.title }} · {{ picked ? shopMoney(picked.price, shown.currency) : priceOf(shown) }}</h3>
        <a :href="route.path" class="tb-shop-panel__close" @click.prevent="tapped = -1">Close</a>
       </div>
       <p v-if="shown.description" class="tb-shop-panel__description">{{ shown.description }}</p>
       <TbShopBuy v-model:variant="variant" :product="shown" label="Buy" named wide />
      </li>
     </ul>
    </template>
   </div>
  </div>
 </section>
</template>

<style>
 .tb-shop-grid__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 0 24px;
 }

 .tb-shop-grid__head {
  min-width: 0;
 }

 .tb-shop-grid .tb-shop-grid__heading {
  margin: 0;
  line-height: 1.15;
  text-wrap: balance;
 }

 .tb-shop-grid__all {
  padding-bottom: 4px;
  font-size: 15px;
  font-weight: 700;
  color: var(--site-accent);
  text-underline-offset: 4px;
 }

 .tb-shop-grid__down,
 .tb-shop-grid__list {
  grid-column: 1 / -1;
  margin-top: clamp(20px, 3vw, 32px);
 }

 .tb-shop-grid__list {
  display: grid;
  grid-template-columns: repeat(var(--tb-shop-columns), minmax(0, 1fr));
  gap: 28px;
  margin-bottom: 0;
  padding: 0;
  list-style: none;
 }

 .tb-shop-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
 }

 .tb-shop-card__picture {
  display: block;
  overflow: hidden;
  border-radius: var(--site-radius);
  aspect-ratio: 1;
  background: var(--site-surface);
 }

 .tb-shop-card__picture img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
 }

 .tb-shop-card__title {
  margin: 14px 0 0;
  font-family: var(--site-font-display);
  font-size: 17px;
  line-height: 1.3;
  text-wrap: balance;
  overflow-wrap: break-word;
 }

 .tb-shop-card__title a {
  color: var(--site-heading);
  text-decoration: none;
 }

 .tb-shop-card__title a:hover {
  text-decoration: underline;
 }

 .tb-shop-card__price {
  margin: 4px 0 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--site-heading);
 }

 .tb-shop-card__note {
  margin-left: 8px;
  font-size: 13px;
  font-weight: 400;
  color: var(--site-muted);
 }

 /* Pinned to the foot, so a row's buttons line up whatever the titles. */
 .tb-shop-card__actions {
  margin-top: auto;
  padding-top: 16px;
 }

 .tb-shop-card__actions .tb-button {
  justify-content: center;
  width: 100%;
  min-height: 44px;
 }

 .tb-shop-card__sold {
  border-color: transparent;
  background: color-mix(in srgb, var(--site-muted) 18%, var(--site-bg));
  color: var(--site-body);
  font: inherit;
  font-weight: 700;
 }

 /* The open product: its own row, under the row its card is in. */
 .tb-shop-panel {
  order: var(--tb-shop-after-wide);
  grid-column: 1 / -1;
  display: grid;
  gap: 14px;
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
  padding: clamp(18px, 3vw, 28px);
  background: var(--site-bg);
 }

 .tb-shop-panel:focus-visible {
  outline: 2px solid var(--site-accent);
  outline-offset: 2px;
 }

 .tb-shop-panel__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
 }

 .tb-shop-panel__title {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: 19px;
  color: var(--site-heading);
  text-wrap: balance;
 }

 .tb-shop-panel__close {
  flex: none;
  font-size: 14px;
  font-weight: 700;
  color: var(--site-accent);
 }

 .tb-shop-panel__description {
  margin: 0;
  max-width: 62ch;
  font-size: 15.5px;
  line-height: 1.6;
  color: var(--site-body);
  white-space: pre-line;
 }

 @media (max-width: 900px) {
  .tb-shop-grid__list {
   --tb-shop-columns: 2 !important;
   gap: 20px 14px;
  }

  .tb-shop-panel {
   order: var(--tb-shop-after-narrow);
  }
 }

 /* Small screens: the link to the whole shop under the cards. */
 @media (max-width: 720px) {
  .tb-shop-grid__inner {
   grid-template-columns: minmax(0, 1fr);
  }

  .tb-shop-grid__all {
   order: 1;
   margin-top: 24px;
   justify-self: start;
  }
 }
</style>
