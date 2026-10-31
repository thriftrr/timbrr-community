<script setup>
 // Words with a photo on either side, or on their own in one readable
 // column, set left or centered. The photo sits first on small screens.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 const alone = computed(() => props.data.image_side === 'none');
</script>

<template>
 <section class="tb-section tb-text-image" :class="`tb-text-image--${data.image_side}`">
  <div class="tb-wrap tb-text-image__inner" :class="{ 'tb-wrap--narrow': alone, 'tb-text-image__inner--center': alone && data.alignment === 'center' }">
   <TbImage v-if="!alone" :image="data.image" ratio="4 / 5" sizes="(min-width: 720px) 500px, 100vw" class="tb-text-image__image" />
   <div class="tb-text-image__text">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
    <TbRich v-if="shows('body', data.body)" :data="data" field="body" class="tb-text-image__body" />
    <TbText v-if="shows('note', data.note)" :data="data" field="note" tag="p" class="tb-text-image__note" />
   </div>
  </div>
 </section>
</template>

<style>
 .tb-text-image__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(28px, 4vw, 48px);
  align-items: center;
 }

 .tb-text-image--left .tb-text-image__inner {
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
 }

 .tb-text-image--right .tb-text-image__inner {
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
 }

 .tb-text-image--right .tb-text-image__image {
  order: 1;
 }

 .tb-text-image__inner--center {
  text-align: center;
 }

 .tb-text-image__text {
  overflow-wrap: break-word;
 }

 .tb-text-image__text > :first-child {
  margin-top: 0;
 }

 .tb-text-image__body {
  margin-top: 16px;
  font-size: clamp(16px, 0.5vw + 14px, 18px);
  line-height: 1.7;
  color: var(--site-ink);
 }

 .tb-text-image__note {
  margin: 20px 0 0;
  font-family: var(--site-font-display);
  font-size: 17px;
  font-style: italic;
  line-height: 1.4;
  color: var(--site-eyebrow);
 }

 /* Small screens: the photo first, then the words under it. */
 @media (max-width: 720px) {
  .tb-text-image--left .tb-text-image__inner,
  .tb-text-image--right .tb-text-image__inner {
   grid-template-columns: minmax(0, 1fr);
  }

  .tb-text-image--right .tb-text-image__image {
   order: 0;
  }

  .tb-text-image__image {
   max-width: 440px;
  }
 }
</style>
