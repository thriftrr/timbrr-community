<script setup>
 // A block's image. Until there is one, a quiet panel in the brand color
 // holds its place (and, in the studio's canvas, says what goes there).
 const props = defineProps({
  image: { type: Object, default: null },
  ratio: { type: String, default: '4 / 3' },
 });

 const canvas = useCanvas();
 const src = computed(() => safeSrc(props.image?.src));
</script>

<template>
 <img v-if="src" :src="src" :alt="image.alt" class="tb-image" :style="{ aspectRatio: ratio }" loading="lazy" />
 <div v-else class="tb-image tb-image--empty" :style="{ aspectRatio: ratio }" role="presentation">
  <span v-if="canvas" class="tb-image__hint">Add an image in the panel on the right</span>
 </div>
</template>
