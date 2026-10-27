<script setup>
 // A page's blocks, in order, each drawn by its own component. The same
 // renderer runs on the live site and in the studio's canvas; in the
 // canvas, hidden blocks still show (faded) and unknown ones say so.
 import { definitions } from '#timbrr/blocks';

 defineProps({
  blocks: { type: Array, default: () => [] },
 });

 const canvas = useCanvas();
 const byType = new Map(definitions.map(({ def }) => [def.type, def]));
</script>

<template>
 <template v-for="block in blocks" :key="block.id">
  <TbBlockScope v-if="canvas || !block.hidden" :block="block" :def="byType.get(block.type) ?? null" />
 </template>
</template>
