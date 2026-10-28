<script setup>
 // Formatted prose in one readable column: an optional tagline and
 // headline over text with headings, lists and links, set left or centered.
 defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();
</script>

<template>
 <section class="tb-section tb-richtext" :class="`tb-richtext--${data.alignment}`">
  <div class="tb-wrap tb-richtext__inner">
   <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
   <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   <TbRich :data="data" field="content" class="tb-richtext__body" />
  </div>
 </section>
</template>

<style>
 /* A column narrow enough to read comfortably, centered on the page. */
 .tb-richtext__inner {
  max-width: 760px;
  overflow-wrap: break-word;
 }

 .tb-richtext--center .tb-richtext__inner {
  text-align: center;
 }

 .tb-richtext__body {
  font-size: clamp(16px, 0.5vw + 14px, 18px);
  line-height: 1.7;
  color: var(--site-ink);
 }

 .tb-richtext__body:not(:first-child) {
  margin-top: 18px;
 }

 /* Headings inside the text step down from the block's own headline. */
 .tb-richtext__body h2 {
  font-size: clamp(22px, 1vw + 16px, 27px);
 }

 .tb-richtext__body h3 {
  font-size: clamp(19px, 0.5vw + 16px, 21px);
 }

 .tb-richtext__body a {
  text-underline-offset: 0.15em;
 }

 /* A list item holds a paragraph; keep the items close together. */
 .tb-richtext__body li > p:last-child {
  margin-bottom: 0;
 }

 .tb-richtext__body li + li {
  margin-top: 0.4em;
 }

 /* Centered, the bullets and numbers stay beside their words. */
 .tb-richtext--center .tb-richtext__body ul,
 .tb-richtext--center .tb-richtext__body ol {
  padding-left: 0;
  list-style-position: inside;
 }

 .tb-richtext--center .tb-richtext__body li > p {
  display: inline;
 }
</style>
