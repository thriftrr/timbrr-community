<script setup>
 // A break between two parts of a page, as wide as its content: a thin
 // rule, three dots, or a rule with a small star in the middle (Leaf).
 // Drawn in the site's quiet border shades, the star in its eyebrow color.
 defineProps({ data: { type: Object, required: true } });
</script>

<template>
 <div class="tb-divider" :class="`tb-divider--${data.style}`" role="separator">
  <div class="tb-wrap tb-divider__inner">
   <template v-if="data.style === 'dots'">
    <span v-for="dot in 3" :key="dot" class="tb-divider__dot" />
   </template>
   <template v-else-if="data.style === 'leaf'">
    <span class="tb-divider__rule" />
    <svg class="tb-divider__star" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
     <path d="M12 1l2.7 8.3L23 12l-8.3 2.7L12 23l-2.7-8.3L1 12l8.3-2.7z" fill="currentColor" />
    </svg>
    <span class="tb-divider__rule" />
   </template>
   <span v-else class="tb-divider__rule" />
  </div>
 </div>
</template>

<style>
 .tb-divider {
  padding-block: calc(var(--site-space) / 4);
 }

 .tb-divider__inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
 }

 .tb-divider__rule {
  flex: 1 1 0;
  height: 1px;
  background: color-mix(in srgb, var(--site-border) 82%, var(--site-muted));
 }

 .tb-divider--dots .tb-divider__inner {
  gap: 10px;
 }

 .tb-divider__dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--site-muted) 60%, var(--site-bg));
 }

 .tb-divider__star {
  flex: none;
  color: var(--site-eyebrow);
 }
</style>
