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
