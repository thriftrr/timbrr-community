<script setup>
 // A table under an optional heading: real table markup, so a screen reader
 // can say which column and row a cell is in. The first row can be the
 // column headings and the first column can name the rows; cells can be
 // merged (tableLayout, app/utils/blocks.js). A table wider than the screen
 // scrolls sideways inside its own box, which takes the keyboard so it can
 // be scrolled without a pointer, and the row names stay in view while it
 // does; the page never scrolls sideways.
 const props = defineProps({ data: { type: Object, required: true } });
 const shows = useFieldShown();

 const layout = computed(() => tableLayout(props.data.table));
 const headed = computed(() => props.data.table.header_row && layout.value.rows.length > 1);
 const head = computed(() => (headed.value ? layout.value.rows.slice(0, 1) : []));
 const body = computed(() => layout.value.rows.slice(headed.value ? 1 : 0));
 const names = computed(() => props.data.table.header_col && layout.value.columns > 1);
 const align = (cell) => props.data.table.align[cell.c] ?? 'left';
 // In the body, the first column's cells are headings when it names the rows.
 const tagOf = (cell) => (names.value && cell.c === 0 ? 'th' : 'td');
 const span = (value) => (value > 1 ? value : undefined);
 // Where a cell lines up, and whether it reaches the table's right or bottom edge.
 const classOf = (cell) => [`is-${align(cell)}`, { 'is-end': cell.c + cell.colspan === layout.value.columns, 'is-foot': cell.r + cell.rowspan === layout.value.rows.length }];
</script>

<template>
 <section class="tb-section tb-tbl" :class="`tb-tbl--${data.style}`">
  <div class="tb-wrap" :class="{ 'tb-wrap--narrow': layout.columns < 4 }">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head tb-section__head--start">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <div v-if="layout.rows.length" class="tb-tbl__scroll" role="region" :aria-label="data.headline.trim() || data.caption.trim() || 'Table'" tabindex="0">
    <table class="tb-tbl__grid" :style="{ minWidth: layout.columns > 3 ? `${layout.columns * 138}px` : undefined }">
     <caption v-if="shows('caption', data.caption)" class="tb-tbl__caption">
      <TbText :data="data" field="caption" />
     </caption>
     <thead v-if="headed">
      <tr v-for="(row, index) in head" :key="index">
       <th v-for="cell in row" :key="cell.c" :scope="cell.colspan > 1 ? 'colgroup' : 'col'" :colspan="span(cell.colspan)" :class="classOf(cell)">
        <TbText :data="data" :field="`table.rows.${cell.r}.${cell.c}.text`" />
       </th>
      </tr>
     </thead>
     <tbody>
      <tr v-for="(row, index) in body" :key="index">
       <component
        :is="tagOf(cell)"
        v-for="cell in row"
        :key="cell.c"
        :scope="tagOf(cell) === 'th' ? (cell.rowspan > 1 ? 'rowgroup' : 'row') : undefined"
        :colspan="span(cell.colspan)"
        :rowspan="span(cell.rowspan)"
        :class="classOf(cell)"
       >
        <TbText :data="data" :field="`table.rows.${cell.r}.${cell.c}.text`" />
       </component>
      </tr>
     </tbody>
    </table>
   </div>
  </div>
 </section>
</template>

<style>
 .tb-tbl .tb-section__head {
  margin-bottom: clamp(16px, 2vw, 22px);
 }

 .tb-tbl__scroll {
  overflow-x: auto;
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
  background: var(--site-surface);
 }

 .tb-tbl__scroll:focus-visible {
  outline: 2px solid var(--site-accent);
  outline-offset: 2px;
 }

 /* Separate borders, with no gap: collapsed ones don't follow a cell that stays put. */
 .tb-tbl__grid {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: clamp(15px, 0.25vw + 14px, 16.5px);
  line-height: 1.45;
  color: var(--site-body);
 }

 .tb-tbl__grid th,
 .tb-tbl__grid td {
  padding: clamp(11px, 1.3vw, 14px) clamp(14px, 1.8vw, 20px);
  text-align: start;
  vertical-align: top;
  overflow-wrap: break-word;
 }

 .tb-tbl__grid .is-center {
  text-align: center;
 }

 .tb-tbl__grid .is-right {
  text-align: end;
 }

 .tb-tbl__grid th {
  font-weight: 700;
  color: var(--site-heading);
 }

 .tb-tbl__grid thead th {
  border-bottom: 1px solid var(--site-border);
  font-family: var(--site-font-display);
  font-size: 0.92em;
 }

 .tb-tbl__grid tbody tr + tr > * {
  border-top: 1px solid var(--site-border);
 }

 /* The row names stay put while the rest scrolls under them. */
 .tb-tbl__grid tbody th {
  position: sticky;
  left: 0;
  background: var(--site-surface);
 }

 .tb-tbl__caption {
  caption-side: bottom;
  border-top: 1px solid var(--site-border);
  padding: 10px clamp(14px, 1.8vw, 20px);
  font-size: 14.5px;
  line-height: 1.5;
  text-align: start;
  color: var(--site-muted);
 }

 /* Striped: every other row tinted, and no lines between rows. */
 .tb-tbl--striped .tb-tbl__grid tbody tr + tr > * {
  border-top: 0;
 }

 .tb-tbl--striped .tb-tbl__grid tbody tr:nth-child(even) > * {
  background: color-mix(in srgb, var(--site-heading) 5%, var(--site-surface));
 }

 /* Bordered: a line around every cell. Each draws its right and bottom
    ones, but for the cells along the right and bottom edges, where the box
    already has one. */
 .tb-tbl--bordered .tb-tbl__grid th,
 .tb-tbl--bordered .tb-tbl__grid td {
  border-right: 1px solid var(--site-border);
  border-bottom: 1px solid var(--site-border);
 }

 .tb-tbl--bordered .tb-tbl__grid tbody tr + tr > * {
  border-top: 0;
 }

 .tb-tbl--bordered .tb-tbl__grid .is-end {
  border-right: 0;
 }

 .tb-tbl--bordered .tb-tbl__grid tbody .is-foot {
  border-bottom: 0;
 }

 /* Compact: more rows to the screen. */
 .tb-tbl--compact .tb-tbl__grid {
  font-size: 14px;
 }

 .tb-tbl--compact .tb-tbl__grid th,
 .tb-tbl--compact .tb-tbl__grid td {
  padding: 6px 12px;
 }
</style>
