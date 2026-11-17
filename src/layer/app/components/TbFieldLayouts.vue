<script setup>
 // A Flexible layouts field's value: each row, in order, with its layout's
 // fields drawn by their own kinds and labeled. A row's layout's key is on
 // it (data-layout), for a site's own styles.
 defineProps({
  rows: { type: Array, required: true }, // [{ layout: { key, label }, fields }]
 });
</script>

<template>
 <div class="tb-field-layouts">
  <section v-for="(row, at) in rows" :key="at" class="tb-field-layouts__row" :data-layout="row.layout.key">
   <div v-for="field in row.fields" :key="field.key" class="tb-field-layouts__field">
    <p class="tb-field-layouts__label">{{ field.label }}</p>
    <TbFieldValue :field="field" />
   </div>
  </section>
 </div>
</template>

<style>
 .tb-field-layouts {
  display: grid;
  gap: 20px;
 }

 .tb-field-layouts__row {
  display: grid;
  gap: 10px;
 }

 .tb-field-layouts__label {
  margin: 0 0 2px;
  font-size: 13px;
  color: var(--site-muted);
 }
</style>
