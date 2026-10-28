<script setup>
 // What's coming up, one event to a row between rules: the date in small
 // capitals on the left, the name and its details beside it, and an RSVP
 // button on the right when the event links somewhere. An event with no
 // date keeps the date's column, empty, so its name lines up with the rest.
 // Phones put the date over the name.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 const hrefs = computed(() => props.data.items.map((item) => safeHref(item.to)));
</script>

<template>
 <section class="tb-section tb-events">
  <div class="tb-wrap tb-wrap--narrow">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head tb-section__head--start">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <ul v-if="data.items.length" class="tb-events__list" role="list">
    <li v-for="(item, index) in data.items" :key="index" class="tb-events__item">
     <TbText v-if="shows(`items.${index}.eyebrow`, item.eyebrow)" :data="data" :field="`items.${index}.eyebrow`" tag="p" class="tb-events__date" />
     <span v-else class="tb-events__date" aria-hidden="true"></span>
     <div class="tb-events__text">
      <TbText :data="data" :field="`items.${index}.title`" tag="h3" class="tb-events__title" />
      <TbRich v-if="shows(`items.${index}.body`, item.body)" :data="data" :field="`items.${index}.body`" class="tb-events__details" />
     </div>
     <a v-if="hrefs[index]" :href="hrefs[index]" class="tb-events__rsvp" :aria-label="item.title ? `RSVP for ${item.title}` : undefined">RSVP</a>
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 .tb-events .tb-section__head {
  margin-bottom: clamp(18px, 2vw, 22px);
 }

 .tb-events__list {
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-events__item {
  display: flex;
  align-items: center;
  gap: clamp(14px, 2vw, 20px);
  border-top: 1px solid var(--site-border);
  padding: clamp(14px, 1.6vw, 17px) 0;
 }

 .tb-events__date {
  flex: none;
  width: 8.75em;
  margin: 0;
  font-family: var(--site-font-mono);
  font-size: 13px;
  letter-spacing: 0.04em;
  line-height: 1.35;
  text-transform: uppercase;
  color: var(--site-eyebrow);
  overflow-wrap: break-word;
 }

 .tb-events__text {
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: break-word;
 }

 .tb-events__title {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: clamp(17px, 0.4vw + 15px, 19px);
  font-weight: 700;
  line-height: 1.3;
  color: var(--site-heading);
 }

 .tb-events__details {
  margin-top: 3px;
  font-size: 15px;
  line-height: 1.5;
  color: var(--site-body);
 }

 /* RSVP: an outlined pill in the brand color, filled softly under the pointer. */
 .tb-events__rsvp {
  flex: none;
  border: 1.5px solid color-mix(in srgb, var(--site-accent) 30%, transparent);
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--site-accent);
  text-decoration: none;
  transition:
   border-color 120ms ease,
   background-color 120ms ease;
 }

 .tb-events__rsvp:hover {
  border-color: var(--site-accent);
  background: color-mix(in srgb, var(--site-accent) 8%, transparent);
 }

 .tb-events__rsvp:focus-visible {
  outline: 2px solid var(--site-accent);
  outline-offset: 2px;
 }

 @media (prefers-reduced-motion: reduce) {
  .tb-events__rsvp {
   transition: none;
  }
 }

 /* Phones: the date on a line of its own over the name, the button beside
    the name. */
 @media (max-width: 560px) {
  .tb-events__item {
   flex-wrap: wrap;
   row-gap: 4px;
  }

  .tb-events__date {
   width: 100%;
  }

  .tb-events__date:empty {
   display: none;
  }
 }
</style>
