<script setup>
 // North Wall's ridge (their page separator's own outline), drawn over the
 // bottom of the block above: the block is pulled up by the ridge's height,
 // so nothing above it moves. The ridge and the room under it take the
 // block's Background; Spacing says how much room. The root never paints
 // the look's background itself, or it would cover what it's cutting into.
 defineProps({ data: { type: Object, required: true } });
</script>

<template>
 <div class="nw-edge" :class="[`nw-edge--${data.height}`, `nw-edge--${data.background}`, `nw-edge--room-${data.spacing}`, { 'nw-edge--flip': data.flip }]" aria-hidden="true">
  <svg class="nw-edge__ridge" viewBox="0 0 1440 144" preserveAspectRatio="none">
   <path d="M0 144V139H9.5L24 125.5H44L142 39.5L164.5 65L229.5 0L290.5 55L303 35.5L338 80.5L342.5 72L354 88.5L419 55L483.5 95L506.5 78L600.5 130.5H621.5L638.5 141.5H1440V144Z" />
  </svg>
  <div class="nw-edge__room" />
 </div>
</template>

<style>
 .nw-edge {
  --nw-edge-height: clamp(40px, 9vw, 130px);
  --nw-edge-fill: var(--site-bg);
  position: relative;
  z-index: 2;
  margin-top: calc(var(--nw-edge-height) * -1);
  pointer-events: none;
 }

 /* Over the look's own background (site.css): the ridge is the only paint. */
 .nw-edge[class*='tb-look--'] {
  background: none;
 }

 .nw-edge--low {
  --nw-edge-height: clamp(28px, 6vw, 84px);
 }

 .nw-edge--tall {
  --nw-edge-height: clamp(56px, 13vw, 190px);
 }

 .nw-edge--soft {
  --nw-edge-fill: var(--site-surface);
 }

 .nw-edge--brand {
  --nw-edge-fill: var(--site-accent);
 }

 .nw-edge--dark {
  --nw-edge-fill: var(--site-dark);
 }

 .nw-edge__ridge {
  display: block;
  width: 100%;
  height: var(--nw-edge-height);
  /* A hair over the room below, so no line shows between them. */
  margin-bottom: -1px;
  fill: var(--nw-edge-fill);
 }

 .nw-edge--flip .nw-edge__ridge {
  transform: scaleX(-1);
 }

 .nw-edge__room {
  height: 0;
  background: var(--nw-edge-fill);
 }

 .nw-edge--room-normal .nw-edge__room {
  height: calc(var(--site-space) * 0.5);
 }

 .nw-edge--room-roomy .nw-edge__room {
  height: var(--site-space);
 }

 /* On the canvas it has to take a click, to be selected and moved. */
 .tb-frame .nw-edge {
  pointer-events: auto;
 }
</style>
