<script setup>
 defineProps({ data: { type: Object, required: true } });
</script>

<template>
 <section class="tb-section tb-testimonials">
  <div class="tb-wrap">
   <header v-if="data.tagline || data.headline" class="tb-section__head">
    <TbText v-if="data.tagline" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="data.headline" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <div class="tb-testimonials__grid">
    <figure v-for="(item, index) in data.items" :key="index" class="tb-quote">
     <TbText :data="data" :field="`items.${index}.quote`" tag="blockquote" class="tb-quote__text" multiline />
     <figcaption class="tb-quote__by">
      <TbText :data="data" :field="`items.${index}.name`" tag="strong" />
      <TbText v-if="item.role" :data="data" :field="`items.${index}.role`" tag="span" />
     </figcaption>
    </figure>
   </div>
  </div>
 </section>
</template>

<style>
 .tb-testimonials__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 18px;
 }

 .tb-quote {
  margin: 0;
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
  padding: 22px;
  background: var(--site-bg);
 }

 .tb-quote__text {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--site-heading);
  white-space: pre-line;
 }

 .tb-quote__by {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  font-size: 13px;
 }

 .tb-quote__by span {
  color: var(--site-muted);
 }
</style>
