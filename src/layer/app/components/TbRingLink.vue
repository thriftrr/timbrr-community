<script setup>
 // A link a ring holds: a Link ring's { url, label, newTab } (or its
 // address alone), or a Page link's { title, path }. A path on this site
 // goes through the router; one opening in a new tab says so to screen
 // readers. Anything that isn't a safe address isn't drawn.
 const props = defineProps({
  value: { type: [Object, String], required: true },
  label: { type: String, default: '' },
 });
 const url = computed(() => safeHref(typeof props.value === 'string' ? props.value : (props.value.url ?? props.value.path)));
 const words = computed(() => props.label || (typeof props.value === 'object' ? props.value.label || props.value.title : '') || String(url.value ?? '').replace(/^(https?:\/\/|mailto:|tel:)/i, ''));
 const newTab = computed(() => typeof props.value === 'object' && props.value.newTab === true);
 const inside = computed(() => url.value?.startsWith('/') && !newTab.value);
</script>

<template>
 <NuxtLink v-if="url && inside" :to="url" class="tb-ring-value__link">{{ words }}</NuxtLink>
 <a v-else-if="url" :href="url" class="tb-ring-value__link" :target="newTab ? '_blank' : undefined" :rel="newTab ? 'noopener' : undefined">
  {{ words }}<span v-if="newTab" class="tb-ring-link__note"> (opens in a new tab)</span>
 </a>
</template>

<style>
 .tb-ring-link__note {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
 }
</style>
