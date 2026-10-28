<script setup>
 defineProps({ data: { type: Object, required: true } });
</script>

<template>
 <section class="tb-section tb-hero" :class="`tb-hero--${data.layout}`">
  <div class="tb-wrap tb-hero__inner">
   <div class="tb-hero__text">
    <TbText v-if="data.tagline" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText :data="data" field="headline" tag="h1" class="tb-hero__headline" />
    <TbRich :data="data" field="description" class="tb-hero__description" />
    <div v-if="data.buttons.length" class="tb-buttons">
     <TbButton v-for="(button, index) in data.buttons" :key="index" :data="data" :field="`buttons.${index}`" />
    </div>
    <TbText v-if="data.note" :data="data" field="note" tag="p" class="tb-note" />
   </div>
   <TbImage v-if="data.layout !== 'centered'" :image="data.image" ratio="4 / 5" class="tb-hero__image" />
  </div>
 </section>
</template>

<style>
 .tb-hero__inner {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: clamp(28px, 5vw, 56px);
  align-items: center;
 }

 .tb-hero--image_left .tb-hero__image {
  order: -1;
 }

 .tb-hero--centered .tb-hero__inner {
  grid-template-columns: 1fr;
  max-width: 760px;
  text-align: center;
 }

 .tb-hero--centered .tb-buttons {
  justify-content: center;
 }

 .tb-hero__headline {
  font-size: clamp(34px, 5vw, 52px);
  line-height: 1.05;
 }

 .tb-hero__description {
  margin-top: 18px;
  font-size: 17px;
  color: var(--site-muted);
 }

 @media (max-width: 720px) {
  .tb-hero__inner {
   grid-template-columns: 1fr;
  }

  .tb-hero--image_left .tb-hero__image {
   order: 0;
  }
 }
</style>
