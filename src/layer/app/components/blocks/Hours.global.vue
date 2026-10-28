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

<style>
 .tb-hours__inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: start;
 }

 .tb-hours__address {
  margin: 14px 0 0;
  color: var(--site-muted);
  white-space: pre-line;
 }

 .tb-hours__card {
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
  padding: 8px 22px;
  background: var(--site-surface);
 }

 .tb-hours__list {
  margin: 0;
 }

 .tb-hours__row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  font-size: 15px;
 }

 .tb-hours__row + .tb-hours__row {
  border-top: 1px solid var(--site-border);
 }

 .tb-hours__row dt {
  font-weight: 700;
  color: var(--site-heading);
 }

 .tb-hours__row dd {
  margin: 0;
  font-family: var(--site-font-mono);
  font-size: 13.5px;
 }

 .tb-hours__card .tb-note {
  margin: 4px 0 12px;
 }

 @media (max-width: 720px) {
  .tb-hours__inner {
   grid-template-columns: 1fr;
  }
 }
</style>
