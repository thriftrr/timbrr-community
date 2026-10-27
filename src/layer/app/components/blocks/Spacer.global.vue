<script setup>
 defineProps({ data: { type: Object, required: true } });
</script>

<template>
 <div class="tb-spacer" :class="`tb-spacer--${data.size}`" role="presentation">
  <hr v-if="data.line === 'line'" class="tb-wrap tb-spacer__line" />
 </div>
</template>
