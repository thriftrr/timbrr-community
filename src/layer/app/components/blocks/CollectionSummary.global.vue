<script setup>
 // An entry's facts and button as a card (blocks/collection_summary.js). On a
 // phone it is a bar fixed to the bottom of the screen (the price, the places
 // left and the button) with the rows left in the page; on the canvas it stays
 // a card, since a fixed bar would cover what's being edited. A row whose
 // words aren't there (a token that came out empty) isn't drawn.
 const props = defineProps({ data: { type: Object, required: true } });
 const canvas = useCanvas();

 const rows = computed(() =>
  (props.data.items ?? [])
   .map((item, index) => ({ index, item, text: String(item.text ?? '').trim() }))
   .filter((row) => row.text),
 );
 // The places row: a number reads "8 places left"; anything else is its own words.
 const places = computed(() => {
  const row = rows.value.find((one) => one.item.places);
  const counted = row ? placesWords(row.text) : null;
  return row ? { row, words: counted?.words ?? row.text, full: Boolean(counted?.full) } : null;
 });
 const price = computed(() => {
  const text = String(props.data.price ?? '').trim();
  return text ? { before: props.data.price_before, text, after: props.data.price_after } : null;
 });
 const to = computed(() => safeHref(entryHref(props.data.button_to)));
 const button = computed(() => props.data.button && to.value && !places.value?.full);
 const bar = computed(() => price.value || places.value || button.value);
 const sticky = computed(() => props.data.sticky && !canvas);
</script>

<template>
 <aside class="tb-section tb-summary" :class="{ 'tb-summary--sticky': sticky, 'tb-summary--full': places?.full }" aria-label="At a glance">
  <div class="tb-wrap">
   <div class="tb-summary__card">
    <p v-if="places?.full && data.full_note" class="tb-summary__full-note">{{ data.full_note }}</p>
    <div v-if="bar" class="tb-summary__bar">
     <div class="tb-summary__price">
      <p v-if="price" class="tb-summary__figure">
       <span v-if="price.before">{{ price.before }}</span>{{ price.text }}<small v-if="price.after">{{ price.after }}</small>
      </p>
      <p v-if="places" class="tb-summary__places" :class="{ 'tb-summary__places--full': places.full }">{{ places.words }}</p>
     </div>
     <a v-if="button" :href="to" class="tb-button tb-button--solid tb-summary__button">{{ data.button }}</a>
    </div>
    <ul v-if="rows.length" class="tb-summary__rows" role="list">
     <li v-for="row in rows" :key="row.index" class="tb-summary__row" :class="{ 'tb-summary__row--places': row.item.places }">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path v-for="d in ENTRY_ICONS[row.item.icon]" :key="d" :d="d" /></svg>
      <span :class="{ 'tb-summary__words--full': places?.full && row.item.places }">{{ row.item.places ? places.words : row.text }}</span>
     </li>
    </ul>
    <p v-if="data.note" class="tb-summary__note">{{ data.note }}</p>
   </div>
  </div>
 </aside>
</template>

<style>
 .tb-summary__card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--site-border);
  border-radius: calc(var(--site-radius) * 1.3);
  padding: 22px 24px 24px;
  background: var(--site-bg);
 }

 /* The bar's two halves sit in the card as its price at the top and its button below the rows. */
 .tb-summary__bar {
  display: contents;
 }

 .tb-summary__price {
  order: 1;
  margin-bottom: 14px;
 }

 .tb-summary__figure {
  display: flex;
  align-items: baseline;
  margin: 0;
  font-family: var(--site-font-display);
  font-size: 34px;
  font-weight: var(--site-heading-weight);
  line-height: 1.1;
  color: var(--site-heading);
 }

 .tb-summary__figure small {
  margin-left: 6px;
  font-family: var(--site-font-body);
  font-size: 15px;
  font-weight: 400;
  color: var(--site-muted);
 }

 .tb-summary__places {
  display: none;
  margin: 2px 0 0;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--site-heading);
 }

 .tb-summary__places--full,
 .tb-summary__words--full {
  color: color-mix(in srgb, #a3352b 80%, var(--site-heading));
 }

 .tb-summary__full-note {
  order: 0;
  margin: 0 0 14px;
  border-radius: var(--site-control-radius);
  padding: 12px 14px;
  background: color-mix(in srgb, #a3352b 10%, var(--site-bg));
  font-size: 15px;
  color: var(--site-heading);
 }

 .tb-summary__rows {
  order: 2;
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-summary__row {
  display: flex;
  align-items: center;
  gap: 12px;
  border-top: 1px solid var(--site-border);
  padding-block: 13px;
  font-size: 15.5px;
  font-weight: 600;
  color: var(--site-heading);
 }

 .tb-summary__row svg {
  flex: none;
  color: var(--site-accent);
 }

 .tb-summary__row:last-child {
  border-bottom: 1px solid var(--site-border);
 }

 .tb-summary__button {
  order: 3;
  justify-content: center;
  margin-top: 20px;
  border-radius: 999px;
  padding-block: 15px;
  font-size: 16px;
 }

 .tb-summary__note {
  order: 4;
  margin: 12px 0 0;
  text-align: center;
  font-size: 13.5px;
  color: var(--site-muted);
 }

 /* A phone: the card goes, the bar is fixed to the bottom, the rows stay in the page. */
 @media (max-width: 719px) {
  .tb-summary--sticky .tb-summary__card {
   display: block;
   border: 0;
   padding: 0;
   background: transparent;
  }

  .tb-summary--sticky .tb-summary__bar {
   position: fixed;
   inset: auto 0 0;
   z-index: 30;
   display: flex;
   align-items: center;
   justify-content: space-between;
   gap: 16px;
   border-top: 1px solid var(--site-border);
   padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
   background: var(--site-bg);
  }

  .tb-summary--sticky .tb-summary__price {
   margin: 0;
  }

  .tb-summary--sticky .tb-summary__figure {
   font-size: 22px;
  }

  .tb-summary--sticky .tb-summary__figure small {
   display: none;
  }

  .tb-summary--sticky .tb-summary__places {
   display: block;
  }

  .tb-summary--sticky .tb-summary__row--places {
   display: none;
  }

  .tb-summary--sticky .tb-summary__button {
   margin: 0;
   padding-inline: 32px;
  }

  .tb-summary--sticky .tb-summary__note {
   text-align: left;
  }

  .tb-summary--sticky .tb-summary__row:last-child {
   border-bottom-width: 1px;
  }

  body:has(.tb-summary--sticky) {
   padding-bottom: 76px;
  }
 }
</style>
