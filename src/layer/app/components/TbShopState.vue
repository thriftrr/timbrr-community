<script setup>
 // What a shop block says instead of products. `down`: the store didn't
 // answer (the buyer sees it too), one row, linking to the shop's own web
 // address when it has one. Otherwise an editor-only note on the studio's
 // canvas, `title` and `text`; the blocks never draw one on the live site.
 const props = defineProps({
  down: { type: Boolean, default: false },
  shopUrl: { type: String, default: null },
  title: { type: String, default: '' },
  text: { type: String, default: '' },
 });
 const host = computed(() => {
  try {
   return props.shopUrl ? new URL(props.shopUrl).host : '';
  } catch {
   return '';
  }
 });
</script>

<template>
 <p v-if="down" class="tb-shop-down" role="status">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16v10H4zM3 10l2-6h14l2 6M10 20v-5h4v5" /></svg>
  <span>
   <strong>The shop isn't loading right now.</strong>
   Please try again in a minute<template v-if="host">, or buy at <a :href="shopUrl">{{ host }}</a></template>.
  </span>
 </p>
 <div v-else class="tb-shop-note">
  <p class="tb-shop-note__who">Only you can see this</p>
  <p class="tb-shop-note__title">{{ title }}</p>
  <p class="tb-shop-note__text">{{ text }}</p>
 </div>
</template>

<style>
 .tb-shop-down {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 0;
  border-block: 1px solid var(--site-border);
  padding: 16px 0;
  font-size: 15.5px;
  line-height: 1.5;
  color: var(--site-body);
 }

 .tb-shop-down svg {
  flex: none;
  width: 20px;
  height: 20px;
  margin-top: 1px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linejoin: round;
 }

 .tb-shop-down strong {
  color: var(--site-heading);
 }

 .tb-shop-down a {
  color: var(--site-accent);
  font-weight: 700;
 }

 /* The canvas only: a dashed card in the site's own colors. */
 .tb-shop-note {
  border: 1.5px dashed color-mix(in srgb, var(--site-accent) 45%, var(--site-border));
  border-radius: var(--site-radius);
  padding: 24px;
  background: color-mix(in srgb, var(--site-accent) 6%, var(--site-bg));
  text-align: center;
  color: var(--site-body);
 }

 .tb-shop-note p {
  margin: 0;
 }

 .tb-shop-note__who {
  font-size: 13px;
  font-weight: 700;
  color: var(--site-muted);
 }

 .tb-shop-note__title {
  margin-top: 6px !important;
  font-family: var(--site-font-display);
  font-size: 19px;
  font-weight: 700;
  color: var(--site-heading);
 }

 .tb-shop-note__text {
  margin-top: 6px !important;
  font-size: 14.5px;
 }
</style>
