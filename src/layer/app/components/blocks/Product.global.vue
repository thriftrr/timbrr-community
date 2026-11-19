<script setup>
 // One product from the site's Shopify store: its picture on the left; on
 // the right the owner's label and heading, then Shopify's own title with
 // the price range on a small line, the picked choice's price big, the
 // description, the choices and Buy (TbShopBuy). Everything but the label
 // and heading comes live from Shopify (useShopRead). A store that doesn't
 // answer keeps the label and heading and says so in one row. On the live
 // site an empty or broken block draws nothing; the studio's canvas says
 // what's missing instead.
 const props = defineProps({ data: { type: Object, required: true } });

 const canvas = useCanvas();
 const scope = useBlockScope(); // its id is the anchor Buy comes back to
 const shows = useFieldShown();
 const answer = await useShopRead('product', computed(() => ({ handle: props.data.product })));
 const product = computed(() => answer.value?.product ?? null);
 const down = computed(() => answer.value?.unavailable === true);
 const variant = ref('');
 const picked = computed(() => product.value?.variants.find((one) => one.id === variant.value) ?? product.value?.variants[0] ?? null);

 // The canvas's notes, in the order they're fixed in.
 const note = computed(() => {
  if (!canvas || !answer.value || product.value || down.value) return null;
  if (answer.value.shop === false) return { title: 'Connect your Shopify store first', text: "About five minutes, with your Shopify login. Shop blocks turn on when it's connected." };
  if (!props.data.product) return { title: 'Pick a product to show here', text: 'Search your Shopify store in the panel on the right.' };
  return { title: `${shopHandleWords(props.data.product)} is no longer in your store`, text: 'It was deleted or taken off the Headless channel in Shopify. Buyers see nothing here.' };
 });
 const image = computed(() => (product.value?.image && safeSrc(product.value.image.src) ? product.value.image : null));
</script>

<template>
 <section v-if="product || down || note" :id="scope?.id" class="tb-section tb-product">
  <div class="tb-wrap" :class="{ 'tb-product__inner': product }">
   <TbShopState v-if="note" :title="note.title" :text="note.text" />
   <template v-else>
    <div v-if="product" class="tb-product__picture">
     <img v-if="image" :src="image.src" :alt="image.alt || product.title" :width="image.width" :height="image.height" />
    </div>
    <div class="tb-product__text">
     <TbText v-if="shows('label', data.label)" :data="data" field="label" tag="p" class="tb-shop-label" />
     <TbText v-if="shows('heading', data.heading)" :data="data" field="heading" tag="h2" class="tb-heading tb-product__heading" />
     <TbShopState v-if="down" down :shop-url="answer.shopUrl" />
     <template v-else>
      <p class="tb-product__name">{{ product.title }} · {{ shopRange(product) }}</p>
      <p v-if="picked" class="tb-product__price">{{ shopMoney(picked.price, product.currency) }}</p>
      <p v-if="product.description" class="tb-product__description">{{ product.description }}</p>
      <TbShopBuy v-model:variant="variant" :product="product" :label="data.buyLabel" secure class="tb-product__buy" />
     </template>
    </div>
   </template>
  </div>
 </section>
</template>

<style>
 .tb-product__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: center;
 }

 .tb-product__picture {
  overflow: hidden;
  border-radius: var(--site-radius);
  aspect-ratio: 4 / 3;
  background: var(--site-surface);
 }

 .tb-product__picture img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
 }

 .tb-product__text {
  min-width: 0;
  overflow-wrap: break-word;
 }

 .tb-shop-label {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--site-accent);
 }

 .tb-product .tb-product__heading {
  margin: 0 0 12px;
  line-height: 1.15;
  text-wrap: balance;
 }

 .tb-product__name {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--site-body);
 }

 .tb-product__price {
  margin: 4px 0 0;
  font-family: var(--site-font-display);
  font-size: 24px;
  font-weight: 700;
  color: var(--site-heading);
 }

 .tb-product__description {
  margin: 14px 0 0;
  font-size: clamp(16px, 0.4vw + 14px, 17.5px);
  line-height: 1.65;
  color: var(--site-body);
  white-space: pre-line;
 }

 .tb-product__buy {
  margin-top: 28px;
 }

 /* Small screens: the picture first, the words under it. */
 @media (max-width: 720px) {
  .tb-product__inner {
   grid-template-columns: minmax(0, 1fr);
  }
 }
</style>
