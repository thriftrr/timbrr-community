<script setup>
 // Repeat for each entry. On the site the studio has already done the
 // repeating: `items` is one list of blocks for each entry, drawn here as
 // a grid of cells, each with the site's own blocks (TbBlocks). The end
 // marker is gone by then. On the canvas the blocks between this and its end
 // are drawn once, as they're kept, so this is a band saying they repeat,
 // and the end marker a band saying where they stop.
 const props = defineProps({ data: { type: Object, required: true } });
 const canvas = useCanvas();
 const scope = useBlockScope();
 const sent = useTimbrrCollections();
 const items = computed(() => (Array.isArray(props.data.items) ? props.data.items.filter(Array.isArray) : null));
 const listed = computed(() => sent.value?.lists?.[`${scope?.id}:source`] ?? null);
 const what = computed(() => {
  const collection = listed.value?.collection;
  if (!props.data.source?.collection) return 'Pick a collection for this repeat in the panel on the right.';
  if (!collection) return `Repeats for each entry of ${props.data.source.collection}.`;
  const shown = Math.min(listed.value.total, 20, props.data.source.limit ?? 12);
  return `Repeats for each ${collection.singular.toLowerCase()}: ${shown} on the site now.`;
 });
</script>

<template>
 <div v-if="canvas" class="tb-collection-repeat__band" :class="{ 'tb-collection-repeat__band--end': data.end }">
  <span>{{ data.end ? 'End of the repeat' : what }}</span>
 </div>
 <section v-else-if="!data.end && items" class="tb-section tb-collection-repeat">
  <div class="tb-wrap">
   <p v-if="!items.length" class="tb-collection-repeat__empty">{{ data.empty || 'Nothing here yet.' }}</p>
   <ul v-else class="tb-collection-repeat__grid" :class="[`tb-collection-repeat__grid--${data.columns || '3'}`, `tb-collection-repeat__grid--${data.gap || 'medium'}`]" role="list">
    <li v-for="(cell, index) in items" :key="index" class="tb-collection-repeat__cell">
     <TbBlocks :blocks="cell" />
    </li>
   </ul>
  </div>
 </section>
 <div v-else hidden />
</template>

<style>
 .tb-collection-repeat__band {
  margin: 8px 16px;
  border: 1.5px dashed var(--site-accent);
  border-radius: var(--site-control-radius);
  padding: 8px 12px;
  font: 600 12.5px/1.4 system-ui, sans-serif;
  color: var(--site-accent);
  background: color-mix(in srgb, var(--site-accent) 6%, transparent);
 }

 .tb-collection-repeat__band--end {
  border-style: solid;
  border-width: 0 0 1.5px;
  border-radius: 0;
  background: none;
  text-align: right;
 }

 .tb-collection-repeat__empty {
  margin: 0;
  color: var(--site-muted);
 }

 .tb-collection-repeat__grid {
  display: grid;
  gap: 24px;
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-collection-repeat__grid--small {
  gap: 12px;
 }

 .tb-collection-repeat__grid--large {
  gap: 40px;
 }

 @media (min-width: 720px) {
  .tb-collection-repeat__grid--2,
  .tb-collection-repeat__grid--3,
  .tb-collection-repeat__grid--4 {
   grid-template-columns: repeat(2, 1fr);
  }
 }

 @media (min-width: 1000px) {
  .tb-collection-repeat__grid--3 {
   grid-template-columns: repeat(3, 1fr);
  }

  .tb-collection-repeat__grid--4 {
   grid-template-columns: repeat(4, 1fr);
  }
 }

 /* The blocks in a cell sit inside it: no page-wide room of their own. */
 .tb-collection-repeat__cell {
  min-width: 0;
 }

 .tb-collection-repeat__cell > .tb-section,
 .tb-collection-repeat__cell .tb-section {
  padding-block: 6px;
 }

 .tb-collection-repeat__cell .tb-wrap {
  max-width: none;
  padding-inline: 0;
 }
</style>
