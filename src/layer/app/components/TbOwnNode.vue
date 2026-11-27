<script setup>
 // One box of an own block's layout (TbOwnBlock): a stack, a row, a grid or a
 // split, and the boxes and atoms in it. A grid of a list draws each item with
 // the grid's `item` (a stack or row of atoms on the list's fields), and past
 // `phoneMax` items hides the rest on phones; with `carousel` the items slide
 // sideways instead (CSS scroll snap, no script). `row` is the list item an
 // atom is inside: { list, index }.
 //
 // A box's look (padding, fill, corners, shadow, fill or hug, and what changes
 // on Mobile) comes from ownBoxLook: classes over --site-* tokens, and the
 // numbers as custom properties the CSS in TbOwnBlock reads.
 import { ownBoxLook } from '../../schema/own-block.js';

 const props = defineProps({
  node: { type: Object, required: true },
  row: { type: Object, default: null },
 });
 const own = inject(OWN_BLOCK_KEY);
 const canvas = useCanvas();

 const kind = computed(() => (props.node.atom ? 'atom' : props.node.kind));
 const look = computed(() => (kind.value === 'atom' ? { classes: [], style: {} } : ownBoxLook(props.node)));
 const extra = computed(() => [...look.value.classes, props.node.class ?? '']);
 // An item's own gap is its own property: a grid's gap would otherwise reach into its items.
 const itemLook = computed(() => {
  const item = props.node.item;
  if (!item) return { classes: [], style: {} };
  const { classes, style } = ownBoxLook({ ...item, kind: undefined, gap: undefined, mobile: undefined });
  const gap = item.gap === undefined ? undefined : typeof item.gap === 'number' ? `${item.gap}px` : `var(--tb-own-gap-${String(item.gap).toLowerCase()})`;
  return { classes, style: gap ? { ...style, '--tb-own-item-gap': gap } : style };
 });
 // The anchor goes on the live site only, as a block's does.
 const anchor = computed(() => (canvas ? undefined : props.node.anchor));
 const list = computed(() => (kind.value === 'grid' && props.node.field ? own.fields.value.get(props.node.field) : null));
 const rows = computed(() => {
  const held = own.data.value?.[props.node.field];
  return Array.isArray(held) ? held : [];
 });
 const carousel = computed(() => kind.value === 'grid' && Boolean(props.node.field) && props.node.carousel === true);
 const pastPhone = (index) => !carousel.value && Number.isInteger(list.value?.phoneMax) && index >= list.value.phoneMax;
</script>

<template>
 <TbOwnAtom v-if="kind === 'atom'" :node="node" :row="row" />
 <div v-else-if="kind === 'stack'" :id="anchor" class="tb-own__stack" :class="[{ 'tb-own__stack--center': node.align === 'center', 'tb-own__stack--end': node.align === 'end' }, extra]" :style="look.style">
  <TbOwnNode v-for="(child, at) in node.items" :key="at" :node="child" :row="row" />
 </div>
 <div v-else-if="kind === 'row'" :id="anchor" class="tb-own__row" :class="[node.align ? `tb-own__row--${node.align}` : '', { 'tb-own__row--wrap': node.wrap }, extra]" :style="look.style">
  <TbOwnNode v-for="(child, at) in node.items" :key="at" :node="child" :row="row" />
 </div>
 <div
  v-else-if="kind === 'split'"
  :id="anchor"
  class="tb-own__split"
  :class="[`tb-own__split--${(node.ratio ?? '50/50').replace('/', '-')}`, `tb-own__split--${node.media ?? 'left'}`, node.align ? `tb-own__split--${node.align}` : '', { 'tb-own__split--text-first': node.phone === 'text_first' }, extra]"
  :style="look.style"
 >
  <div class="tb-own__side tb-own__side--media">
   <TbOwnNode v-for="(child, at) in node.slots.media" :key="at" :node="child" :row="row" />
  </div>
  <div class="tb-own__side tb-own__side--text" :class="{ 'tb-look--dark': node.media === 'behind' }">
   <TbOwnNode v-for="(child, at) in node.slots.text" :key="at" :node="child" :row="row" />
  </div>
 </div>
 <div
  v-else-if="kind === 'grid'"
  :id="anchor"
  class="tb-own__grid"
  :class="[{ 'tb-own__grid--phone-2': node.phone === 2 && !carousel, 'tb-own__grid--carousel': carousel }, extra]"
  :style="{ '--tb-own-columns': node.columns, ...look.style }"
  :tabindex="carousel ? 0 : undefined"
  :role="carousel ? 'region' : undefined"
  :aria-label="carousel ? (list?.label ?? undefined) : undefined"
 >
  <template v-if="node.field">
   <div
    v-for="(_, index) in rows"
    :key="index"
    class="tb-own__item"
    data-motion-item
    :class="[{ 'tb-own__item--row': node.item.kind === 'row', 'tb-own__past-phone': pastPhone(index) }, itemLook.classes]"
    :style="itemLook.style"
   >
    <TbOwnNode v-for="(child, at) in node.item.items" :key="at" :node="child" :row="{ list: node.field, index }" />
   </div>
  </template>
  <TbOwnNode v-for="(child, at) in node.items" v-else :key="at" :node="child" :row="row" />
 </div>
</template>
