<script setup>
 // The way back above a page's title: steps with a small arrow between. A step
 // with an address is a link; one without (the page itself) is plain words
 // marked as the current page. Empty steps are skipped.
 const props = defineProps({ data: { type: Object, required: true } });
 const steps = computed(() =>
  (props.data.items ?? [])
   .map((item, index) => ({ index, label: String(item.label ?? '').trim(), to: safeHref(entryHref(item.to)) }))
   .filter((step) => step.label),
 );
</script>

<template>
 <nav class="tb-section tb-breadcrumb" aria-label="Breadcrumb">
  <div class="tb-wrap">
   <ol class="tb-breadcrumb__list">
    <li v-for="(step, at) in steps" :key="step.index" class="tb-breadcrumb__step">
     <NuxtLink v-if="step.to" :to="step.to">{{ step.label }}</NuxtLink>
     <span v-else :aria-current="at === steps.length - 1 ? 'page' : undefined">{{ step.label }}</span>
     <svg v-if="at < steps.length - 1" class="tb-breadcrumb__sep" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path v-for="d in UI_ICONS.chevronRight" :key="d" :d="d" /></svg>
    </li>
   </ol>
  </div>
 </nav>
</template>

<style>
 .tb-breadcrumb {
  padding-block: 18px 0;
 }

 .tb-breadcrumb__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 14.5px;
 }

 .tb-breadcrumb__step {
  display: inline-flex;
  align-items: center;
  gap: 8px;
 }

 .tb-breadcrumb__step a {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  font-weight: 600;
  color: var(--site-accent);
  text-decoration: none;
 }

 .tb-breadcrumb__step a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
 }

 .tb-breadcrumb__step span {
  color: var(--site-muted);
 }

 .tb-breadcrumb__sep {
  color: var(--site-muted);
 }
</style>
