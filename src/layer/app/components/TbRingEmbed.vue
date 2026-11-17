<script setup>
 // An Embed ring's value (docs/README.md § Groves): a YouTube or Vimeo
 // address as its player, built from the video's id alone (embedSrc, the
 // Media block's own rule); any other address as a plain link.
 const props = defineProps({
  value: { type: Object, required: true }, // { url }
  aspect: { type: String, default: '16:9' },
  label: { type: String, default: '' },
 });
 const src = computed(() => embedSrc(props.value?.url));
 const ratio = computed(() => ({ '16:9': '16 / 9', '4:3': '4 / 3', '1:1': '1 / 1' })[props.aspect] ?? '16 / 9');
</script>

<template>
 <div v-if="src" class="tb-ring-embed" :style="{ aspectRatio: ratio }">
  <iframe :src="src" :title="label || 'Video'" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen />
 </div>
 <a v-else-if="safeHref(value?.url)" :href="safeHref(value.url)" class="tb-ring-value__link" rel="noopener">{{ label || value.url.replace(/^https:\/\//, '') }}</a>
</template>

<style>
 .tb-ring-embed {
  overflow: hidden;
  border-radius: var(--site-radius);
  background: var(--site-surface);
 }

 .tb-ring-embed iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
 }
</style>
