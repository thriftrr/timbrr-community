<script setup>
 // One box of an own block's layout (TbOwnBlock): a stack, a row, a grid or a
 // split, and the boxes and atoms in it. A grid of a list draws each item with
 // the grid's `item` (a stack or row of atoms on the list's fields), and past
 // `phoneMax` items hides the rest on phones. `row` is the list item an atom
 // is inside: { list, index }.
 const props = defineProps({
  node: { type: Object, required: true },
  row: { type: Object, default: null },
 });
 const own = inject(OWN_BLOCK_KEY);
 const canvas = useCanvas();

 const kind = computed(() => (props.node.atom ? 'atom' : props.node.kind));
 const gap = computed(() => (props.node.gap ? `tb-own--gap-${props.node.gap.toLowerCase()}` : ''));
 const extra = computed(() => [props.node.class ?? '']);
 // The anchor goes on the live site only, as a block's does.
 const anchor = computed(() => (canvas ? undefined : props.node.anchor));
 const list = computed(() => (kind.value === 'grid' && props.node.field ? own.fields.value.get(props.node.field) : null));
 const rows = computed(() => {
  const held = own.data.value?.[props.node.field];
  return Array.isArray(held) ? held : [];
 });
 const pastPhone = (index) => Number.isInteger(list.value?.phoneMax) && index >= list.value.phoneMax;
</script>

<template>
 <TbOwnAtom v-if="kind === 'atom'" :node="node" :row="row" />
 <div v-else-if="kind === 'stack'" :id="anchor" class="tb-own__stack" :class="[gap, { 'tb-own__stack--center': node.align === 'center' }, extra]">
  <TbOwnNode v-for="(child, at) in node.items" :key="at" :node="child" :row="row" />
 </div>
 <div v-else-if="kind === 'row'" :id="anchor" class="tb-own__row" :class="[gap, node.align ? `tb-own__row--${node.align}` : '', { 'tb-own__row--wrap': node.wrap }, extra]">
  <TbOwnNode v-for="(child, at) in node.items" :key="at" :node="child" :row="row" />
 </div>
 <div
  v-else-if="kind === 'split'"
  :id="anchor"
  class="tb-own__split"
  :class="[`tb-own__split--${(node.ratio ?? '50/50').replace('/', '-')}`, `tb-own__split--${node.media ?? 'left'}`, node.align ? `tb-own__split--${node.align}` : '', { 'tb-own__split--text-first': node.phone === 'text_first' }, extra]"
 >
  <div class="tb-own__side tb-own__side--media">
   <TbOwnNode v-for="(child, at) in node.slots.media" :key="at" :node="child" :row="row" />
  </div>
  <div class="tb-own__side tb-own__side--text">
   <TbOwnNode v-for="(child, at) in node.slots.text" :key="at" :node="child" :row="row" />
  </div>
 </div>
 <div v-else-if="kind === 'grid'" :id="anchor" class="tb-own__grid" :class="[gap, { 'tb-own__grid--phone-2': node.phone === 2 }, extra]" :style="{ '--tb-own-columns': node.columns }">
  <template v-if="node.field">
   <div v-for="(_, index) in rows" :key="index" class="tb-own__item" :class="{ 'tb-own__item--row': node.item.kind === 'row', 'tb-own__past-phone': pastPhone(index), [`tb-own--gap-${(node.item.gap ?? '').toLowerCase()}`]: node.item.gap }">
    <TbOwnNode v-for="(child, at) in node.item.items" :key="at" :node="child" :row="{ list: node.field, index }" />
   </div>
  </template>
  <TbOwnNode v-for="(child, at) in node.items" v-else :key="at" :node="child" :row="row" />
 </div>
</template>
