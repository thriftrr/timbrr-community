<script setup>
 defineProps({ data: { type: Object, required: true } });
</script>

<template>
 <section class="tb-section tb-columns">
  <div class="tb-wrap">
   <header v-if="data.tagline || data.headline || data.intro" class="tb-section__head">
    <TbText v-if="data.tagline" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="data.headline" :data="data" field="headline" tag="h2" class="tb-heading" />
    <TbText v-if="data.intro" :data="data" field="intro" tag="p" class="tb-lede" multiline />
   </header>
   <div class="tb-columns__grid" :style="{ '--tb-cols': Math.max(2, Math.min(4, data.items.length)) }">
    <article v-for="(item, index) in data.items" :key="index" class="tb-card">
     <TbText v-if="item.eyebrow" :data="data" :field="`items.${index}.eyebrow`" tag="span" class="tb-card__badge" />
     <TbText :data="data" :field="`items.${index}.title`" tag="h3" class="tb-card__title" />
     <TbText :data="data" :field="`items.${index}.body`" tag="p" class="tb-card__body" multiline />
    </article>
   </div>
  </div>
 </section>
</template>

<style>
 .tb-columns__grid {
  display: grid;
  grid-template-columns: repeat(var(--tb-cols, 3), minmax(0, 1fr));
  gap: 18px;
 }

 @media (max-width: 720px) {
  .tb-columns__grid {
   grid-template-columns: 1fr;
  }
 }
</style>
