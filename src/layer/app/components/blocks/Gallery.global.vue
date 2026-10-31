<script setup>
 // Photos, two to four across, each with an optional caption under it: the
 // room, the food, finished jobs. Grid is square tiles. Masonry keeps each
 // photo's own shape, in columns that run on. Slider is a row of wider tiles
 // that scrolls sideways. Narrower screens take fewer across.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 // Masonry needs a shape before the photo arrives, so nothing moves as it
 // loads: its own, when the media library says what that is. A pasted address
 // or an empty tile takes the next of a few, so the columns still stagger.
 const STAGGER = ['4 / 5', '1 / 1', '3 / 4', '4 / 3'];

 function ratio(item, index) {
  if (props.data.layout === 'grid') return '1 / 1';
  if (props.data.layout === 'slider') return '4 / 3';
  const { width, height } = item.image;
  return width && height ? `${width} / ${height}` : STAGGER[index % STAGGER.length];
 }
</script>

<template>
 <section class="tb-section tb-gallery" :class="[`tb-gallery--${data.columns}`, `tb-gallery--${data.layout}`]">
  <div class="tb-wrap">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <ul
    v-if="data.items.length"
    class="tb-gallery__grid"
    :class="{ 'tb-slider': data.layout === 'slider' }"
    :style="data.layout === 'slider' ? { '--tb-slider-across': data.columns } : undefined"
    :tabindex="data.layout === 'slider' ? 0 : undefined"
    role="list"
   >
    <li v-for="(item, index) in data.items" :key="index">
     <figure class="tb-gallery__item">
      <TbImage :image="item.image" :ratio="ratio(item, index)" />
      <TbText v-if="shows(`items.${index}.caption`, item.caption)" :data="data" :field="`items.${index}.caption`" tag="figcaption" class="tb-gallery__caption" />
     </figure>
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 .tb-gallery--grid .tb-gallery__grid {
  display: grid;
  grid-template-columns: repeat(var(--tb-gallery-columns, 3), minmax(0, 1fr));
  gap: clamp(10px, 1.4vw, 16px);
  align-items: start;
  margin: 0;
  padding: 0;
  list-style: none;
 }

 /* Masonry: newspaper columns, each photo whole at the foot of the last. */
 .tb-gallery--masonry .tb-gallery__grid {
  column-count: var(--tb-gallery-columns, 3);
  column-gap: clamp(10px, 1.4vw, 16px);
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-gallery--masonry .tb-gallery__grid > li {
  margin-bottom: clamp(10px, 1.4vw, 16px);
  break-inside: avoid;
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
