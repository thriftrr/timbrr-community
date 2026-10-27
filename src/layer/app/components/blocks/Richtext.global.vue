<script setup>
 defineProps({ data: { type: Object, required: true } });
</script>

<template>
 <section class="tb-section tb-richtext">
  <div class="tb-wrap tb-wrap--narrow">
   <TbText v-if="data.tagline" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
   <TbText v-if="data.headline" :data="data" field="headline" tag="h2" class="tb-heading" />
   <TbRich :doc="data.content" class="tb-richtext__body" />
  </div>
 </section>
</template>
