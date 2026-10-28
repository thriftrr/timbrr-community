<script setup>
 // Photos in a grid of square tiles, two to four across, each with an
 // optional caption under it: the room, the food, finished jobs. Narrower
 // screens take fewer across.
 defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();
</script>

<template>
 <section class="tb-section tb-gallery" :class="`tb-gallery--${data.columns}`">
  <div class="tb-wrap">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <ul v-if="data.items.length" class="tb-gallery__grid" role="list">
    <li v-for="(item, index) in data.items" :key="index">
     <figure class="tb-gallery__item">
      <TbImage :image="item.image" ratio="1 / 1" />
      <TbText v-if="shows(`items.${index}.caption`, item.caption)" :data="data" :field="`items.${index}.caption`" tag="figcaption" class="tb-gallery__caption" />
     </figure>
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 .tb-gallery__grid {
  display: grid;
  grid-template-columns: repeat(var(--tb-gallery-columns, 3), minmax(0, 1fr));
  gap: clamp(10px, 1.4vw, 16px);
  align-items: start;
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-gallery--2 {
  --tb-gallery-columns: 2;
 }

 .tb-gallery--4 {
  --tb-gallery-columns: 4;
 }

 .tb-gallery__item {
  margin: 0;
 }

 .tb-gallery__caption {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.4;
  color: var(--site-muted);
  text-align: center;
  overflow-wrap: break-word;
 }

 @media (max-width: 960px) {
  .tb-gallery--4 {
   --tb-gallery-columns: 3;
  }
 }

 @media (max-width: 720px) {
  .tb-gallery {
   --tb-gallery-columns: 2;
  }
 }
</style>
