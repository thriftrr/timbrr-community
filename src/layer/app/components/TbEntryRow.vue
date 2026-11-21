<script setup>
 // One entry of a Collection list drawn as a row (picture, date line, title, a
 // quiet line, a price, places left and a button) or as a person (a round
 // picture, name, a quiet line and a link). `keys` says which field each
 // part comes from (rowKeys, app/utils/collection-rows.js); a part whose
 // field the entry leaves empty isn't drawn. The title's link covers the
 // row, so the whole row opens the entry; the button is its own link.
 const props = defineProps({
  entry: { type: Object, required: true },
  keys: { type: Object, required: true },
  data: { type: Object, required: true },
  collection: { type: Object, default: null },
  person: { type: Boolean, default: false },
 });

 const field = (key) => (key ? props.entry.fields.find((one) => one.key === key) : undefined);
 const filled = (one) => one && one.value !== '' && one.value !== null && one.value !== undefined && !(Array.isArray(one.value) && !one.value.length);
 const picture = computed(() => {
  const one = field(props.keys.picture);
  return one?.kind === 'image' && one.value?.src ? one.value : null;
 });
 const when = computed(() => whenWords(field(props.keys.date)?.value, field(props.keys.end)?.value));
 const line = computed(() => props.keys.line.map(field).filter(filled));
 const price = computed(() => (filled(field(props.keys.price)) ? field(props.keys.price) : null));
 const places = computed(() => (props.keys.places ? placesWords(field(props.keys.places)?.value) : null));
 const to = computed(() => {
  const own = props.keys.link ? field(props.keys.link)?.value : '';
  return safeHref(typeof own === 'string' ? own : own?.url) || props.entry.path || '';
 });
 const label = computed(() => rowButtonWords(props.data.row_button, props.entry.title));
 // A full one has nothing to book; its title still opens it.
 const button = computed(() => label.value && to.value && !places.value?.full);
</script>

<template>
 <li class="tb-entry-row" :class="{ 'tb-entry-row--person': person, 'tb-entry-row--link': entry.path }">
  <div v-if="picture" class="tb-entry-row__picture" aria-hidden="true">
   <TbImage :image="picture" :ratio="person ? '1 / 1' : '3 / 2'" sizes="(min-width: 720px) 180px, 96px" />
  </div>
  <div class="tb-entry-row__words">
   <p v-if="when" class="tb-entry-row__when">{{ when }}</p>
   <h3 class="tb-entry-row__title">
    <NuxtLink v-if="entry.path" :to="entry.path">{{ entry.title }}</NuxtLink>
    <template v-else>{{ entry.title }}</template>
   </h3>
   <p v-if="line.length" class="tb-entry-row__line">
    <span v-for="one in line" :key="one.key"><TbFieldValue :field="one" :entry="entry" :collection="collection" brief /></span>
   </p>
   <a v-if="person && button" :href="to" class="tb-entry-row__more">
    {{ label }}
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path v-for="d in UI_ICONS.arrow" :key="d" :d="d" /></svg>
   </a>
  </div>
  <template v-if="!person">
   <p v-if="price" class="tb-entry-row__price"><TbFieldValue :field="price" :entry="entry" :collection="collection" brief /></p>
   <div v-if="places || button" class="tb-entry-row__act">
    <p v-if="places" class="tb-entry-row__places" :class="{ 'tb-entry-row__places--full': places.full }">{{ places.words }}</p>
    <a v-if="button" :href="to" class="tb-button tb-button--solid tb-entry-row__button">{{ label }}</a>
   </div>
  </template>
 </li>
</template>

<style>
 .tb-entry-row {
  position: relative;
  display: grid;
  grid-template-columns: 96px auto minmax(0, 1fr);
  grid-template-areas:
   'picture words words'
   'picture price act';
  align-items: start;
  gap: 4px 16px;
  border-bottom: 1px solid var(--site-border);
  padding-block: 14px;
 }

 .tb-entry-row:not(:has(.tb-entry-row__picture)) {
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas:
   'words words'
   'price act';
 }

 .tb-entry-row__picture {
  grid-area: picture;
 }

 .tb-entry-row__picture .tb-image {
  border-radius: calc(var(--site-radius) * 0.6);
 }

 .tb-entry-row__words {
  grid-area: words;
  min-width: 0;
 }

 .tb-entry-row__when {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 700;
  color: var(--site-accent);
 }

 .tb-entry-row__title {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: 18px;
  font-weight: var(--site-heading-weight);
  line-height: 1.25;
  color: var(--site-heading);
 }

 .tb-entry-row__title a {
  color: inherit;
  text-decoration: none;
 }

 .tb-entry-row__title a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
 }

 .tb-entry-row--link .tb-entry-row__title a::after {
  content: '';
  position: absolute;
  inset: 0;
 }

 .tb-entry-row__line {
  display: flex;
  flex-wrap: wrap;
  gap: 0 8px;
  margin: 3px 0 0;
  font-size: 13.5px;
  color: var(--site-muted);
 }

 .tb-entry-row__line span + span::before {
  content: '·';
  margin-right: 8px;
 }

 /* A teacher or a level is a link on its own; in a quiet line it reads as words. */
 .tb-entry-row .tb-field-value__link {
  position: relative;
  z-index: 1;
  color: inherit;
  text-decoration: none;
 }

 .tb-entry-row .tb-field-value__link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
 }

 .tb-entry-row__price {
  grid-area: price;
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 0;
  font-family: var(--site-font-display);
  font-size: 18px;
  font-weight: var(--site-heading-weight);
  color: var(--site-heading);
 }

 /* On a phone the price and the places share a line under the title. */
 .tb-entry-row__act {
  grid-area: act;
  display: flex;
  align-items: center;
  gap: 12px;
 }

 .tb-entry-row:not(:has(.tb-entry-row__price)) .tb-entry-row__act {
  grid-column: 2 / -1;
 }

 .tb-entry-row__places {
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--site-heading);
 }

 .tb-entry-row__places--full {
  color: color-mix(in srgb, #a3352b 80%, var(--site-heading));
 }

 .tb-entry-row__button {
  position: relative;
  z-index: 1;
  display: none;
  border-radius: 999px;
 }

 @media (min-width: 720px) {
  .tb-entry-row {
   grid-template-columns: 180px minmax(0, 1fr) 150px 190px;
   grid-template-areas: 'picture words price act';
   align-items: center;
   gap: 20px 24px;
   padding-block: 16px;
  }

  .tb-entry-row:not(:has(.tb-entry-row__picture)) {
   grid-template-columns: minmax(0, 1fr) 150px 190px;
   grid-template-areas: 'words price act';
  }

  .tb-entry-row__title {
   font-size: 22px;
  }

  .tb-entry-row__line {
   font-size: 15px;
   gap: 0 16px;
  }

  .tb-entry-row__line span + span::before {
   content: none;
  }

  .tb-entry-row__price {
   grid-area: price;
   justify-content: center;
   font-size: 22px;
  }

  .tb-entry-row:not(:has(.tb-entry-row__price)) .tb-entry-row__act {
   grid-column: auto;
  }

  .tb-entry-row__act {
   grid-area: act;
   flex-direction: column;
   align-items: flex-end;
   gap: 8px;
   justify-self: stretch;
  }

  .tb-entry-row__button {
   display: inline-flex;
   padding-inline: 26px;
  }
 }

 /* A person: a round picture, the name, a quiet line and a link. */
 .tb-entry-row--person {
  grid-template-columns: 72px minmax(0, 1fr);
  grid-template-areas: 'picture words';
  align-items: center;
  border-bottom: 0;
  padding-block: 6px;
 }

 .tb-entry-row--person:not(:has(.tb-entry-row__picture)) {
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: 'words';
 }

 .tb-entry-row--person .tb-entry-row__picture {
  width: 72px;
 }

 .tb-entry-row--person .tb-entry-row__picture .tb-image {
  border-radius: 50%;
 }

 .tb-entry-row--person .tb-entry-row__title {
  font-size: 20px;
 }

 .tb-entry-row--person .tb-entry-row__line {
  font-size: 15px;
 }

 .tb-entry-row__more {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 14px;
  font-weight: 700;
  color: var(--site-accent);
  text-decoration: none;
 }

 .tb-entry-row__more:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
 }

 @media (min-width: 720px) {
  .tb-entry-row--person {
   grid-template-columns: 72px minmax(0, 1fr);
   grid-template-areas: 'picture words';
   gap: 20px;
  }

  .tb-entry-row--person:not(:has(.tb-entry-row__picture)) {
   grid-template-columns: minmax(0, 1fr);
   grid-template-areas: 'words';
  }
 }
</style>
