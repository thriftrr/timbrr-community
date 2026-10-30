<script setup>
 // One block: its data with defaults filled in, handed to its component.
 // In the canvas it also gets the studio's frame: the selection outline and
 // the tab naming it, which is what you drag it by. Both are drawn over the
 // block, never around it, so the layout is exactly the site's. Its fields
 // read their tools and names from `def` through the block scope.
 //
 // A block of a global block or template carries `lock` (docs/manifest.md §
 // Locked blocks). It's one piece on the page, its placement: any block of
 // it selects all of it, and the first carries the ink tab, the handle for
 // the whole piece.
 import { blockData, componentName } from '#timbrr/manifest';

 const props = defineProps({
  block: { type: Object, required: true },
  def: { type: Object, default: null },
 });

 const canvas = useCanvas();
 provide(BLOCK_KEY, { id: props.block.id, def: props.def });

 // Everything inside a locked block sees a canvas that can't be edited, so
 // it draws as the site does. This component keeps the real one, so the
 // piece can still be dragged by its tab.
 if (canvas && props.block.lock) provide(CANVAS_KEY, { ...canvas, editable: ref(false) });

 const data = computed(() => (props.def ? blockData(props.def, props.block.data) : null));
 const component = computed(() => (props.def ? componentName(props.def.type) : null));
 const placement = computed(() => props.block.lock?.id ?? props.block.id);
 const selected = computed(() => placementOf(canvas?.selected.value) === placement.value);
 const dragged = computed(() => placementOf(canvas?.dragging.value) === placement.value);
 const hovered = computed(() => Boolean(props.block.lock) && canvas?.hovered.value === placement.value);
 const tabbed = computed(() => !props.block.lock || props.block.lock.index === 0);

 // The pointer is over any block of a locked piece: its tab shows, however
 // far down the piece that is.
 function hover(over) {
  if (props.block.lock) canvas.hovered.value = over ? placement.value : null;
 }

 function open() {
  if (props.block.lock && canvas.library.value) canvas.open(placement.value);
 }

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
  :class="{
   'is-selected': selected,
   'is-hidden': block.hidden,
   'is-dragging': dragged,
   'is-locked': block.lock,
   'is-hovered': hovered,
   'is-first': block.lock?.index === 0,
   'is-last': block.lock && block.lock.index === block.lock.count - 1,
  }"
  :data-block-id="block.id"
  :data-lock-id="block.lock?.id"
  @pointerenter="hover(true)"
  @pointerleave="hover(false)"
  @dblclick="open"
 >
  <component :is="component" v-if="data" :data="data" />
  <div v-else class="tb-frame__missing">This site can't show “{{ block.type }}” blocks. Its code doesn't have them.</div>
  <span
   v-if="tabbed"
   class="tb-frame__tab"
   :draggable="canvas.editable.value ? 'true' : 'false'"
   :title="canvas.editable.value ? 'Drag to reorder' : undefined"
   @dragstart="dragStart"
   @dragend="canvas.dragging.value = null"
  >
   <span v-if="canvas.editable.value" class="tb-frame__grip" aria-hidden="true">⠿</span>
   <svg v-if="block.lock" class="tb-frame__link" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
   </svg>
   <span>{{ block.lock?.name ?? def?.label ?? block.type }}<template v-if="block.hidden"> · hidden</template></span>
   <button v-if="block.lock && canvas.library.value" type="button" class="tb-frame__open" @click="open">Edit in Library</button>
  </span>
 </div>
</template>
