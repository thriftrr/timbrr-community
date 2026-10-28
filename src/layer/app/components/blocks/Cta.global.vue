<script setup>
 defineProps({ data: { type: Object, required: true } });
</script>

<template>
 <section class="tb-section tb-cta">
  <div class="tb-wrap">
   <div class="tb-cta__panel" :class="`tb-cta__panel--${data.tone}`">
    <div class="tb-cta__text">
     <TbText :data="data" field="headline" tag="h2" class="tb-heading" />
     <TbText v-if="data.description" :data="data" field="description" tag="p" class="tb-cta__description" multiline />
    </div>
    <div v-if="data.buttons.length" class="tb-buttons">
     <TbButton v-for="(button, index) in data.buttons" :key="index" :data="data" :field="`buttons.${index}`" />
    </div>
   </div>
  </div>
 </section>
</template>

<style>
 .tb-cta__panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border-radius: calc(var(--site-radius) + 4px);
  padding: clamp(28px, 5vw, 48px);
 }

 .tb-cta__panel .tb-buttons {
  margin-top: 0;
 }

 .tb-cta__text {
  flex: 1 1 320px;
 }

 .tb-cta__description {
  margin: 10px 0 0;
  white-space: pre-line;
 }

 .tb-cta__panel--accent {
  background: var(--site-accent);
  color: var(--site-accent-ink);
 }

 .tb-cta__panel--dark {
  background: var(--site-dark);
  color: var(--site-dark-ink);
 }

 .tb-cta__panel--accent .tb-heading,
 .tb-cta__panel--dark .tb-heading {
  color: inherit;
 }

 .tb-cta__panel--accent .tb-button--solid {
  border-color: var(--site-accent-ink);
  background: var(--site-accent-ink);
  color: var(--site-accent);
 }

 .tb-cta__panel--accent .tb-button--outline,
 .tb-cta__panel--dark .tb-button--outline {
  border-color: currentColor;
  color: inherit;
 }

 .tb-cta__panel--soft {
  border: 1px solid var(--site-border);
  background: var(--site-surface);
 }
</style>
