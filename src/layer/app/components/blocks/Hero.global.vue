<script setup>
 defineProps({ data: { type: Object, required: true } });
</script>

<template>
 <section class="tb-section tb-hero" :class="`tb-hero--${data.layout}`">
  <div class="tb-wrap tb-hero__inner">
   <div class="tb-hero__text">
    <TbText v-if="data.tagline" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText :data="data" field="headline" tag="h1" class="tb-hero__headline" />
    <TbRich :doc="data.description" class="tb-hero__description" />
    <div v-if="data.buttons.length" class="tb-buttons">
     <TbButton v-for="(button, index) in data.buttons" :key="index" :data="data" :field="`buttons.${index}`" />
    </div>
    <TbText v-if="data.note" :data="data" field="note" tag="p" class="tb-note" />
   </div>
   <TbImage v-if="data.layout !== 'centered'" :image="data.image" ratio="4 / 5" class="tb-hero__image" />
  </div>
 </section>
</template>
