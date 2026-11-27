<script setup>
 // One block: its data with defaults filled in, handed to its component.
 // In the canvas it also gets the studio's frame: the selection outline and
 // the tab naming it, which is what you drag it by. Both are drawn over the
 // block, never around it, so the layout is exactly the site's. Its fields
 // read their tools and names from `def` through the block scope.
 //
 // On the live site its id goes on the block's root element (data-block-id,
 // as in the canvas's frame): it's how the page's analytics script finds a
 // block (docs/analytics.md). A block with more than one root element isn't
 // tracked, as it doesn't get the look classes either.
 //
 // The tab also says how the block is set (its layout, and its background
 // when that isn't the plain one), and on the selected block it opens a
 // small menu of the block's choices (its `buttons` fields: layout,
 // background, spacing), so the look can be changed without leaving the page.
 // A choice goes to the studio as an edit, like text typed in place.
 //
 // A block of a global block or template carries `lock` (docs/manifest.md §
 // Locked blocks). It's one piece on the page, its placement: any block of
 // it selects all of it, and the first carries the ink tab, the handle for
 // the whole piece.
 //
 // A part of a collection's page design around an entry's story (lock.kind
 // 'design', docs/README.md § Collections, "Page builder") is locked the same
 // way, and says so all the time, never by fading (the studio's D17): the
 // design's own text at full strength under a tint and a dashed outline, and
 // a pill, "From the Program page design · Edit design", on its first block.
 import { blockData, componentName } from '#timbrr/manifest';
 import { showLabel, showState } from '../../schema/show.js';
 import TbOwnBlock from './TbOwnBlock.vue';

 const props = defineProps({
  block: { type: Object, required: true },
  def: { type: Object, default: null },
  motion: { type: Object, default: null }, // motionAttrs (schema/motion.js): class, style and data for the root, or null
 });

 const canvas = useCanvas();
 // `lock` is handed to the blocks in a locked Split's columns (TbSplitColumn).
 provide(BLOCK_KEY, { id: props.block.id, def: props.def, lock: props.block.lock });
 // In a Split's column the block draws compact: no band or line of its own, and
 // its tab says so (docs/sub-blocks.md).
 const place = useBlockPlace();
 const inColumn = computed(() => place.value !== 'page');

 // Everything inside a locked block sees a canvas that can't be edited, so
 // it draws as the site does. This component keeps the real one, so the
 // piece can still be dragged by its tab.
 if (canvas && props.block.lock) provide(CANVAS_KEY, { ...canvas, editable: ref(false) });

 const data = computed(() => (props.def ? blockData(props.def, props.block.data) : null));
 // A site's own block (def.own) is drawn by the one interpreter, TbOwnBlock.
 const component = computed(() => (props.def?.own ? TbOwnBlock : props.def ? componentName(props.def.type) : null));

 // How the block sits on the page (site.css, § The look of a block), set on
 // its root. A retired block has none of these keys, so it gets none.
 const pageLook = () => ({
  'tb-look--soft': data.value?.background === 'soft',
  'tb-look--brand': data.value?.background === 'brand',
  'tb-look--dark': data.value?.background === 'dark',
  'tb-look--tight': data.value?.spacing === 'tight',
  'tb-look--roomy': data.value?.spacing === 'roomy',
  'tb-look--divider': data.value?.divider === true,
  // Set apart only when one is; `spacing` alone keeps drawing as before.
  ...(data.value?.above || data.value?.below
   ? { [`tb-look--above-${data.value.above ?? data.value.spacing ?? 'normal'}`]: true, [`tb-look--below-${data.value.below ?? data.value.spacing ?? 'normal'}`]: true }
   : {}),
 });
 const look = computed(() => (inColumn.value ? { 'tb-in-column': true, 'tb-in-column--wide': place.value === 'column-wide' } : pageLook()));
 // The block's own classes after the site's (Pro tools), and on the live site
 // its anchor as the root's id, so /page#anchor scrolls to it.
 const own = computed(() => blockClasses(props.block));
 const anchor = computed(() => blockAnchor(props.block));
 const placement = computed(() => props.block.lock?.id ?? props.block.id);
 const selected = computed(() => placementOf(canvas?.selected.value) === placement.value || Boolean(canvas?.chosen?.value.some((id) => placementOf(id) === placement.value)));
 const dragged = computed(() => placementOf(canvas?.dragging.value) === placement.value);
 const hovered = computed(() => Boolean(props.block.lock) && canvas?.hovered.value === placement.value);
 const tabbed = computed(() => !props.block.lock || props.block.lock.index === 0);
 // A reviewer's canvas: the block differs from the live copy (canvas.changed).
 const changed = computed(() => Boolean(canvas?.changed?.value && Object.hasOwn(canvas.changed.value, placement.value)) && tabbed.value);

 // A show window (schema/show.js): in the canvas a small chip says when the
 // block shows, and the block is dimmed while visitors don't see it, read
 // against the site's time zone, checked again each minute.
 const site = useTimbrrSite();
 const showChip = computed(() => (canvas && props.block.show && tabbed.value ? showLabel(props.block.show) : ''));
 const minute = ref(Date.now());
 let ticking = null;
 onMounted(() => canvas && props.block.show && (ticking = setInterval(() => (minute.value = Date.now()), 60_000)));
 onBeforeUnmount(() => clearInterval(ticking));
 const outside = computed(() => Boolean(canvas && props.block.show) && showState(props.block.show, site?.value?.details?.timezone, minute.value) !== 'on');

 // The pointer is over any block of a locked piece: its tab shows, however
 // far down the piece that is.
 function hover(over) {
  if (props.block.lock) canvas.hovered.value = over ? placement.value : null;
 }

 function open() {
  if (props.block.lock && canvas.library.value) canvas.open(placement.value);
 }

 // ── What the tab says, and its Style menu ──
 const MENU_MAX = 4;
 // The look fields mean nothing in a column (it has no band or room of its own).
 const COLUMN_NO = ['background', 'spacing', 'above', 'below', 'divider'];
 const choices = computed(() =>
  props.block.lock || !data.value ? [] : fieldsThatApply(props.def?.fields, data.value)
    .filter((field) => field.widget === 'buttons' && !field.draws && field.options.length > 1 && !(inColumn.value && (COLUMN_NO.includes(field.key) || props.def?.insideWithout?.includes(field.key))))
    .slice(0, MENU_MAX),
 );
 const chosen = (field) => field.options.find((option) => option.value === data.value[field.key]);
 const summary = computed(() =>
  choices.value
   .filter((field) => field.key === 'layout' || (field.key === 'background' && data.value[field.key] !== field.options[0].value))
   .map((field) => chosen(field)?.label)
   .filter(Boolean),
 );
 const styling = ref(false);
 const menu = ref(null);
 const menuId = useId();
 const canStyle = computed(() => Boolean(canvas?.editable.value && selected.value && choices.value.length));
 watch(canStyle, (value) => !value && (styling.value = false));
 function onOutside(event) {
  if (!menu.value?.contains(event.target) && !event.target.closest?.('.tb-frame__style')) styling.value = false;
 }
 function onMenuKey(event) {
  if (event.key !== 'Escape') return;
  event.stopPropagation();
  styling.value = false;
 }
 watch(styling, (open) => {
  if (open) document.addEventListener('pointerdown', onOutside, true);
  else document.removeEventListener('pointerdown', onOutside, true);
 });
 onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside, true));

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
 <component :is="component" v-if="!canvas && data" :id="anchor" :data="data" :class="[look, own, motion?.class]" :style="motion?.style" v-bind="motion?.data ?? {}" :data-block-id="block.id" />
 <div
  v-else-if="canvas"
  class="tb-frame"
  :class="{
   'is-selected': selected,
   'is-hidden': block.hidden,
   'is-dragging': dragged,
   'is-locked': block.lock,
   'is-design': block.lock?.kind === 'design',
   'is-hovered': hovered,
   'is-first': block.lock?.index === 0,
   'is-last': block.lock && block.lock.index === block.lock.count - 1,
   'is-changed': changed,
   'is-outside': outside,
  }"
  :data-block-id="block.id"
  :data-block-type="block.type"
  :data-lock-id="block.lock?.id"
  @pointerenter="hover(true)"
  @pointerleave="hover(false)"
  @dblclick="open"
 >
  <component :is="component" v-if="data" :data="data" :class="[look, own, motion?.class]" :style="motion?.style" v-bind="motion?.data ?? {}" />
  <div v-else-if="block.type.startsWith('own_')" class="tb-frame__missing">This block isn't published yet, or was deleted. Publish it in the Library to show it here.</div>
  <div v-else class="tb-frame__missing">This site can't show “{{ block.type }}” blocks. Its code doesn't have them.</div>
  <span v-if="changed" class="tb-frame__changed">Changed</span>
  <span v-if="showChip" class="tb-frame__show" :title="outside ? 'Visitors don\'t see it now' : 'Visitors see it now'">{{ showChip }}</span>
  <span
   v-if="tabbed"
   class="tb-frame__tab"
   :draggable="canvas.editable.value ? 'true' : 'false'"
   :title="canvas.editable.value ? 'Drag to move. Alt with an up or down arrow moves the selected block.' : undefined"
   @dragstart="dragStart"
   @dragend="canvas.dragging.value = null"
  >
   <span v-if="canvas.editable.value" class="tb-frame__grip" aria-hidden="true">
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor"><circle cx="2" cy="2" r="1.5" /><circle cx="8" cy="2" r="1.5" /><circle cx="2" cy="7" r="1.5" /><circle cx="8" cy="7" r="1.5" /><circle cx="2" cy="12" r="1.5" /><circle cx="8" cy="12" r="1.5" /></svg>
   </span>
   <svg v-if="block.lock?.kind === 'design'" class="tb-frame__link" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
   </svg>
   <svg v-else-if="block.lock" class="tb-frame__link" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
   </svg>
   <span v-if="block.lock?.kind === 'design'">From the {{ block.lock.name }} design</span>
   <span v-else-if="block.lock">{{ block.lock.name }} · shared<template v-if="Number.isInteger(block.lock.pages)"> · on {{ block.lock.pages }} {{ block.lock.pages === 1 ? 'page' : 'pages' }}</template><template v-if="block.hidden"> · hidden</template></span>
   <span v-else>{{ def?.label ?? block.type }}<template v-if="inColumn"> · in a column</template><template v-for="part in summary" :key="part"> · {{ part }}</template><template v-if="block.hidden"> · hidden</template></span>
   <button v-if="block.lock && canvas.library.value" type="button" class="tb-frame__open" @click="open">{{ block.lock.kind === 'design' ? 'Edit design' : 'Edit in the Library' }}</button>
   <button v-if="canStyle" type="button" class="tb-frame__style" aria-haspopup="true" :aria-expanded="styling ? 'true' : 'false'" :aria-controls="styling ? menuId : undefined" @click.stop="styling = !styling">Style ▾</button>
  </span>
  <div v-if="styling && canStyle" :id="menuId" ref="menu" class="tb-frame__menu" role="group" aria-label="Style of this block" @keydown="onMenuKey" @click.stop>
   <div v-for="field in choices" :key="field.key" class="tb-frame__choice" role="radiogroup" :aria-label="field.label">
    <span class="tb-frame__choice-name">{{ field.label }}</span>
    <button
     v-for="option in field.options"
     :key="String(option.value)"
     type="button"
     role="radio"
     class="tb-frame__pill"
     :aria-checked="(data[field.key] ?? data[field.fallback]) === option.value ? 'true' : 'false'"
     @click="canvas.edit(block.id, field.key, option.value)"
    >
     {{ option.label }}
    </button>
   </div>
  </div>
 </div>
</template>
