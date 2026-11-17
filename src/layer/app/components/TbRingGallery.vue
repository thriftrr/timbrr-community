<script setup>
 // A Gallery ring's value: its pictures in order, as a grid. A picture
 // sent as its address alone (the ring's "what the site gets") is drawn
 // from that address.
 const props = defineProps({
  value: { type: Array, required: true },
  ratio: { type: String, default: '4 / 3' },
 });
 const images = computed(() => props.value.map((one) => (typeof one === 'string' ? { src: one, alt: '' } : one)).filter((one) => one?.src));
</script>

<template>
 <ul class="tb-ring-gallery">
  <li v-for="(image, at) in images" :key="`${image.src}-${at}`">
   <TbImage :image="image" :ratio="ratio" sizes="(min-width: 720px) 360px, 50vw" />
  </li>
 </ul>
</template>

<style>
 .tb-ring-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 180px), 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-ring-gallery li {
  overflow: hidden;
  border-radius: var(--site-radius);
 }
</style>
