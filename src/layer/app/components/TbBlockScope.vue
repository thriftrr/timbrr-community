<script setup>
 // One block: its data with defaults filled in, handed to its component.
 // In the canvas it also gets the studio's frame: the selection outline and
 // the tab naming it, which is what you drag it by. Both are drawn over the
 // block, never around it, so the layout is exactly the site's. Its fields
 // read their tools and names from `def` through the block scope.
 import { blockData, componentName } from '#timbrr/manifest';

 const props = defineProps({
  block: { type: Object, required: true },
  def: { type: Object, default: null },
 });

 const canvas = useCanvas();
 provide(BLOCK_KEY, { id: props.block.id, def: props.def });

 const data = computed(() => (props.def ? blockData(props.def, props.block.data) : null));
 const component = computed(() => (props.def ? componentName(props.def.type) : null));
 const selected = computed(() => canvas?.selected.value === props.block.id);

 function dragStart(event) {
  if (!canvas.editable.value) {
   event.preventDefault();
   return;
  }
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
  <span
   class="tb-frame__tab"
   :draggable="canvas.editable.value ? 'true' : 'false'"
   :title="canvas.editable.value ? 'Drag to reorder' : undefined"
   @dragstart="dragStart"
   @dragend="canvas.dragging.value = null"
  >
   <span v-if="canvas.editable.value" class="tb-frame__grip" aria-hidden="true">⠿</span>
   <span>{{ def?.label ?? block.type }}<template v-if="block.hidden"> · hidden</template></span>
  </span>
 </div>
</template>
