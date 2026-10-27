<script setup>
 defineProps({ data: { type: Object, required: true } });
</script>

<template>
 <section class="tb-section tb-hours">
  <div class="tb-wrap tb-hours__inner">
   <div>
    <TbText v-if="data.tagline" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="data.headline" :data="data" field="headline" tag="h2" class="tb-heading" />
    <TbText v-if="data.address" :data="data" field="address" tag="p" class="tb-hours__address" multiline />
   </div>
   <div class="tb-hours__card">
    <dl class="tb-hours__list">
     <div v-for="(item, index) in data.items" :key="index" class="tb-hours__row">
      <TbText :data="data" :field="`items.${index}.days`" tag="dt" />
      <TbText :data="data" :field="`items.${index}.hours`" tag="dd" />
     </div>
    </dl>
    <TbText v-if="data.note" :data="data" field="note" tag="p" class="tb-note" />
   </div>
  </div>
 </section>
</template>
