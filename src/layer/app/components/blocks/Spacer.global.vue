<script setup>
 // Empty room between two blocks, in four sizes that follow the site's own
 // spacing, so a phone gets less of it than a wide screen. In the studio's
 // canvas, faint dashed lines mark its top and bottom so there's something
 // to see and click; they're drawn over it, and never on the site.
 defineProps({ data: { type: Object, required: true } });

 const canvas = useCanvas();
 const guides = computed(() => Boolean(canvas) && canvas.editable?.value !== false);
</script>

<template>
 <div class="tb-spacer" :class="`tb-spacer--${data.size}`" aria-hidden="true">
  <span v-if="guides" class="tb-spacer__guides" />
 </div>
</template>

<style>
 /* The sizes are shares of the site's section spacing: on a wide screen
    about 29, 58, 97 and 144px; on a phone 16, 32, 53 and 79px. M is the
    default. */
 .tb-spacer {
  position: relative;
  height: calc(var(--site-space) * 0.66);
 }

 .tb-spacer--sm {
  height: calc(var(--site-space) / 3);
 }

 .tb-spacer--lg {
  height: calc(var(--site-space) * 1.1);
 }

 .tb-spacer--xl {
  height: calc(var(--site-space) * 1.64);
 }

 /* Canvas only: lines along the top and bottom, as wide as the page's
    content. */
 .tb-spacer__guides {
  position: absolute;
  inset-block: 0;
  inset-inline: max(var(--site-gutter), (100% - var(--site-max)) / 2);
  border-block: calc(1px * var(--tb-ui, 1)) dashed #e3d9c2;
  opacity: 0.7;
  pointer-events: none;
 }
</style>
