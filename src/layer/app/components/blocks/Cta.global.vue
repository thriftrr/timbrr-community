<script setup>
 defineProps({ data: { type: Object, required: true } });
</script>

<template>
 <section class="tb-section tb-cta">
  <div class="tb-wrap">
   <div class="tb-cta__panel" :class="`tb-cta__panel--${data.tone}`">
    <div class="tb-cta__text">
     <TbText :data="data" field="headline" tag="h2" class="tb-heading" />
     <TbText v-if="data.description" :data="data" field="description" tag="p" class="tb-cta__description" multiline />
    </div>
    <div v-if="data.buttons.length" class="tb-buttons">
     <TbButton v-for="(button, index) in data.buttons" :key="index" :data="data" :field="`buttons.${index}`" />
    </div>
   </div>
  </div>
 </section>
</template>
