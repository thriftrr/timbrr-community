<script setup>
 // One slide at a time: a picture, a title, a few words and a button, each
 // optional, with Previous and Next, a dot for every slide and a count
 // ("2 / 4"). The arrow keys move between slides when it has focus, and the
 // slide in view is announced as "2 of 4". It never moves on its own. A slide
 // with nothing in it isn't drawn; with one slide there is nothing to click
 // through, so the controls aren't either. All the slides are in the page,
 // the others hidden, so it reads the same without scripts.
 const props = defineProps({ data: { type: Object, required: true } });
 const canvas = useCanvas();
 const shows = useFieldShown();

 // The slides that say something, each with its place in the list, which is
 // what its fields are named by.
 const slides = computed(() =>
  props.data.items.flatMap((item, index) => {
   const has = Boolean(safeSrc(item.image.src)) || item.title.trim() || item.body.trim() || item.button_label.trim() || shows(`items.${index}.title`, item.title) || shows(`items.${index}.body`, item.body) || shows(`items.${index}.button_label`, item.button_label);
   return has ? [{ item, index, href: safeHref(item.button_to) }] : [];
  }),
 );
 const current = ref(0);
 const at = computed(() => Math.min(current.value, Math.max(0, slides.value.length - 1)));
 const many = computed(() => slides.value.length > 1);
 const total = computed(() => slides.value.length);

 function go(to) {
  if (total.value) current.value = (to + total.value) % total.value;
 }

 function onKey(event) {
  if (!many.value || event.target.closest?.('[contenteditable]')) return;
  const key = { ArrowLeft: at.value - 1, ArrowRight: at.value + 1, Home: 0, End: total.value - 1 }[event.key];
  if (key === undefined) return;
  event.preventDefault();
  go(key);
 }

 // The studio's canvas: a click that selects a field of a slide brings that
 // slide into view, so what's being edited is what's showing.
 watch(
  () => canvas?.active?.value,
  (field) => {
   const index = /^items\.(\d+)\./.exec(field?.field ?? '')?.[1];
   const place = slides.value.findIndex((slide) => slide.index === Number(index));
   if (field && place >= 0) current.value = place;
  },
 );
</script>

<template>
 <section class="tb-section tb-carousel" aria-roledescription="carousel" aria-label="Highlights">
  <div class="tb-wrap">
   <p v-if="!total && canvas" class="tb-carousel__empty">Add a slide in the panel on the right: a picture, a title, a few words, a button.</p>
   <div v-else-if="total" class="tb-carousel__frame" tabindex="0" @keydown="onKey">
    <div class="tb-carousel__slides" aria-live="polite" aria-atomic="true">
     <div
      v-for="(slide, place) in slides"
      :key="slide.index"
      class="tb-carousel__slide"
      :class="{ 'tb-carousel__slide--plain': !safeSrc(slide.item.image.src) }"
      role="group"
      aria-roledescription="slide"
      :aria-label="`${place + 1} of ${total}`"
      :hidden="place !== at"
     >
      <TbImage v-if="safeSrc(slide.item.image.src)" :image="slide.item.image" :field="`items.${slide.index}.image`" ratio="3 / 2" sizes="(min-width: 860px) 560px, 100vw" class="tb-carousel__image" />
      <div class="tb-carousel__text">
       <TbText v-if="shows(`items.${slide.index}.title`, slide.item.title)" :data="data" :field="`items.${slide.index}.title`" tag="h2" class="tb-heading tb-carousel__title" />
       <TbText v-if="shows(`items.${slide.index}.body`, slide.item.body)" :data="data" :field="`items.${slide.index}.body`" tag="p" class="tb-carousel__body" />
       <div v-if="shows(`items.${slide.index}.button_label`, slide.item.button_label) && (slide.href || canvas)" class="tb-buttons tb-carousel__buttons">
        <a :href="slide.href" class="tb-button tb-button--solid"><span class="tb-button__label"><TbText :data="data" :field="`items.${slide.index}.button_label`" /></span></a>
       </div>
      </div>
     </div>
    </div>
    <div v-if="many" class="tb-carousel__controls">
     <button type="button" class="tb-carousel__arrow" aria-label="Previous slide" @click="go(at - 1)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
     </button>
     <div class="tb-carousel__dots">
      <button v-for="(slide, place) in slides" :key="slide.index" type="button" class="tb-carousel__dot" :aria-label="`Show slide ${place + 1} of ${total}`" :aria-current="place === at ? 'true' : undefined" @click="go(place)"></button>
     </div>
     <span class="tb-carousel__count" aria-hidden="true">{{ at + 1 }} / {{ total }}</span>
     <button type="button" class="tb-carousel__arrow" aria-label="Next slide" @click="go(at + 1)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
     </button>
    </div>
   </div>
  </div>
 </section>
</template>

<style>
 .tb-carousel__empty {
  margin: 0;
  border: 1.5px dashed var(--site-border);
  border-radius: var(--site-radius);
  padding: 28px 20px;
  text-align: center;
  color: var(--site-muted);
 }

 .tb-carousel__frame {
  border-radius: var(--site-radius);
 }

 .tb-carousel__frame:focus-visible {
  outline: 2px solid var(--site-accent);
  outline-offset: 6px;
 }

 .tb-carousel__slide {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: clamp(20px, 3vw, 40px);
  align-items: center;
  overflow-wrap: break-word;
 }

 .tb-carousel__slide[hidden] {
  display: none;
 }

 .tb-carousel__slide--plain {
  grid-template-columns: minmax(0, 1fr);
 }

 .tb-carousel__slide--plain .tb-carousel__text {
  max-width: 640px;
  margin-inline: auto;
  text-align: center;
 }

 .tb-carousel__slide--plain .tb-buttons {
  justify-content: center;
 }

 .tb-carousel .tb-carousel__image {
  width: 100%;
  border-radius: var(--site-radius);
 }

 .tb-carousel__title {
  font-size: calc(clamp(24px, 3vw, 32px) * var(--site-heading-scale));
 }

 .tb-carousel__body {
  margin: 12px 0 0;
  font-size: 17px;
  line-height: 1.55;
  color: var(--site-body);
 }

 .tb-carousel__buttons {
  margin-top: 22px;
 }

 .tb-carousel__controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 24px;
 }

 .tb-carousel__arrow {
  display: inline-grid;
  place-items: center;
  min-width: 24px;
  width: 40px;
  height: 40px;
  border: 1.5px solid var(--site-border);
  border-radius: var(--site-control-radius);
  padding: 0;
  background: transparent;
  color: var(--site-heading);
  cursor: pointer;
 }

 .tb-carousel__arrow:hover {
  border-color: var(--site-accent);
  color: var(--site-accent);
 }

 .tb-carousel__arrow svg {
  width: 20px;
  height: 20px;
 }

 .tb-carousel__dots {
  display: flex;
  align-items: center;
  gap: 4px;
 }

 /* The dot is small; its button is a comfortable target. */
 .tb-carousel__dot {
  position: relative;
  width: 24px;
  height: 24px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
 }

 .tb-carousel__dot::before {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: var(--site-border);
 }

 .tb-carousel__dot[aria-current='true']::before {
  background: var(--site-accent);
 }

 .tb-carousel__count {
  min-width: 3.2em;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  text-align: center;
  color: var(--site-muted);
 }

 /* A phone: the picture sits above the words. */
 @media (max-width: 720px) {
  .tb-carousel__slide {
   grid-template-columns: minmax(0, 1fr);
  }
 }
</style>
