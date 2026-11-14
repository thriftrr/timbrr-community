<script setup>
 // The site's design system on one sheet: every brand color, each font at
 // the sizes the blocks set it, the buttons, a card, and all four section
 // backgrounds, drawn with the same classes and --site-* variables the
 // blocks use. The studio's Branding editor shows it beside its controls
 // (the canvas's `sheet: 'system'`), so a change shows everywhere it lands.
 // Nothing here is the site's content, and a new button style or token in
 // site.css belongs on this sheet too.
 const props = defineProps({
  brand: { type: Object, default: () => ({}) },
  accent: { type: String, default: '' },
 });

 const value = computed(() => normalizeBrand(props.brand));
 const fontOf = (role) => value.value.fonts?.[role.key] || role.fallback;
 const colorOf = (spec) => (spec.key === 'accent' ? props.accent : value.value.colors?.[spec.key]) || spec.fallback;
 const numberOf = (spec) => {
  const n = value.value[spec.key] ?? spec.fallback;
  return spec.key === 'controlRadius' && n >= spec.max ? 'Pill' : `${n}${spec.unit}`;
 };

 const LOOKS = [
  { key: 'plain', label: 'Page' },
  { key: 'soft', label: 'Soft' },
  { key: 'brand', label: 'Brand' },
  { key: 'dark', label: 'Dark' },
 ];
 const SAMPLE = 'Fair prices, friendly faces and the same good work every time.';
</script>

<template>
 <div class="tb-ds">
  <section class="tb-section tb-look--tight">
   <div class="tb-wrap">
    <p class="tb-eyebrow">Design system</p>
    <h1 class="tb-hero__headline tb-ds__hero">Everything this site is made of</h1>
    <p class="tb-lede">Colors, type, buttons and the shapes of things, as the site's blocks draw them.</p>
   </div>
  </section>

  <section class="tb-section tb-look--tight tb-look--divider">
   <div class="tb-wrap">
    <p class="tb-eyebrow">Colors</p>
    <ul class="tb-ds__colors">
     <li v-for="spec in BRAND_COLORS" :key="spec.key" class="tb-ds__color">
      <span class="tb-ds__chip" :style="{ background: `var(${spec.variable})` }" />
      <strong>{{ spec.label }}</strong>
      <span class="tb-note tb-ds__meta">{{ colorOf(spec) || 'auto' }}</span>
     </li>
    </ul>
   </div>
  </section>

  <section class="tb-section tb-look--tight tb-look--divider">
   <div class="tb-wrap">
    <p class="tb-eyebrow">Type</p>
    <div class="tb-ds__type">
     <div v-for="role in BRAND_FONT_ROLES" :key="role.key" class="tb-ds__font">
      <p class="tb-note tb-ds__meta">{{ role.label }} · {{ fontOf(role) }}</p>
      <p class="tb-ds__glyphs" :style="{ fontFamily: `var(${role.variable})` }">Aa Bb Cc 0123</p>
     </div>
    </div>
    <div class="tb-ds__scale">
     <p class="tb-note tb-ds__meta">Hero headline</p>
     <p class="tb-hero__headline tb-ds__hero">Good work, done right</p>
     <p class="tb-note tb-ds__meta">Section heading</p>
     <h2 class="tb-heading">A heading over a section</h2>
     <p class="tb-note tb-ds__meta">Eyebrow</p>
     <p class="tb-eyebrow">The small line over a heading</p>
     <p class="tb-note tb-ds__meta">Lede</p>
     <p class="tb-lede tb-ds__flush">{{ SAMPLE }}</p>
     <p class="tb-note tb-ds__meta">Rich text</p>
     <div class="tb-rich">
      <h2>A heading in running text</h2>
      <p>{{ SAMPLE }} Call ahead, or just stop by and <a href="#">say hello</a>. <strong>Bold</strong> and <em>italic</em> sit in the same line.</p>
      <h3>A smaller heading</h3>
      <ul>
       <li>A list item</li>
       <li>And another</li>
      </ul>
      <blockquote>A quote someone said about the place.</blockquote>
     </div>
     <p class="tb-note tb-ds__meta">Note</p>
     <p class="tb-note tb-ds__flush">Small print and captions</p>
    </div>
   </div>
  </section>

  <section v-for="look in LOOKS" :key="look.key" class="tb-section tb-look--tight" :class="look.key === 'plain' ? 'tb-look--divider' : `tb-look--${look.key}`">
   <div class="tb-wrap">
    <p class="tb-eyebrow">{{ look.label }} background</p>
    <h2 class="tb-heading">Buttons, text and cards on {{ look.label.toLowerCase() }}</h2>
    <p class="tb-lede">{{ SAMPLE }}</p>
    <div class="tb-buttons">
     <a href="#" class="tb-button tb-button--solid">Solid button</a>
     <a href="#" class="tb-button tb-button--outline">Outline button</a>
    </div>
    <div class="tb-ds__cards">
     <div v-for="n in 2" :key="n" class="tb-card tb-ds__card">
      <span class="tb-card__badge">{{ n }}</span>
      <h3 class="tb-card__title">A card's title</h3>
      <p class="tb-card__body">What a card says, in a couple of lines of body copy.</p>
     </div>
    </div>
   </div>
  </section>

  <section class="tb-section tb-look--tight tb-look--divider">
   <div class="tb-wrap">
    <p class="tb-eyebrow">Shape and layout</p>
    <ul class="tb-ds__numbers">
     <li v-for="spec in BRAND_NUMBERS" :key="spec.key">
      <span>{{ spec.label }}</span>
      <span class="tb-note tb-ds__meta">{{ numberOf(spec) }}</span>
     </li>
    </ul>
    <div class="tb-ds__shapes">
     <div class="tb-ds__shape tb-ds__shape--corner"><span class="tb-note tb-ds__meta">Corners</span></div>
     <div class="tb-ds__shape tb-ds__shape--shadow"><span class="tb-note tb-ds__meta">Card shadow</span></div>
     <div class="tb-image tb-image--empty tb-ds__shape"><span class="tb-image__hint">A picture</span></div>
    </div>
    <p class="tb-note">This line is as wide as the page: {{ numberOf(BRAND_NUMBERS.find((spec) => spec.key === 'max')) }}</p>
    <div class="tb-ds__rule" />
   </div>
  </section>
 </div>
</template>

<style>
 .tb-ds .tb-ds__hero {
  font-size: calc(clamp(32px, 2.4vw + 18px, 48px) * var(--site-heading-scale));
  line-height: 1.08;
 }

 .tb-ds__meta {
  margin: 0;
 }

 .tb-ds__flush {
  margin-top: 0;
 }

 .tb-ds__colors,
 .tb-ds__numbers {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-ds__color,
 .tb-ds__numbers li {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: var(--site-ink);
 }

 .tb-ds__chip {
  height: 64px;
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
 }

 .tb-ds__type {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
 }

 .tb-ds__glyphs {
  margin: 4px 0 0;
  font-size: 34px;
  line-height: 1.2;
  color: var(--site-heading);
 }

 .tb-ds__scale {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 28px;
 }

 .tb-ds__scale > .tb-ds__meta:not(:first-child) {
  margin-top: 18px;
 }

 .tb-ds__cards,
 .tb-ds__shapes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 26px;
 }

 .tb-ds__card {
  box-shadow: var(--site-shadow);
 }

 .tb-ds__shape {
  display: flex;
  align-items: flex-end;
  min-height: 110px;
  padding: 14px;
 }

 .tb-ds__shape--corner,
 .tb-ds__shape--shadow {
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
  background: var(--site-surface);
 }

 .tb-ds__shape--shadow {
  box-shadow: var(--site-shadow);
 }

 .tb-ds__rule {
  height: 6px;
  margin-top: 8px;
  border-radius: 3px;
  background: var(--site-accent);
 }
</style>
