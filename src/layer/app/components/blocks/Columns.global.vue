<script setup>
 // Two to four cards side by side under an optional heading. Steps number
 // the cards in a badge (the eyebrow, or the card's place in line when it's
 // empty); Plain shows the eyebrow as a small label over the title; Links
 // turns each card that has an address into a link, with an arrow by its
 // title.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 // While the page is being edited in the studio's canvas, a card's words
 // stay clickable for typing, so its link doesn't stretch over the card.
 const canvas = useCanvas();
 const typing = computed(() => Boolean(canvas) && canvas.editable?.value !== false);

 const steps = computed(() => props.data.style === 'steps');
 const across = computed(() => Math.max(1, Math.min(4, props.data.items.length)));
 const hrefs = computed(() => props.data.items.map((item) => (props.data.style === 'links' ? safeHref(item.to) : undefined)));
</script>

<template>
 <section class="tb-section tb-columns" :class="`tb-columns--${data.style}`">
  <div class="tb-wrap">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline) || shows('intro', data.intro)" class="tb-section__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
    <TbRich v-if="shows('intro', data.intro)" :data="data" field="intro" class="tb-lede" />
   </header>
   <component :is="steps ? 'ol' : 'ul'" v-if="data.items.length" class="tb-columns__grid" :class="`tb-columns__grid--${across}`" role="list">
    <li
     v-for="(item, index) in data.items"
     :key="index"
     class="tb-card tb-columns__card"
     :class="{ 'tb-columns__card--link': hrefs[index], 'tb-columns__card--stretched': hrefs[index] && !typing }"
    >
     <template v-if="steps">
      <TbText v-if="shows(`items.${index}.eyebrow`, item.eyebrow)" :data="data" :field="`items.${index}.eyebrow`" class="tb-card__badge" />
      <span v-else class="tb-card__badge" aria-hidden="true">{{ index + 1 }}</span>
     </template>
     <TbText v-else-if="shows(`items.${index}.eyebrow`, item.eyebrow)" :data="data" :field="`items.${index}.eyebrow`" tag="p" class="tb-eyebrow tb-columns__label" />
     <h3 v-if="hrefs[index]" class="tb-card__title">
      <a :href="hrefs[index]" class="tb-columns__link">
       <TbText :data="data" :field="`items.${index}.title`" />
       <span class="tb-columns__arrow" aria-hidden="true">→</span>
      </a>
     </h3>
     <TbText v-else :data="data" :field="`items.${index}.title`" tag="h3" class="tb-card__title" />
     <TbRich v-if="shows(`items.${index}.body`, item.body)" :data="data" :field="`items.${index}.body`" class="tb-card__body" />
    </li>
   </component>
  </div>
 </section>
</template>

<style>
 .tb-columns__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(14px, 1.8vw, 20px);
  margin: 0;
  padding: 0;
  list-style: none;
 }

 /* One card on its own stays card-sized rather than spanning the page. */
 .tb-columns__grid--1 {
  grid-template-columns: minmax(0, 1fr);
  max-width: 560px;
  margin-inline: auto;
 }

 .tb-columns__grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
 }

 .tb-columns__grid--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
 }

 .tb-columns .tb-columns__card {
  padding: clamp(20px, 2.2vw, 24px);
  overflow-wrap: break-word;
 }

 /* Steps: the number (or the eyebrow) in a soft square of the brand color. */
 .tb-columns .tb-card__badge {
  display: flex;
  width: max-content;
  min-width: 36px;
  height: 36px;
  border-radius: 9px;
  font-size: 16px;
  line-height: 1;
 }

 /* Plain and Links: the eyebrow as a small label over the title. */
 .tb-columns .tb-columns__label {
  margin: 0 0 10px;
  font-size: 11.5px;
  letter-spacing: 0.1em;
 }

 .tb-columns .tb-card__title {
  margin: 14px 0 0;
  font-size: clamp(17px, 0.4vw + 15px, 19px);
  font-weight: 700;
  line-height: 1.25;
 }

 .tb-columns .tb-card__title:first-child,
 .tb-columns .tb-columns__label + .tb-card__title {
  margin-top: 0;
 }

 .tb-columns .tb-card__body {
  margin-top: 6px;
  font-size: 15px;
  line-height: 1.55;
 }

 /* Links: the title carries the link, with an arrow after it. */
 .tb-columns__link {
  color: inherit;
  text-decoration: none;
 }

 .tb-columns__link:focus-visible {
  border-radius: 4px;
  outline: 2px solid var(--site-accent);
  outline-offset: 3px;
 }

 .tb-columns__arrow {
  display: inline-block;
  margin-left: 0.4em;
  color: var(--site-accent);
  transition: transform 120ms ease;
 }

 .tb-columns__card--link:hover .tb-columns__arrow {
  transform: translateX(3px);
 }

 /* On the site the whole card follows the link and lifts under the pointer;
    links inside its text sit above it, so they still work on their own. */
 .tb-columns__card--stretched {
  position: relative;
  transition:
   transform 120ms ease,
   box-shadow 120ms ease,
   border-color 120ms ease;
 }

 .tb-columns .tb-columns__card--stretched:hover {
  border-color: var(--site-accent);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--site-heading) 10%, transparent);
  transform: translateY(-1px);
 }

 .tb-columns__card--stretched .tb-columns__link::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--site-radius);
 }

 .tb-columns__card--stretched .tb-columns__link:focus-visible {
  outline: 0;
 }

 .tb-columns__card--stretched .tb-columns__link:focus-visible::after {
  outline: 2px solid var(--site-accent);
  outline-offset: 3px;
 }

 .tb-columns__card--stretched .tb-rich a {
  position: relative;
  z-index: 1;
 }

 @media (prefers-reduced-motion: reduce) {
  .tb-columns__card--stretched,
  .tb-columns__arrow {
   transition: none;
  }

  .tb-columns .tb-columns__card--stretched:hover,
  .tb-columns__card--link:hover .tb-columns__arrow {
   transform: none;
  }
 }

 /* Narrower screens: four cards go two by two, then everything stacks. */
 @media (max-width: 960px) {
  .tb-columns__grid--4 {
   grid-template-columns: repeat(2, minmax(0, 1fr));
  }
 }

 /* Smaller screens: a step's badge moves beside its title, so the cards
    stay short. */
 @media (max-width: 760px) {
  .tb-columns__grid--3 {
   grid-template-columns: minmax(0, 1fr);
  }

  .tb-columns--steps .tb-columns__card {
   display: grid;
   grid-template-columns: auto minmax(0, 1fr);
   column-gap: 14px;
  }

  .tb-columns--steps .tb-card__badge {
   grid-row: 1;
  }

  .tb-columns--steps .tb-card__title {
   grid-row: 1;
   grid-column: 2;
   align-self: center;
   margin-top: 0;
  }

  .tb-columns--steps .tb-card__body {
   grid-column: 2;
  }
 }

 /* Phones: one card per row. */
 @media (max-width: 540px) {
  .tb-columns__grid--2,
  .tb-columns__grid--4 {
   grid-template-columns: minmax(0, 1fr);
  }
 }
</style>
