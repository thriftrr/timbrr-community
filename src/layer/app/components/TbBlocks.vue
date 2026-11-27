<script setup>
 // A page's blocks, in order, each drawn by its own component. The same
 // renderer runs on the live site and in the studio's canvas; in the
 // canvas, hidden blocks still show (faded) and unknown ones say so. A block
 // with a show window (schema/show.js) draws only inside it, read against the
 // site's time zone; the canvas draws it either way, dimmed outside it.
 import { definitions } from '#timbrr/blocks';
 import { checkOwnBlock, ownBlockDef } from '../../schema/own-block.js';
 import { blockMotion, motionAttrs } from '../../schema/motion.js';
 import { shownNow } from '../../schema/show.js';

 const props = defineProps({
  blocks: { type: Array, default: () => [] },
 });

 const canvas = useCanvas();
 // Which block draws the page's h1 (useHeadingTag): none inside another TbBlocks, a repeat's cells.
 const nested = inject(H1_KEY, null) !== null;
 provide(
  H1_KEY,
  computed(() => (nested ? '' : (props.blocks.find((block) => drawn(block) && wantsH1(block))?.id ?? ''))),
 );
 const byType = new Map(definitions.map(({ def }) => [def.type, def]));
 // The site's own blocks (useTimbrrOwnBlocks), drawn by TbOwnBlock. Each
 // definition is checked here again: one that doesn't check draws as missing.
 const ownBlocks = useTimbrrOwnBlocks();
 const ownDefs = computed(() => {
  const out = new Map();
  for (const [type, doc] of Object.entries(ownBlocks.value ?? {})) {
   const checked = checkOwnBlock(doc, { pro: true });
   if (checked.ok && checked.doc.type === type) out.set(type, ownBlockDef(checked.doc));
  }
  return out;
 });
 const defOf = (type) => byType.get(type) ?? ownDefs.value.get(type) ?? null;
 // How each block arrives (docs/motion.md): only a page's own blocks, never
 // a column's or a repeat's; the first shown block defaults to None.
 const site = useTimbrrSite();
 const zone = computed(() => site?.value?.details?.timezone);
 const drawn = (block) => canvas || (!block.hidden && shownNow(block, zone.value));
 const first = computed(() => props.blocks.find((block) => drawn(block))?.id);
 const motionOf = (block) => (nested ? null : motionAttrs(blockMotion(block, { brand: site?.value?.brand, first: block.id === first.value })));
</script>

<template>
 <template v-for="block in blocks" :key="block.id">
  <TbBlockScope v-if="drawn(block)" :block="block" :def="defOf(block.type)" :motion="motionOf(block)" />
 </template>
</template>
