<script setup>
 // A block's button: a link styled solid, outline, as text, or as a round
 // icon (schema/define.js, buttonSchema). It can carry an icon beside its
 // label (app/utils/button-icons.js); the icon style shows the icon alone,
 // an arrow when none is picked. Its label edits in place.
 const props = defineProps({
  data: { type: Object, required: true },
  field: { type: String, required: true }, // path to the button: 'buttons.0'
 });
 const style = computed(() => valueAt(props.data, `${props.field}.style`) || 'solid');
 // A key of BUTTON_ICONS, or an icon that brings its own paths.
 const icon = computed(() => {
  const picked = valueAt(props.data, `${props.field}.icon`);
  const paths = Array.isArray(picked?.paths) ? picked.paths : BUTTON_ICONS[picked];
  return paths ?? (style.value === 'icon' ? BUTTON_ICONS.arrow : null);
 });
</script>

<template>
 <a :href="safeHref(valueAt(data, `${field}.to`))" class="tb-button" :class="`tb-button--${style}`">
  <svg v-if="icon" class="tb-button__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
   <path v-for="d in icon" :key="d" :d="d" />
  </svg>
  <span class="tb-button__label"><TbText :data="data" :field="`${field}.label`" /></span>
 </a>
</template>
