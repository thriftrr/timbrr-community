<script setup>
 // One of the studio demo's icons (app/utils/studio-demo/icons.js): the
 // studio's own, drawn the way the studio draws them.
 import { STUDIO_DEMO_ICONS } from '../../utils/studio-demo/icons.js';

 const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 16 },
 });
 const nodes = computed(() => STUDIO_DEMO_ICONS[props.name] ?? [['rect', { x: '3', y: '3', width: '18', height: '18', rx: '2' }]]);
</script>

<template>
 <svg class="sd-icon" :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <component :is="tag" v-for="([tag, attrs], index) in nodes" :key="index" v-bind="attrs" />
 </svg>
</template>
