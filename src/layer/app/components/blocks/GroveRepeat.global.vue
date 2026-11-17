<script setup>
 // Repeat for each sapling. On the site the studio has already done the
 // repeating: `items` is one list of blocks for each sapling, drawn here as
 // a grid of cells, each with the site's own blocks (TbBlocks). The end
 // marker is gone by then. On the canvas the blocks between this and its end
 // are drawn once, as they're kept, so this is a band saying they repeat,
 // and the end marker a band saying where they stop.
 const props = defineProps({ data: { type: Object, required: true } });
 const canvas = useCanvas();
 const scope = useBlockScope();
 const sent = useTimbrrGroves();
 const items = computed(() => (Array.isArray(props.data.items) ? props.data.items.filter(Array.isArray) : null));
 const listed = computed(() => sent.value?.lists?.[`${scope?.id}:source`] ?? null);
 const what = computed(() => {
  const grove = listed.value?.grove;
  if (!props.data.source?.grove) return 'Pick a grove for this repeat in the panel on the right.';
  if (!grove) return `Repeats for each sapling of ${props.data.source.grove}.`;
  const shown = Math.min(listed.value.total, 20, props.data.source.limit ?? 12);
  return `Repeats for each ${grove.singular.toLowerCase()}: ${shown} on the site now.`;
 });
</script>

<template>
 <div v-if="canvas" class="tb-grove-repeat__band" :class="{ 'tb-grove-repeat__band--end': data.end }">
  <span>{{ data.end ? 'End of the repeat' : what }}</span>
 </div>
 <section v-else-if="!data.end && items" class="tb-section tb-grove-repeat">
  <div class="tb-wrap">
   <p v-if="!items.length" class="tb-grove-repeat__empty">{{ data.empty || 'Nothing here yet.' }}</p>
   <ul v-else class="tb-grove-repeat__grid" :class="[`tb-grove-repeat__grid--${data.columns || '3'}`, `tb-grove-repeat__grid--${data.gap || 'medium'}`]" role="list">
    <li v-for="(cell, index) in items" :key="index" class="tb-grove-repeat__cell">
     <TbBlocks :blocks="cell" />
    </li>
   </ul>
  </div>
 </section>
 <div v-else hidden />
</template>

<style>
 .tb-grove-repeat__band {
  margin: 8px 16px;
  border: 1.5px dashed var(--site-accent);
  border-radius: var(--site-control-radius);
  padding: 8px 12px;
  font: 600 12.5px/1.4 system-ui, sans-serif;
  color: var(--site-accent);
  background: color-mix(in srgb, var(--site-accent) 6%, transparent);
 }

 .tb-grove-repeat__band--end {
  border-style: solid;
  border-width: 0 0 1.5px;
  border-radius: 0;
  background: none;
  text-align: right;
 }

 .tb-grove-repeat__empty {
  margin: 0;
  color: var(--site-muted);
 }

 .tb-grove-repeat__grid {
  display: grid;
  gap: 24px;
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-grove-repeat__grid--small {
  gap: 12px;
 }

 .tb-grove-repeat__grid--large {
  gap: 40px;
 }

 @media (min-width: 720px) {
  .tb-grove-repeat__grid--2,
  .tb-grove-repeat__grid--3,
  .tb-grove-repeat__grid--4 {
   grid-template-columns: repeat(2, 1fr);
  }
 }

 @media (min-width: 1000px) {
  .tb-grove-repeat__grid--3 {
   grid-template-columns: repeat(3, 1fr);
  }

  .tb-grove-repeat__grid--4 {
   grid-template-columns: repeat(4, 1fr);
  }
 }

 /* The blocks in a cell sit inside it: no page-wide room of their own. */
 .tb-grove-repeat__cell {
  min-width: 0;
 }

 .tb-grove-repeat__cell > .tb-section,
 .tb-grove-repeat__cell .tb-section {
  padding-block: 6px;
 }

 .tb-grove-repeat__cell .tb-wrap {
  max-width: none;
  padding-inline: 0;
 }
</style>
