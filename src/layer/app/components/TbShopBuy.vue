<script setup>
 // Buying one product (the Product block, and a card of the Product grid):
 // its choices and a Buy button, in a plain form that posts to the site's
 // /__timbrr/shop/cart, which sends the buyer to Shopify's checkout. It works
 // without JavaScript: the choices are radio buttons (a <select> past
 // SHOP_PICKER_MAX), so the picked one is what's posted. With JavaScript the
 // button says it's busy, and that's read out. Back from a sold-out or failed
 // checkout (useShopReturn), it says what happened and offers what's left.
 // `v-model:variant` is the picked variant's id, for the price beside it.
 const props = defineProps({
  product: { type: Object, required: true },
  label: { type: String, default: 'Buy now' },
  priced: { type: Boolean, default: true }, // "Buy now · $50"
  named: { type: Boolean, default: false }, // "Buy Pine · $18"
  choices: { type: Boolean, default: true }, // false: the first in stock, no picker
  secure: { type: Boolean, default: false }, // "Secure checkout by Shopify" beside it
  wide: { type: Boolean, default: false }, // the button fills the width
 });
 const chosen = defineModel('variant', { type: String, default: '' });

 const canvas = useCanvas();
 const scope = useBlockScope();
 const route = useRoute();
 const back = useShopReturn();
 const id = useId();

 // Back from Buy for a variant of this product (or, with none named, for
 // the block's only product).
 const ours = computed(() => back.value.reason && (!back.value.variant || props.product.variants.some((variant) => variant.id === back.value.variant)) ? back.value : null);
 // A variant that sold out on the way to checkout counts as sold out here
 // too, whatever the minute-old copy says.
 const variants = computed(() => props.product.variants.map((variant) => (ours.value?.reason === 'sold_out' && variant.id === ours.value.variant ? { ...variant, available: false } : variant)));
 const available = computed(() => variants.value.some((variant) => variant.available));
 const PICKER_MAX = SHOP_PICKER_MAX;
 const many = computed(() => props.choices && variants.value.length > 1);

 watch(
  variants,
  () => {
   const kept = variants.value.find((variant) => variant.id === chosen.value && variant.available);
   if (!kept) chosen.value = shopStartVariant({ variants: variants.value }, ours.value?.variant)?.id ?? '';
  },
  { immediate: true },
 );
 const variant = computed(() => variants.value.find((one) => one.id === chosen.value) ?? null);
 const price = computed(() => (variant.value ? shopMoney(variant.value.price, props.product.currency, true) : ''));

 const sold = computed(() => {
  if (ours.value?.reason !== 'sold_out') return null;
  const gone = props.product.variants.find((one) => one.id === ours.value.variant);
  return { name: gone && props.product.variants.length > 1 ? gone.title : props.product.title, other: available.value && variants.value.length > 1 ? variant.value?.title : '' };
 });

 const words = computed(() => {
  if (!available.value) return 'Sold out';
  if (ours.value?.reason === 'failed') return 'Try again';
  if (sold.value?.other) return `Buy ${sold.value.other} instead`;
  const name = props.named && variants.value.length > 1 && variant.value ? ` ${variant.value.title}` : '';
  return `${props.label}${name}${props.priced && price.value ? ` · ${price.value}` : ''}`;
 });

 // Busy from the press until the browser leaves; back from checkout by the
 // Back button (a page kept in memory), it's ready again.
 const busy = ref(false);
 function submit(event) {
  if (canvas || !variant.value?.available) return event.preventDefault();
  busy.value = true;
 }
 onMounted(() => window.addEventListener('pageshow', ready));
 onBeforeUnmount(() => window.removeEventListener('pageshow', ready));
 function ready() {
  busy.value = false;
 }
</script>

<template>
 <form class="tb-shop-buy" :class="{ 'tb-shop-buy--wide': wide }" method="post" action="/__timbrr/shop/cart" @submit="submit">
  <input type="hidden" name="return" :value="route.path" />
  <input type="hidden" name="block" :value="scope?.id ?? ''" />

  <div v-if="sold" class="tb-shop-buy__notice" role="status">
   <svg class="tb-shop-buy__notice-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
   <p>
    <strong>{{ sold.name }} just sold out.</strong>
    Someone bought the last one a moment ago.<template v-if="sold.other"> {{ sold.other }} is still in stock.</template>
   </p>
  </div>
  <div v-else-if="ours?.reason === 'failed'" class="tb-shop-buy__notice" role="status">
   <svg class="tb-shop-buy__notice-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
   <p>
    <strong>Checkout didn't open.</strong>
    Shopify didn't answer. Please try again in a minute; nothing was charged.
   </p>
  </div>

  <template v-if="many">
   <div v-if="variants.length > PICKER_MAX" class="tb-shop-buy__field">
    <label :for="`${id}-pick`" class="tb-shop-buy__legend">{{ product.choice }}</label>
    <select :id="`${id}-pick`" v-model="chosen" name="variant" class="tb-shop-buy__select">
     <option v-for="one in variants" :key="one.id" :value="one.id" :disabled="!one.available">{{ one.title }}{{ one.available ? '' : ' (sold out)' }}</option>
    </select>
   </div>
   <fieldset v-else class="tb-shop-buy__field">
    <legend class="tb-shop-buy__legend">{{ product.choice }}</legend>
    <div class="tb-shop-buy__choices">
     <label v-for="one in variants" :key="one.id" class="tb-shop-buy__choice" :class="{ 'is-sold': !one.available }">
      <input v-model="chosen" type="radio" name="variant" :value="one.id" :disabled="!one.available" />
      <svg class="tb-shop-buy__tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      <span>{{ one.title }}</span>
      <span v-if="!one.available" class="tb-shop-buy__sold">Sold out</span>
     </label>
    </div>
   </fieldset>
  </template>
  <input v-else-if="variant" type="hidden" name="variant" :value="variant.id" />

  <div class="tb-shop-buy__row">
   <button type="submit" class="tb-button tb-button--solid tb-shop-buy__button" :disabled="!available || busy" :aria-disabled="busy || undefined">
    <svg v-if="busy" class="tb-shop-buy__spinner" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /></svg>
    <span>{{ busy ? 'Taking you to checkout…' : words }}</span>
   </button>
   <p v-if="secure && available" class="tb-shop-buy__secure">
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
    Secure checkout by Shopify
   </p>
  </div>
  <p class="tb-shop-buy__status" role="status">{{ busy ? 'Taking you to checkout…' : '' }}</p>
 </form>
</template>

<style>
 .tb-shop-buy {
  display: grid;
  gap: 18px;
 }

 .tb-shop-buy__notice {
  display: flex;
  gap: 12px;
  border-radius: var(--site-radius);
  padding: 14px 16px;
  background: color-mix(in srgb, var(--site-eyebrow) 14%, var(--site-bg));
  color: var(--site-heading);
  font-size: 15px;
  line-height: 1.5;
 }

 .tb-shop-buy__notice p {
  margin: 0;
 }

 .tb-shop-buy__notice strong {
  display: block;
 }

 .tb-shop-buy__notice-icon,
 .tb-shop-buy__tick,
 .tb-shop-buy__secure svg,
 .tb-shop-buy__spinner {
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
 }

 .tb-shop-buy__notice-icon {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  color: var(--site-eyebrow);
 }

 .tb-shop-buy__field {
  margin: 0;
  border: 0;
  padding: 0;
  min-width: 0;
 }

 .tb-shop-buy__legend {
  display: block;
  margin: 0 0 10px;
  padding: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--site-heading);
 }

 .tb-shop-buy__choices {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
 }

 .tb-shop-buy__choice {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 80px;
  min-height: 44px;
  border: 1px solid var(--site-border);
  border-radius: var(--site-control-radius);
  padding: 8px 16px;
  background: var(--site-bg);
  color: var(--site-heading);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
 }

 .tb-shop-buy__choice input {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: inherit;
 }

 .tb-shop-buy__tick {
  display: none;
  width: 14px;
  height: 14px;
 }

 .tb-shop-buy__choice:has(input:checked) {
  border: 2px solid var(--site-accent);
  padding: 7px 15px;
  background: color-mix(in srgb, var(--site-accent) 8%, var(--site-bg));
 }

 .tb-shop-buy__choice:has(input:checked) .tb-shop-buy__tick {
  display: block;
 }

 .tb-shop-buy__choice:has(input:focus-visible) {
  outline: 2px solid var(--site-accent);
  outline-offset: 2px;
 }

 .tb-shop-buy__choice.is-sold {
  border-style: dashed;
  color: var(--site-muted);
  cursor: default;
 }

 .tb-shop-buy__sold {
  font-size: 12.5px;
  color: var(--site-heading);
 }

 .tb-shop-buy__select {
  width: 100%;
  max-width: 320px;
  min-height: 44px;
  border: 1px solid var(--site-border);
  border-radius: var(--site-control-radius);
  padding: 8px 12px;
  background: var(--site-bg);
  color: var(--site-heading);
  font: inherit;
  font-weight: 700;
 }

 .tb-shop-buy__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
 }

 .tb-shop-buy__button {
  justify-content: center;
  min-height: 44px;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
 }

 .tb-shop-buy__button:disabled {
  border-color: transparent;
  background: color-mix(in srgb, var(--site-muted) 18%, var(--site-bg));
  color: var(--site-body);
  cursor: default;
 }

 .tb-shop-buy__button[aria-disabled='true'] {
  background: var(--site-heading);
  color: var(--site-bg);
 }

 .tb-shop-buy--wide .tb-shop-buy__row,
 .tb-shop-buy--wide .tb-shop-buy__button {
  width: 100%;
 }

 .tb-shop-buy__spinner {
  width: 18px;
  height: 18px;
  stroke-dasharray: 36 14;
  animation: tb-shop-spin 900ms linear infinite;
 }

 @keyframes tb-shop-spin {
  to {
   transform: rotate(360deg);
  }
 }

 .tb-shop-buy__secure {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 14px;
  color: var(--site-body);
 }

 .tb-shop-buy__secure svg {
  width: 14px;
  height: 14px;
 }

 .tb-shop-buy__status {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
 }

 @media (prefers-reduced-motion: reduce) {
  .tb-shop-buy__spinner {
   animation: none;
  }
 }

 @media (max-width: 720px) {
  .tb-shop-buy__choices {
   display: grid;
   grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  }

  .tb-shop-buy__row,
  .tb-shop-buy__button {
   width: 100%;
  }

  .tb-shop-buy__row {
   justify-content: center;
  }
 }
</style>
