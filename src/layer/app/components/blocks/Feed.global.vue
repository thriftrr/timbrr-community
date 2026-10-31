<script setup>
 // The latest of something, one row each: its date or status, a title, a
 // line of details and a few words, and a link saying what to do next. Grid
 // and slider are cards, with a photo over the words for a row that has one.
 // List runs down one column between rules: the date on the left, the words
 // beside it, the link on the right. On the site the whole row follows its
 // link; in the studio's canvas its words stay clickable for typing instead.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 const canvas = useCanvas();
 const typing = computed(() => Boolean(canvas) && canvas.editable?.value !== false);

 // What the link on a row says, for each kind of row.
 const WORDS = { news: 'Read more', events: 'RSVP', jobs: 'Apply' };

 const list = computed(() => props.data.display === 'list');
 const slider = computed(() => props.data.display === 'slider');
 const word = computed(() => WORDS[props.data.source]);
 const hrefs = computed(() => props.data.items.map((item) => safeHref(item.to)));
 const photos = computed(() => props.data.items.map((item) => !list.value && Boolean(safeSrc(item.image.src))));
</script>

<template>
 <section class="tb-section tb-feed" :class="`tb-feed--${data.display}`">
  <div class="tb-wrap" :class="{ 'tb-wrap--narrow': list }">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head tb-section__head--start">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <ul v-if="data.items.length" class="tb-feed__list" :class="{ 'tb-slider': slider }" :tabindex="slider ? 0 : undefined" role="list">
    <li v-for="(item, index) in data.items" :key="index" class="tb-feed__item" :class="{ 'tb-card': !list, 'tb-feed__item--stretched': hrefs[index] && !typing }">
     <TbImage v-if="photos[index]" :image="item.image" ratio="3 / 2" sizes="(min-width: 720px) 360px, 100vw" class="tb-feed__image" />
     <TbText v-if="shows(`items.${index}.eyebrow`, item.eyebrow)" :data="data" :field="`items.${index}.eyebrow`" tag="p" class="tb-eyebrow tb-feed__eyebrow" />
     <span v-else-if="list" class="tb-feed__eyebrow" aria-hidden="true"></span>
     <div class="tb-feed__text">
      <TbText :data="data" :field="`items.${index}.title`" tag="h3" class="tb-feed__title" />
      <TbText v-if="shows(`items.${index}.meta`, item.meta)" :data="data" :field="`items.${index}.meta`" tag="p" class="tb-feed__meta" />
      <TbRich v-if="shows(`items.${index}.body`, item.body)" :data="data" :field="`items.${index}.body`" class="tb-feed__body" />
     </div>
     <a v-if="hrefs[index]" :href="hrefs[index]" class="tb-feed__action" :aria-label="item.title ? `${word}: ${item.title}` : undefined">
      {{ word }} <span class="tb-feed__arrow" aria-hidden="true">→</span>
     </a>
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 .tb-feed__list:not(.tb-slider) {
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-feed--grid .tb-feed__list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(14px, 1.8vw, 20px);
 }

 .tb-feed .tb-feed__item {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-wrap: break-word;
 }

 /* A photo runs to the card's edges. */
 .tb-feed .tb-card {
  overflow: hidden;
 }

 .tb-feed .tb-feed__image {
  width: calc(100% + 44px);
  max-width: none;
  margin: -22px -22px 16px;
  border-radius: 0;
 }

 .tb-feed .tb-feed__eyebrow {
  margin: 0 0 8px;
  font-size: 11.5px;
  letter-spacing: 0.1em;
 }

 .tb-feed__title {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: clamp(17px, 0.4vw + 15px, 19px);
  font-weight: 700;
  line-height: 1.3;
  color: var(--site-heading);
 }

 .tb-feed__meta {
  margin: 4px 0 0;
  font-size: 14.5px;
  line-height: 1.45;
  color: var(--site-muted);
 }

 .tb-feed__body {
  margin-top: 6px;
  font-size: 15px;
  line-height: 1.55;
  color: var(--site-body);
 }

 /* The link sits at the bottom of a card, so a row's links line up. */
 .tb-feed__action {
  margin-top: auto;
  padding-top: 14px;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--site-accent);
  text-decoration: none;
  white-space: nowrap;
 }

 .tb-feed__action:focus-visible {
  border-radius: 4px;
  outline: 2px solid var(--site-accent);
  outline-offset: 3px;
 }

 .tb-feed__arrow {
  display: inline-block;
  margin-left: 0.2em;
  transition: transform 120ms ease;
 }

 .tb-feed__item:hover .tb-feed__arrow {
  transform: translateX(3px);
 }

 /* On the site the whole row follows the link; links inside its words sit
    above it, so they still work on their own. */
 .tb-feed__item--stretched {
  position: relative;
 }

 .tb-feed__item--stretched .tb-feed__action::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--site-radius);
 }

 .tb-feed__item--stretched .tb-feed__action:focus-visible {
  outline: 0;
 }

 .tb-feed__item--stretched .tb-feed__action:focus-visible::after {
  outline: 2px solid var(--site-accent);
  outline-offset: -2px;
 }

 .tb-feed__item--stretched .tb-feed__body a {
  position: relative;
  z-index: 1;
 }

 .tb-feed .tb-card.tb-feed__item--stretched:hover {
  border-color: var(--site-accent);
 }

 /* List: date, words and link in a row, a rule between each. */
 .tb-feed--list .tb-feed__list {
  border-bottom: 1px solid var(--site-border);
 }

 .tb-feed--list .tb-feed__item {
  display: grid;
  grid-template-columns: minmax(0, 8.5em) minmax(0, 1fr) auto;
  gap: 4px clamp(16px, 2.4vw, 24px);
  align-items: baseline;
  border-top: 1px solid var(--site-border);
  padding: clamp(16px, 1.8vw, 20px) 0;
 }

 .tb-feed--list .tb-feed__eyebrow {
  margin: 0;
 }

 .tb-feed--list .tb-feed__action {
  margin: 0;
  padding: 0;
 }

 @media (prefers-reduced-motion: reduce) {
  .tb-feed__arrow {
   transition: none;
  }

  .tb-feed__item:hover .tb-feed__arrow {
   transform: none;
  }
 }

 /* Narrower screens: two across, then one, and a list's date moves over
    the words. */
 @media (max-width: 860px) {
  .tb-feed--grid .tb-feed__list {
   grid-template-columns: repeat(2, minmax(0, 1fr));
  }
 }

 @media (max-width: 560px) {
  .tb-feed--grid .tb-feed__list {
   grid-template-columns: minmax(0, 1fr);
  }

  .tb-feed--list .tb-feed__item {
   grid-template-columns: minmax(0, 1fr) auto;
  }

  .tb-feed--list .tb-feed__eyebrow {
   grid-column: 1 / -1;
  }

  .tb-feed--list span.tb-feed__eyebrow {
   display: none;
  }
 }
</style>
