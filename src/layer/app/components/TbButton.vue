<script setup>
 // A block's button: a link styled solid or outline. Its label edits in place.
 defineProps({
  data: { type: Object, required: true },
  field: { type: String, required: true }, // path to the button: 'buttons.0'
 });
</script>

<template>
 <a
  :href="safeHref(valueAt(data, `${field}.to`))"
  class="tb-button"
  :class="`tb-button--${valueAt(data, `${field}.style`) || 'solid'}`"
 >
  <TbText :data="data" :field="`${field}.label`" />
 </a>
</template>
