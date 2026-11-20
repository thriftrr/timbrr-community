<script setup>
 // One column of a Split: its blocks, drawn through TbBlocks like the page's
 // own, told where they sit (`place`, read with useBlockPlace) so each draws
 // its compact form. In the studio's canvas an empty column is a drop zone,
 // and while a block is dragged over it the column lights up, or says why it
 // won't take it (canvas.dropColumn, pages/__timbrr/canvas.vue).
 const props = defineProps({
  blocks: { type: Array, default: () => [] },
  place: { type: String, default: 'column' },
  index: { type: Number, default: 0 },
 });
 const canvas = useCanvas();
 const scope = useBlockScope();
 provide(
  PLACE_KEY,
  computed(() => props.place),
 );

 // The blocks of a locked Split (a Library item's) are the Library's, as it is:
 // each carries the Split's lock, without a tab of its own.
 const drawn = computed(() => (scope?.lock ? props.blocks.map((block) => ({ ...block, lock: { ...scope.lock, index: 1, count: 99 } })) : props.blocks));
 const target = computed(() => {
  const drop = canvas?.dropColumn?.value;
  return drop && drop.id === scope?.id && drop.column === props.index ? drop : null;
 });
 const empty = computed(() => Boolean(canvas) && canvas.editable.value && !props.blocks.length);
</script>

<template>
 <div class="tb-split__col" :class="{ 'is-over': target && !target.refused, 'is-refused': target?.refused }" :data-split-column="index" :data-split-id="scope?.id">
  <TbBlocks v-if="blocks.length" :blocks="drawn" />
  <div v-else-if="empty" class="tb-split__drop">
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
   Drop a block here
  </div>
  <p v-if="target?.refused" class="tb-split__refusal" role="status">{{ target.refused }}</p>
 </div>
</template>
