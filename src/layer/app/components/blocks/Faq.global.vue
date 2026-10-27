<script setup>
 defineProps({ data: { type: Object, required: true } });
</script>

<template>
 <section class="tb-section tb-faq">
  <div class="tb-wrap tb-wrap--narrow">
   <header v-if="data.tagline || data.headline" class="tb-section__head tb-section__head--start">
    <TbText v-if="data.tagline" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="data.headline" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <dl class="tb-faq__list">
    <div v-for="(item, index) in data.items" :key="index" class="tb-faq__item">
     <TbText :data="data" :field="`items.${index}.question`" tag="dt" class="tb-faq__question" />
     <TbText :data="data" :field="`items.${index}.answer`" tag="dd" class="tb-faq__answer" multiline />
    </div>
   </dl>
  </div>
 </section>
</template>
