<script setup>
 // Two to four cards across under an optional heading, or a row that slides
 // sideways. Every style is the same card with a different part leading:
 // Icon a small drawing, Image a photo across the top, Number a big numeral,
 // Steps a numbered badge, Price a tag beside the title. Badge drops the box
 // for a shield beside a few words, the way a row of promises reads. A card
 // with an address has its title link there, and on the site the whole card
 // follows it; in the studio's canvas its words stay clickable for typing
 // instead. Narrower screens take fewer across.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 const canvas = useCanvas();
 const typing = computed(() => Boolean(canvas) && canvas.editable?.value !== false);

 // Each icon as the paths that draw it, all stroke, so they take the
 // site's color.
 const ICONS = {
  check: ['M20 6 9 17l-5-5'],
  star: ['M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.1 6.6 20l1-6.1L3.2 9.5l6.1-.9z'],
  shield: ['M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z', 'M9 12l2 2 4-4'],
  heart: ['M12 20s-7.5-4.6-9-9.2C2 7.4 4.2 5 7 5c2 0 3.6 1 5 3 1.4-2 3-3 5-3 2.8 0 5 2.4 4 5.8C19.5 15.4 12 20 12 20z'],
  leaf: ['M6 18C4 10 10 4 20 4c0 10-6 16-14 14z', 'M6 18c2-4 5-7 9-9', 'M6 18l-2 3'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3.5 2'],
  pin: ['M12 22s-7-6-7-12a7 7 0 0114 0c0 6-7 12-7 12z', 'M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  phone: ['M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3z'],
  wrench: ['M14.5 6.5a4 4 0 0 1 5-1l-3 3 1.5 1.5 3-3a4 4 0 0 1-5.4 5L8 19.5a2 2 0 0 1-3-3l7-7a4 4 0 0 1 2.5-3z'],
  truck: ['M2 6h12v10H2z', 'M14 10h4l4 3v3h-8z', 'M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M17.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  calendar: ['M4 6h16v15H4z', 'M4 10h16', 'M8 3v4', 'M16 3v4'],
  chat: ['M4 5h16v11H9l-5 4z'],
 };

 const slider = computed(() => props.data.display === 'slider');
 const numbered = computed(() => props.data.style === 'steps' || props.data.style === 'number');
 const boxed = computed(() => props.data.style !== 'badge');
 // Fewer cards than columns share the row, and one on its own stays
 // card-sized rather than spanning the page.
 const across = computed(() => Math.max(1, Math.min(Number(props.data.columns), props.data.items.length)));
 const hrefs = computed(() => props.data.items.map((item) => safeHref(item.to)));

 // A step counts in order; a big numeral reads better with its zero.
 function numeral(index) {
  return props.data.style === 'number' ? String(index + 1).padStart(2, '0') : index + 1;
 }
</script>

<template>
 <section class="tb-section tb-cards" :class="`tb-cards--${data.style}`">
  <div class="tb-wrap">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline) || shows('intro', data.intro)" class="tb-section__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
    <TbRich v-if="shows('intro', data.intro)" :data="data" field="intro" class="tb-lede" />
   </header>
   <component
    :is="data.style === 'steps' ? 'ol' : 'ul'"
    v-if="data.items.length"
    class="tb-cards__list"
    :class="slider ? 'tb-slider' : `tb-cards__list--${across}`"
    :style="slider ? { '--tb-slider-across': data.columns } : undefined"
    :tabindex="slider ? 0 : undefined"
    role="list"
   >
    <li
     v-for="(item, index) in data.items"
     :key="index"
     class="tb-cards__card"
     :class="{ 'tb-card': boxed, 'tb-cards__card--link': hrefs[index], 'tb-cards__card--stretched': hrefs[index] && !typing }"
    >
     <TbImage v-if="data.style === 'image'" :image="item.image" ratio="3 / 2" sizes="(min-width: 720px) 400px, 100vw" class="tb-cards__image" />
     <span v-if="data.style === 'icon' || data.style === 'badge'" class="tb-cards__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
       <path v-for="(path, part) in ICONS[data.style === 'badge' ? 'shield' : item.icon]" :key="part" :d="path" />
      </svg>
     </span>
     <template v-if="numbered">
      <TbText v-if="shows(`items.${index}.eyebrow`, item.eyebrow)" :data="data" :field="`items.${index}.eyebrow`" class="tb-cards__number" />
      <span v-else class="tb-cards__number" aria-hidden="true">{{ numeral(index) }}</span>
     </template>
     <div class="tb-cards__text">
      <TbText v-if="!numbered && shows(`items.${index}.eyebrow`, item.eyebrow)" :data="data" :field="`items.${index}.eyebrow`" tag="p" class="tb-eyebrow tb-cards__label" />
      <h3 v-if="hrefs[index]" class="tb-card__title tb-cards__title">
       <a :href="hrefs[index]" class="tb-cards__link">
        <TbText :data="data" :field="`items.${index}.title`" />
        <span class="tb-cards__arrow" aria-hidden="true">→</span>
       </a>
      </h3>
      <TbText v-else :data="data" :field="`items.${index}.title`" tag="h3" class="tb-card__title tb-cards__title" />
      <TbRich v-if="shows(`items.${index}.body`, item.body)" :data="data" :field="`items.${index}.body`" class="tb-card__body tb-cards__body" />
     </div>
     <TbText v-if="shows(`items.${index}.price`, item.price)" :data="data" :field="`items.${index}.price`" tag="p" class="tb-cards__price" />
    </li>
   </component>
  </div>
 </section>
</template>

<style>
 .tb-cards__list:not(.tb-slider) {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(14px, 1.8vw, 20px);
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-cards__list--1:not(.tb-slider) {
  grid-template-columns: minmax(0, 1fr);
  max-width: 560px;
  margin-inline: auto;
 }

 .tb-cards__list--2:not(.tb-slider) {
  grid-template-columns: repeat(2, minmax(0, 1fr));
 }

 .tb-cards__list--4:not(.tb-slider) {
  grid-template-columns: repeat(4, minmax(0, 1fr));
 }

 .tb-cards .tb-cards__card {
  min-width: 0;
  padding: clamp(20px, 2.2vw, 24px);
  overflow-wrap: break-word;
 }

 .tb-cards .tb-cards__title {
  margin: 0;
  font-size: clamp(17px, 0.4vw + 15px, 19px);
  font-weight: 700;
  line-height: 1.25;
 }

 .tb-cards .tb-cards__body {
  margin-top: 6px;
  font-size: 15px;
  line-height: 1.55;
 }

 .tb-cards .tb-cards__label {
  margin: 0 0 10px;
  font-size: 11.5px;
  letter-spacing: 0.1em;
 }

 /* Icon: the drawing in a soft square of the brand color. */
 .tb-cards__icon {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  margin-bottom: 14px;
  border-radius: 9px;
  background: color-mix(in srgb, var(--site-accent) 10%, var(--site-bg));
  color: var(--site-accent);
 }

 /* Image: the photo runs to the card's edges. */
 .tb-cards--image .tb-cards__card {
  overflow: hidden;
 }

 .tb-cards .tb-cards__image {
  width: calc(100% + 2 * clamp(20px, 2.2vw, 24px));
  max-width: none;
  margin: calc(-1 * clamp(20px, 2.2vw, 24px)) calc(-1 * clamp(20px, 2.2vw, 24px)) 16px;
  border-radius: 0;
 }

 /* Number: a big numeral. Steps: the same number in a soft square. */
 .tb-cards__number {
  display: block;
  width: max-content;
  max-width: 100%;
  margin-bottom: 12px;
  font-family: var(--site-font-display);
  font-size: clamp(34px, 1.6vw + 26px, 44px);
  font-weight: 800;
  line-height: 1;
  color: var(--site-accent);
 }

 .tb-cards--steps .tb-cards__number {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  margin-bottom: 14px;
  border-radius: 9px;
  padding: 0 8px;
  background: color-mix(in srgb, var(--site-accent) 12%, var(--site-bg));
  font-size: 16px;
 }

 /* Badge: no box, a shield beside a few words. */
 .tb-cards--badge .tb-cards__card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 4px 0;
 }

 .tb-cards--badge .tb-cards__icon {
  margin-bottom: 0;
  border-radius: 50%;
 }

 .tb-cards--badge .tb-cards__body {
  margin-top: 2px;
  font-size: 14px;
  color: var(--site-muted);
 }

 /* A price: a small tag. Under the words, except in Price, where it sits on
    the card's right, beside the title. */
 .tb-cards__price {
  width: fit-content;
  max-width: 100%;
  margin: 12px 0 0;
  border-radius: 7px;
  padding: 4px 10px;
  background: color-mix(in srgb, var(--site-accent) 8%, var(--site-surface));
  font-family: var(--site-font-mono);
  font-size: 14px;
  font-weight: 600;
  font-synthesis: none;
  line-height: 1.3;
  color: var(--site-accent);
 }

 .tb-cards--price .tb-cards__card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
 }

 .tb-cards--price .tb-cards__text {
  flex: 1 1 auto;
  min-width: 0;
 }

 .tb-cards--price .tb-cards__price {
  flex: none;
  margin: 0;
 }

 /* A card with an address: the title carries the link, with an arrow. */
 .tb-cards__link {
  color: inherit;
  text-decoration: none;
 }

 .tb-cards__link:focus-visible {
  border-radius: 4px;
  outline: 2px solid var(--site-accent);
  outline-offset: 3px;
 }

 .tb-cards__arrow {
  display: inline-block;
  margin-left: 0.4em;
  color: var(--site-accent);
  transition: transform 120ms ease;
 }

 .tb-cards__card--link:hover .tb-cards__arrow {
  transform: translateX(3px);
 }

 /* On the site the whole card follows the link and lifts under the pointer;
    links inside its text sit above it, so they still work on their own. */
 .tb-cards__card--stretched {
  position: relative;
  transition:
   transform 120ms ease,
   box-shadow 120ms ease,
   border-color 120ms ease;
 }

 .tb-cards .tb-cards__card--stretched:hover {
  border-color: var(--site-accent);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--site-heading) 10%, transparent);
  transform: translateY(-1px);
 }

 .tb-cards__card--stretched .tb-cards__link::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--site-radius);
 }

 .tb-cards__card--stretched .tb-cards__link:focus-visible {
  outline: 0;
 }

 .tb-cards__card--stretched .tb-cards__link:focus-visible::after {
  outline: 2px solid var(--site-accent);
  outline-offset: 3px;
 }

 .tb-cards__card--stretched .tb-cards__body a {
  position: relative;
  z-index: 1;
 }

 @media (prefers-reduced-motion: reduce) {
  .tb-cards__card--stretched,
  .tb-cards__arrow {
   transition: none;
  }

  .tb-cards .tb-cards__card--stretched:hover,
  .tb-cards__card--link:hover .tb-cards__arrow {
   transform: none;
  }
 }

 /* Narrower screens: four cards go two by two, then everything stacks. */
 @media (max-width: 960px) {
  .tb-cards__list--4:not(.tb-slider) {
   grid-template-columns: repeat(2, minmax(0, 1fr));
  }
 }

 @media (max-width: 760px) {
  .tb-cards__list--3:not(.tb-slider) {
   grid-template-columns: minmax(0, 1fr);
  }
 }

 @media (max-width: 540px) {
  .tb-cards__list--2:not(.tb-slider),
  .tb-cards__list--4:not(.tb-slider) {
   grid-template-columns: minmax(0, 1fr);
  }

  .tb-cards--price .tb-cards__card {
   flex-wrap: wrap;
  }
 }
</style>
