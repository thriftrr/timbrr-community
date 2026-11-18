<script setup>
 // Stand-in for a retired block (blocks/grove_list.js). The studio serves it as
 // the Collection list, so a live page never gets one; on the canvas it asks for
 // the page to be converted.
 defineProps({ data: { type: Object, required: true } });
 const canvas = useCanvas();
</script>

<template>
 <div v-if="canvas" class="tb-frame__missing">Convert this page: this block is now the Collection list.</div>
</template>
