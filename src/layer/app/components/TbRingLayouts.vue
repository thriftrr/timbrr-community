<script setup>
 // A Flexible layouts ring's value: each row, in order, with its layout's
 // rings drawn by their own kinds and labeled. A row's layout's key is on
 // it (data-layout), for a site's own styles.
 defineProps({
  rows: { type: Array, required: true }, // [{ layout: { key, label }, rings }]
 });
</script>

<template>
 <div class="tb-ring-layouts">
  <section v-for="(row, at) in rows" :key="at" class="tb-ring-layouts__row" :data-layout="row.layout.key">
   <div v-for="ring in row.rings" :key="ring.key" class="tb-ring-layouts__ring">
    <p class="tb-ring-layouts__label">{{ ring.label }}</p>
    <TbRingValue :ring="ring" />
   </div>
  </section>
 </div>
</template>

<style>
 .tb-ring-layouts {
  display: grid;
  gap: 20px;
 }

 .tb-ring-layouts__row {
  display: grid;
  gap: 10px;
 }

 .tb-ring-layouts__label {
  margin: 0 0 2px;
  font-size: 13px;
  color: var(--site-muted);
 }
</style>
