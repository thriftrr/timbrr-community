<script setup>
 // One block of the made-up site, in its theme (the --s-* variables a
 // parent sets from THEME): what the page editor shows on its canvas and the
 // Branding room in its preview. `header` and `footer` are the site's frames.
 import { SITE, artSrc } from '../../utils/studio-demo/sample.js';

 defineProps({
  type: { type: String, required: true },
  data: { type: Object, default: () => ({}) },
  look: { type: Object, default: () => ({ background: 'page', above: 'normal', below: 'normal', divider: false }) },
 });
</script>

<template>
 <header v-if="type === 'header'" class="ss-header">
  <span class="ss-header__name">{{ SITE.name }}</span>
  <span class="ss-header__links" aria-hidden="true"><span>Services</span><span>Areas</span><span>About</span></span>
  <span class="ss-button ss-button--small">{{ data.button || 'Book a visit' }}</span>
 </header>
 <footer v-else-if="type === 'footer'" class="ss-footer">
  <span>{{ SITE.name }}</span>
  <span>Call {{ data.phone || SITE.phone }}</span>
 </footer>
 <section v-else class="ss-block" :class="`ss-${type}`" :data-bg="look.background" :data-above="look.above" :data-below="look.below" :data-line="look.divider ? 'on' : null">
  <div v-if="type === 'hero'" class="ss-split">
   <div>
    <h2 class="ss-title ss-title--big">{{ data.headline }}</h2>
    <p class="ss-lead">{{ data.lead }}</p>
    <span v-if="data.button" class="ss-button">{{ data.button }}</span>
   </div>
   <img class="ss-art" :src="artSrc(data.art)" alt="" />
  </div>
  <div v-else-if="type === 'text_image'" class="ss-split ss-split--flip">
   <img class="ss-art" :src="artSrc(data.art)" alt="" />
   <div>
    <h2 class="ss-title">{{ data.headline }}</h2>
    <p class="ss-lead">{{ data.body }}</p>
   </div>
  </div>
  <template v-else-if="type === 'gallery'">
   <h2 class="ss-title">{{ data.headline }}</h2>
   <div class="ss-grid">
    <img v-for="art in data.items" :key="art" class="ss-art ss-art--tile" :src="artSrc(art)" alt="" />
   </div>
  </template>
  <template v-else-if="type === 'cards'">
   <h2 class="ss-title">{{ data.headline }}</h2>
   <div class="ss-grid">
    <div v-for="(item, index) in data.items" :key="index" class="ss-card">
     <h3>{{ item.title }}</h3>
     <p>{{ item.body }}</p>
    </div>
   </div>
  </template>
  <figure v-else-if="type === 'quotes'" class="ss-quote">
   <blockquote>“{{ data.quote }}”</blockquote>
   <figcaption>
    <b>{{ data.name }}</b><template v-if="data.place"> · {{ data.place }}</template>
   </figcaption>
  </figure>
  <template v-else-if="type === 'faq'">
   <h2 class="ss-title">{{ data.headline }}</h2>
   <dl class="ss-faq">
    <div v-for="(item, index) in data.items" :key="index">
     <dt>{{ item.q }}</dt>
     <dd>{{ item.a }}</dd>
    </div>
   </dl>
  </template>
  <template v-else-if="type === 'stats'">
   <h2 class="ss-title">{{ data.headline }}</h2>
   <div class="ss-grid">
    <div v-for="(item, index) in data.items" :key="index" class="ss-stat">
     <span class="ss-stat__value">{{ item.value }}</span>
     <span>{{ item.label }}</span>
    </div>
   </div>
  </template>
  <template v-else-if="type === 'pricing'">
   <h2 class="ss-title">{{ data.headline }}</h2>
   <div class="ss-grid">
    <div v-for="(item, index) in data.items" :key="index" class="ss-card">
     <h3>{{ item.name }}</h3>
     <span class="ss-price">{{ item.price }}</span>
     <p>Priced before we start</p>
    </div>
   </div>
  </template>
  <div v-else-if="type === 'cta'" class="ss-center">
   <h2 class="ss-title">{{ data.headline }}</h2>
   <p class="ss-lead">{{ data.lead }}</p>
   <span v-if="data.button" class="ss-button">{{ data.button }}</span>
  </div>
 </section>
</template>

<style>
 /* The made-up site. Its colors and fonts are the --s-* variables, so the
    Branding room repaints all of it at once. */
 .ss-header {
  display: flex;
  align-items: center;
  gap: 18px;
  border-bottom: 1px solid color-mix(in srgb, var(--s-heading) 12%, var(--s-paper));
  padding: 14px 28px;
  background: var(--s-paper);
  font-family: var(--s-body-font);
 }

 .ss-header__name {
  margin-right: auto;
  font: 700 17px/1 var(--s-head-font);
  color: var(--s-heading);
  letter-spacing: -0.01em;
 }

 .ss-header__links {
  display: flex;
  gap: 18px;
  font-size: 13px;
  color: var(--s-text);
 }

 .ss-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 28px;
  background: var(--s-dark);
  font: 12.5px/1.4 var(--s-body-font);
  color: color-mix(in srgb, #fff 78%, var(--s-dark));
 }

 .ss-block {
  --ss-above: 52px;
  --ss-below: 52px;
  padding: var(--ss-above) 40px var(--ss-below);
  background: var(--s-paper);
  font-family: var(--s-body-font);
  color: var(--s-text);
 }

 .ss-block[data-above='tight'] {
  --ss-above: 28px;
 }

 .ss-block[data-above='roomy'] {
  --ss-above: 84px;
 }

 .ss-block[data-below='tight'] {
  --ss-below: 28px;
 }

 .ss-block[data-below='roomy'] {
  --ss-below: 84px;
 }

 .ss-block[data-bg='soft'] {
  background: var(--s-soft);
 }

 .ss-block[data-bg='brand'] {
  background: var(--s-brand);
  color: var(--s-brand-ink);
 }

 .ss-block[data-bg='dark'] {
  background: var(--s-dark);
  color: color-mix(in srgb, #fff 84%, var(--s-dark));
 }

 .ss-block[data-line='on'] {
  border-top: 1px solid color-mix(in srgb, var(--s-heading) 16%, transparent);
 }

 .ss-title {
  margin: 0;
  font: 700 28px/1.12 var(--s-head-font);
  letter-spacing: -0.015em;
  color: var(--s-heading);
  text-wrap: balance;
 }

 .ss-title--big {
  font-size: 31px;
  line-height: 1.08;
 }

 .ss-block:is([data-bg='brand'], [data-bg='dark']) :is(.ss-title, h3, .ss-stat__value, blockquote, dt, b) {
  color: inherit;
 }

 .ss-lead {
  max-width: 46ch;
  margin: 12px 0 0;
  font-size: 15.5px;
  line-height: 1.55;
 }

 .ss-button {
  display: inline-block;
  margin-top: 22px;
  border-radius: calc(var(--s-corners) * 0.8);
  padding: 11px 18px;
  background: var(--s-brand);
  font: 600 14px/1 var(--s-body-font);
  color: var(--s-brand-ink);
 }

 .ss-button--small {
  margin: 0;
  padding: 8px 12px;
  font-size: 12.5px;
 }

 .ss-block[data-bg='brand'] .ss-button {
  background: var(--s-brand-ink);
  color: var(--s-brand);
 }

 .ss-split {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  align-items: center;
  gap: 32px;
 }

 .ss-art {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--s-corners);
  object-fit: cover;
 }

 .ss-art--tile {
  aspect-ratio: 1;
 }

 .ss-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 22px;
 }

 .ss-card {
  border: 1px solid color-mix(in srgb, var(--s-heading) 12%, var(--s-paper));
  border-radius: var(--s-corners);
  padding: 16px;
  background: color-mix(in srgb, #fff 70%, var(--s-paper));
  color: var(--s-text);
 }

 .ss-card h3 {
  margin: 0;
  font: 600 16px/1.25 var(--s-head-font);
  color: var(--s-heading);
 }

 .ss-card p {
  margin: 6px 0 0;
  font-size: 13.5px;
  line-height: 1.5;
 }

 .ss-price {
  display: block;
  margin-top: 10px;
  font: 700 26px/1 var(--s-head-font);
  color: var(--s-heading);
 }

 .ss-quote {
  margin: 0;
 }

 .ss-quote blockquote {
  max-width: 30ch;
  margin: 0;
  font: 600 22px/1.35 var(--s-head-font);
  color: var(--s-heading);
  text-wrap: balance;
 }

 .ss-quote figcaption {
  margin-top: 14px;
  font-size: 13.5px;
 }

 .ss-faq {
  margin: 18px 0 0;
  border-top: 1px solid color-mix(in srgb, var(--s-heading) 14%, transparent);
 }

 .ss-faq > div {
  border-bottom: 1px solid color-mix(in srgb, var(--s-heading) 14%, transparent);
  padding: 12px 0;
 }

 .ss-faq dt {
  font: 600 15px/1.3 var(--s-head-font);
  color: var(--s-heading);
 }

 .ss-faq dd {
  margin: 4px 0 0;
  font-size: 13.5px;
 }

 .ss-stat {
  display: grid;
  gap: 6px;
  font-size: 13px;
 }

 .ss-stat__value {
  font: 700 34px/1 var(--s-head-font);
  color: var(--s-heading);
  font-variant-numeric: tabular-nums;
 }

 .ss-center {
  text-align: center;
 }

 .ss-center .ss-lead {
  margin-inline: auto;
 }

 @container ss (max-width: 520px) {
  .ss-block {
   padding-inline: 20px;
  }

  .ss-split,
  .ss-grid {
   grid-template-columns: 1fr;
  }

  .ss-split--flip .ss-art {
   order: 2;
  }

  .ss-title {
   font-size: 24px;
  }

  .ss-title--big {
   font-size: 27px;
  }

  .ss-header__links {
   display: none;
  }

  .ss-header {
   padding-inline: 18px;
  }
 }
</style>
