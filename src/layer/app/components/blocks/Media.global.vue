<script setup>
 // One photo with an optional caption: in the page's column (Normal), or
 // from edge to edge (Wide).
 defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();
</script>

<template>
 <section class="tb-section tb-media" :class="`tb-media--${data.width}`">
  <figure class="tb-media__figure" :class="{ 'tb-wrap': data.width !== 'wide' }">
   <TbImage :image="data.image" ratio="16 / 9" class="tb-media__image" />
   <TbText
    v-if="shows('caption', data.caption)"
    :data="data"
    field="caption"
    tag="figcaption"
    class="tb-media__caption"
    :class="{ 'tb-wrap': data.width === 'wide' }"
   />
  </figure>
 </section>
</template>

<style>
 /* A photo sits a little tighter in the page than a section of text. */
 .tb-section.tb-media {
  padding-block: calc(var(--site-space) * 0.75);
 }

 .tb-media__figure {
  margin-block: 0;
 }

 /* Wide runs edge to edge: square corners, and a height that follows the
    screen instead of the 16:9 shape, so it never fills a big monitor. */
 .tb-media--wide .tb-media__figure {
  margin-inline: 0;
 }

 .tb-media--wide .tb-media__image {
  height: clamp(240px, 50vw, 720px);
  border-radius: 0;
 }

 .tb-media__caption {
  margin-top: 12px;
  font-size: 15px;
  font-style: italic;
  line-height: 1.5;
  color: var(--site-muted);
  text-align: center;
 }
</style>
