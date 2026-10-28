<script setup>
 defineProps({ data: { type: Object, required: true } });
</script>

<template>
 <div class="tb-spacer" :class="`tb-spacer--${data.size}`" role="presentation">
  <hr v-if="data.line === 'line'" class="tb-wrap tb-spacer__line" />
 </div>
</template>

<style>
 .tb-spacer {
  display: flex;
  align-items: center;
 }

 .tb-spacer--small {
  height: 24px;
 }

 .tb-spacer--medium {
  height: 56px;
 }

 .tb-spacer--large {
  height: 104px;
 }

 .tb-spacer__line {
  border: 0;
  border-top: 1px solid var(--site-border);
 }
</style>
