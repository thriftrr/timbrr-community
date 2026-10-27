<script setup>
 // One block: its data with defaults filled in, handed to its component.
 // In the canvas it also gets the studio's frame — selection outline and
 // the name tab, drawn over the block so the layout is exactly the site's.
 import { blockData, componentName } from '#timbrr/manifest';

 const props = defineProps({
  block: { type: Object, required: true },
  def: { type: Object, default: null },
 });

 const canvas = useCanvas();
 provide(BLOCK_KEY, { id: props.block.id });

 const data = computed(() => (props.def ? blockData(props.def, props.block.data) : null));
 const component = computed(() => (props.def ? componentName(props.def.type) : null));
 const selected = computed(() => canvas?.selected.value === props.block.id);

 function dragStart(event) {
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('application/x-timbrr-move', props.block.id);
  canvas.dragging.value = props.block.id;
 }
</script>

<template>
 <component :is="component" v-if="!canvas && data" :data="data" />
 <div
  v-else-if="canvas"
  class="tb-frame"
  :class="{ 'is-selected': selected, 'is-hidden': block.hidden, 'is-dragging': canvas.dragging.value === block.id }"
  :data-block-id="block.id"
 >
  <component :is="component" v-if="data" :data="data" />
  <div v-else class="tb-frame__missing">This site can't show “{{ block.type }}” blocks. Its code doesn't have them.</div>
  <span class="tb-frame__tab" draggable="true" @dragstart="dragStart" @dragend="canvas.dragging.value = null">
   <span aria-hidden="true">⠿</span> {{ def?.label ?? block.type }}<template v-if="block.hidden"> · hidden</template>
  </span>
 </div>
</template>
