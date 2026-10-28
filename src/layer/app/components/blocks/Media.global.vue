<script setup>
 defineProps({ data: { type: Object, required: true } });
</script>

<template>
 <figure class="tb-section tb-media" :class="`tb-media--${data.width}`">
  <div :class="data.width === 'full' ? '' : data.width === 'wide' ? 'tb-wrap tb-wrap--wide' : 'tb-wrap tb-wrap--narrow'">
   <TbImage :image="data.image" ratio="16 / 9" />
   <TbText v-if="data.caption" :data="data" field="caption" tag="figcaption" class="tb-media__caption" />
  </div>
 </figure>
</template>

<style>
 .tb-media--full .tb-image {
  border-radius: 0;
 }

 .tb-media__caption {
  margin-top: 10px;
  font-size: 13.5px;
  color: var(--site-muted);
  text-align: center;
 }
</style>
