<script setup>
 // Cards in rows, two to four across, each a short title with a line or two
 // under it. A layout block: no heading of its own, so it can sit under any
 // block that has one.
 defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();
</script>

<template>
 <section class="tb-section tb-grid">
  <div class="tb-wrap">
   <ul v-if="data.items.length" class="tb-grid__list" :class="`tb-grid__list--${data.columns}`" role="list">
    <li v-for="(item, index) in data.items" :key="index" class="tb-card tb-grid__card">
     <TbText :data="data" :field="`items.${index}.title`" tag="h3" class="tb-card__title" />
     <TbRich v-if="shows(`items.${index}.body`, item.body)" :data="data" :field="`items.${index}.body`" class="tb-card__body" />
    </li>
   </ul>
  </div>
 </section>
</template>

<style>
 /* A grid sits a little tighter in the page than a section with a heading. */
 .tb-section.tb-grid {
  padding-block: calc(var(--site-space) * 0.75);
 }

 .tb-grid__list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(14px, 1.6vw, 18px);
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-grid__list--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
 }

 .tb-grid__list--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
 }

 .tb-grid .tb-grid__card {
  padding: clamp(18px, 2vw, 22px);
  overflow-wrap: break-word;
 }

 .tb-grid .tb-card__title {
  margin: 0;
  font-size: clamp(16px, 0.4vw + 14px, 18px);
  font-weight: 700;
  line-height: 1.3;
 }

 .tb-grid .tb-card__body {
  margin-top: 6px;
  font-size: 15px;
  line-height: 1.55;
 }

 /* Narrower screens: four across goes to two, three to two, then one. */
 @media (max-width: 960px) {
  .tb-grid__list--4 {
   grid-template-columns: repeat(2, minmax(0, 1fr));
  }
 }

 @media (max-width: 820px) {
  .tb-grid__list--3 {
   grid-template-columns: repeat(2, minmax(0, 1fr));
  }
 }

 @media (max-width: 540px) {
  .tb-grid__list--2,
  .tb-grid__list--3,
  .tb-grid__list--4 {
   grid-template-columns: minmax(0, 1fr);
  }
 }
</style>
