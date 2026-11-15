<script setup>
 // Rows and columns under an optional heading. The first row can be the
 // column headings. A table wider than the screen scrolls sideways inside
 // its own box, which takes the keyboard so it can be scrolled without a
 // pointer; the page never scrolls sideways.
 const props = defineProps({ data: { type: Object, required: true } });
 const shows = useFieldShown();

 const cells = computed(() => ['c1', 'c2', 'c3', 'c4', 'c5'].slice(0, Number(props.data.columns)));
 const headed = computed(() => props.data.header && props.data.rows.length > 1);
 const body = computed(() => props.data.rows.map((row, index) => ({ row, index })).slice(headed.value ? 1 : 0));
</script>

<template>
 <section class="tb-section tb-table">
  <div class="tb-wrap" :class="{ 'tb-wrap--narrow': cells.length < 4 }">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head tb-section__head--start">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <div v-if="data.rows.length" class="tb-table__scroll" role="region" :aria-label="data.headline.trim() || 'Table'" tabindex="0">
    <table class="tb-table__grid" :class="`tb-table__grid--${cells.length}`">
     <thead v-if="headed">
      <tr>
       <th v-for="key in cells" :key="key" scope="col"><TbText :data="data" :field="`rows.0.${key}`" /></th>
      </tr>
     </thead>
     <tbody>
      <tr v-for="{ index } in body" :key="index">
       <td v-for="key in cells" :key="key"><TbText :data="data" :field="`rows.${index}.${key}`" /></td>
      </tr>
     </tbody>
    </table>
   </div>
   <TbText v-if="shows('note', data.note)" :data="data" field="note" tag="p" class="tb-table__note" />
  </div>
 </section>
</template>

<style>
 .tb-table .tb-section__head {
  margin-bottom: clamp(16px, 2vw, 22px);
 }

 .tb-table__scroll {
  overflow-x: auto;
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
  background: var(--site-surface);
 }

 .tb-table__scroll:focus-visible {
  outline: 2px solid var(--site-accent);
  outline-offset: 2px;
 }

 .tb-table__grid {
  width: 100%;
  border-collapse: collapse;
  font-size: clamp(15px, 0.25vw + 14px, 16.5px);
  line-height: 1.45;
  color: var(--site-body);
 }

 /* Four or five columns keep a width a cell can be read at, and scroll. */
 .tb-table__grid--4 {
  min-width: 560px;
 }

 .tb-table__grid--5 {
  min-width: 680px;
 }

 .tb-table__grid th,
 .tb-table__grid td {
  padding: clamp(11px, 1.3vw, 14px) clamp(14px, 1.8vw, 20px);
  text-align: start;
  vertical-align: top;
  overflow-wrap: break-word;
 }

 .tb-table__grid th {
  border-bottom: 1px solid var(--site-border);
  font-family: var(--site-font-display);
  font-size: 0.92em;
  font-weight: 700;
  color: var(--site-heading);
 }

 .tb-table__grid tbody tr + tr td {
  border-top: 1px solid var(--site-border);
 }

 /* The first column names the row. */
 .tb-table__grid td:first-child {
  font-weight: 700;
  color: var(--site-heading);
 }

 .tb-table__note {
  margin: 12px 0 0;
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--site-muted);
 }
</style>
