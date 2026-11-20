<script setup>
 // Columns that each hold blocks (docs/sub-blocks.md). The Split draws its
 // children through TbSplitColumn, each told it sits in a column so it draws
 // compact: no band or line of its own, stacked rather than side by side.
 // Two to four columns by `ratio`; below 860px every split is one column, in
 // the order `phone_first` says. Between 860px and 1100px the 25 / 75 splits
 // become 33 / 67, so a column never drops much under 240px.
 const props = defineProps({ data: { type: Object, required: true } });
 const count = computed(() => splitColumns(props.data.ratio));
 // Exactly as many columns as the ratio has: a short list is padded, a long
 // one cut (the studio moves the blocks of a column that goes).
 const columns = computed(() => Array.from({ length: count.value }, (_, index) => props.data.columns[index] ?? []));
</script>

<template>
 <section class="tb-section tb-split" :class="[`tb-split--${data.ratio}`, `tb-split--gap-${data.gap}`, `tb-split--align-${data.align}`, `tb-split--phone-${data.phone_first}`]">
  <div class="tb-wrap">
   <div class="tb-split__grid">
    <TbSplitColumn v-for="(blocks, index) in columns" :key="index" :blocks="blocks" :index="index" :place="splitWide(data.ratio, index) ? 'column-wide' : 'column'" />
   </div>
  </div>
 </section>
</template>

<style>
 .tb-split {
  --tb-split-gap: clamp(20px, 3vw, 40px);
 }

 .tb-split--gap-tight {
  --tb-split-gap: clamp(12px, 1.6vw, 20px);
 }

 .tb-split--gap-roomy {
  --tb-split-gap: clamp(32px, 5vw, 72px);
 }

 .tb-split__grid {
  display: grid;
  gap: var(--tb-split-gap);
  align-items: start;
 }

 .tb-split--align-middle .tb-split__grid {
  align-items: center;
 }

 .tb-split--align-bottom .tb-split__grid {
  align-items: end;
 }

 .tb-split--halves .tb-split__grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
 }

 .tb-split--35-65 .tb-split__grid {
  grid-template-columns: minmax(0, 35fr) minmax(0, 65fr);
 }

 .tb-split--65-35 .tb-split__grid {
  grid-template-columns: minmax(0, 65fr) minmax(0, 35fr);
 }

 .tb-split--25-75 .tb-split__grid {
  grid-template-columns: minmax(0, 25fr) minmax(0, 75fr);
 }

 .tb-split--75-25 .tb-split__grid {
  grid-template-columns: minmax(0, 75fr) minmax(0, 25fr);
 }

 .tb-split--thirds .tb-split__grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
 }

 .tb-split--quarters .tb-split__grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
 }

 /* A column holds its blocks one under another, and is a container its
    blocks can ask about (the narrowest ones stack a little further). */
 .tb-split__col {
  display: flex;
  flex-direction: column;
  gap: var(--tb-split-gap);
  min-width: 0;
  container: tb-col / inline-size;
 }

 /* 860 to 1100px: the 25 / 75 splits become 33 / 67. */
 @media (min-width: 861px) and (max-width: 1100px) {
  .tb-split--25-75 .tb-split__grid {
   grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  }

  .tb-split--75-25 .tb-split__grid {
   grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  }

  .tb-split--quarters .tb-split__grid {
   grid-template-columns: repeat(2, minmax(0, 1fr));
  }
 }

 /* Below 860px: one column, in the order the Split says. */
 @media (max-width: 860px) {
  .tb-split .tb-split__grid {
   display: flex;
   flex-direction: column;
  }

  .tb-split--phone-right .tb-split__grid {
   flex-direction: column-reverse;
  }
 }

 /* ── A block in a column ──
    It has no band, line or room of its own, and the page's measure doesn't
    apply: the column is its width. */
 .tb-split__col .tb-in-column.tb-section {
  padding-block: 0;
 }

 .tb-split__col .tb-in-column .tb-wrap,
 .tb-split__col .tb-in-column.tb-wrap {
  width: 100%;
  max-width: none;
  margin-inline: 0;
 }

 .tb-split__col .tb-in-column .tb-section__head {
  margin-inline: 0;
  text-align: left;
 }

 /* The compact form of each block that may go in a column. */
 .tb-split__col .tb-in-column .tb-text-image__inner {
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
 }

 .tb-split__col .tb-in-column .tb-text-image__image {
  order: 0;
  max-width: none;
 }

 .tb-split__col .tb-in-column .tb-media__image,
 .tb-split__col .tb-in-column .tb-media__stage {
  height: auto;
  border-radius: var(--site-radius);
 }

 .tb-split__col .tb-in-column .tb-media__stage {
  aspect-ratio: 16 / 9;
 }

 .tb-split__col .tb-in-column .tb-cards__list:not(.tb-slider) {
  grid-template-columns: minmax(0, 1fr);
 }

 .tb-split__col .tb-in-column--wide .tb-cards__list:not(.tb-slider) {
  grid-template-columns: repeat(2, minmax(0, 1fr));
 }

 .tb-split__col .tb-in-column .tb-quotes__list {
  grid-template-columns: minmax(0, 1fr);
 }

 .tb-split__col .tb-in-column.tb-quotes--several .tb-quotes__item:last-child:nth-child(odd) {
  width: auto;
 }

 .tb-split__col .tb-in-column.tb-faq--two:not(.tb-faq--topics) .tb-faq__list {
  columns: 1;
 }

 .tb-split__col .tb-in-column.tb-faq--two.tb-faq--topics .tb-faq__groups {
  grid-template-columns: minmax(0, 1fr);
 }

 .tb-split__col .tb-in-column .tb-stats__list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  max-width: none;
 }

 .tb-split__col .tb-in-column .tb-stats__list--1 {
  grid-template-columns: minmax(0, 1fr);
 }

 @container tb-col (max-width: 280px) {
  .tb-split__col .tb-in-column .tb-stats__list {
   grid-template-columns: minmax(0, 1fr);
  }
 }

 .tb-split__col .tb-in-column .tb-form__split {
  grid-template-columns: minmax(0, 1fr);
 }

 .tb-split__col .tb-in-column .tb-form__field {
  grid-column: 1 / -1;
 }

 .tb-split__col .tb-in-column .tb-visit__inner {
  grid-template-columns: minmax(0, 1fr);
 }

 /* A call to action is a card here, not a band. */
 .tb-split__col .tb-in-column.tb-cta {
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
  padding: clamp(20px, 3cqw, 32px);
 }

 .tb-split__col .tb-in-column.tb-cta:not(.tb-cta--deep) {
  background: var(--site-surface);
 }

 .tb-split__col .tb-in-column.tb-cta--band .tb-cta__inner {
  display: block;
 }

 /* Wide columns only: one plan to a row, two photos or people across. */
 .tb-split__col .tb-in-column .tb-pricing__tiers {
  grid-template-columns: minmax(0, 1fr);
 }

 .tb-split__col .tb-in-column .tb-gallery__grid {
  --tb-gallery-columns: 2;
 }

 .tb-split__col .tb-in-column .tb-people__list:not(.tb-slider) {
  --tb-people-across: 2;
 }

 /* ── In the studio's canvas: the drop zone ── */
 .tb-split__drop {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 120px;
  border: 1.5px dashed #b9c9b3;
  border-radius: 10px;
  padding: 16px;
  font: 600 13px/1.3 'Public Sans', system-ui, sans-serif;
  color: #5c6b5f;
  zoom: var(--tb-ui, 1);
 }

 .tb-split__col.is-over {
  outline: calc(2px * var(--tb-ui, 1)) dashed #2f6b4f;
  outline-offset: calc(6px * var(--tb-ui, 1));
 }

 .tb-split__col.is-over .tb-split__drop {
  border-color: #2f6b4f;
  background: rgb(47 107 79 / 0.08);
  color: #254832;
 }

 .tb-split__col.is-refused {
  position: relative;
  outline: calc(2px * var(--tb-ui, 1)) dashed #b3402a;
  outline-offset: calc(6px * var(--tb-ui, 1));
 }

 .tb-split__refusal {
  position: absolute;
  inset-inline: 8px;
  top: 8px;
  z-index: 6;
  margin: 0;
  border-radius: 8px;
  padding: 6px 10px;
  background: #b3402a;
  font: 600 12px/1.3 'Public Sans', system-ui, sans-serif;
  color: #fff;
  zoom: var(--tb-ui, 1);
 }
</style>
