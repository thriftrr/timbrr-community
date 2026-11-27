<script setup>
 // Copy: a headline over formatted text, in one readable column, centered
 // on the page. Nothing else; the look (background, spacing) comes from
 // the fields every block has.
 defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();
</script>

<template>
 <section class="tb-section tb-copy">
  <div class="tb-wrap tb-copy__inner">
   <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   <TbRich v-if="shows('body', data.body)" :data="data" field="body" class="tb-copy__body" />
  </div>
 </section>
</template>

<style>
 /* A column narrow enough to read comfortably, centered on the page. */
 .tb-copy__inner {
  max-width: 760px;
  overflow-wrap: break-word;
  text-align: center;
 }

 .tb-copy__inner > :first-child {
  margin-top: 0;
 }

 .tb-copy__body {
  font-size: clamp(16px, 0.5vw + 14px, 18px);
  line-height: 1.7;
  color: var(--site-ink);
 }

 .tb-copy__body:not(:first-child) {
  margin-top: 16px;
 }

 /* Headings inside the text step down from the block's own headline. */
 .tb-copy__body h2 {
  font-size: clamp(22px, 1vw + 16px, 27px);
 }

 .tb-copy__body h3 {
  font-size: clamp(19px, 0.5vw + 16px, 21px);
 }

 .tb-copy__body a {
  text-underline-offset: 0.15em;
 }

 /* A list item holds a paragraph; keep the items close together. */
 .tb-copy__body li > p:last-child {
  margin-bottom: 0;
 }

 .tb-copy__body li + li {
  margin-top: 0.4em;
 }

 /* Centered, the bullets and numbers stay beside their words. */
 .tb-copy__body ul,
 .tb-copy__body ol {
  padding-left: 0;
  list-style-position: inside;
 }

 .tb-copy__body li > p {
  display: inline;
 }

 /* In a Split's column it takes the column's width and reads from the left. */
 .tb-in-column .tb-copy__inner {
  max-width: none;
  text-align: left;
 }
</style>
