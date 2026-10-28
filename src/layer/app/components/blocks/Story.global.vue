<script setup>
 // The about section: a photo beside the story of the place, signed by
 // whoever tells it. The photo sits on either side.
 defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();
</script>

<template>
 <section class="tb-section tb-story" :class="`tb-story--${data.layout}`">
  <div class="tb-wrap tb-story__inner">
   <TbImage :image="data.image" ratio="4 / 5" class="tb-story__image" />
   <div class="tb-story__text">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
    <TbRich v-if="shows('body', data.body)" :data="data" field="body" class="tb-story__body" />
    <TbText v-if="shows('note', data.note)" :data="data" field="note" tag="p" class="tb-story__note" />
   </div>
  </div>
 </section>
</template>

<style>
 .tb-story__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: clamp(28px, 4vw, 48px);
  align-items: center;
 }

 .tb-story--image_right .tb-story__inner {
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
 }

 .tb-story--image_right .tb-story__image {
  order: 1;
 }

 .tb-story__text {
  overflow-wrap: break-word;
 }

 .tb-story__body {
  margin-top: 16px;
  font-size: clamp(16px, 0.5vw + 14px, 18px);
  line-height: 1.7;
  color: var(--site-ink);
 }

 .tb-story__note {
  margin: 20px 0 0;
  font-family: var(--site-font-display);
  font-size: 17px;
  font-style: italic;
  line-height: 1.4;
  color: var(--site-eyebrow);
 }

 .tb-story__text > :first-child {
  margin-top: 0;
 }

 /* Small screens: the photo first, then the story under it. */
 @media (max-width: 720px) {
  .tb-story__inner,
  .tb-story--image_right .tb-story__inner {
   grid-template-columns: minmax(0, 1fr);
  }

  .tb-story--image_right .tb-story__image {
   order: 0;
  }

  .tb-story__image {
   max-width: 440px;
  }
 }
</style>
