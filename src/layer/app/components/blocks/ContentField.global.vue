<script setup>
 // One field of a content entry. The studio binds the value in as
 // `data.entry` when it serves the page (and, in its canvas, as it sends the
 // page over: the working copy of the entry picked there); with none (a
 // field the entry leaves empty, or no entry) it draws nothing. On the
 // canvas, with no value to show, it says which field it stands for.
 //
 // A date, a number, a picture and a link each take the block's own choices
 // for them. They go by the kind the value really has, never by what the
 // block was told, so a field whose kind changed still draws as what it is.
 const props = defineProps({ data: { type: Object, required: true } });
 const canvas = useCanvas();
 const entry = computed(() => (props.data.entry && typeof props.data.entry === 'object' ? props.data.entry : null));

 const DATES = {
  long: { month: 'long', day: 'numeric', year: 'numeric' },
  short: { month: 'short', day: 'numeric', year: 'numeric' },
  weekday: { weekday: 'long', month: 'long', day: 'numeric' },
  numeric: { month: 'numeric', day: 'numeric', year: 'numeric' },
  month: { month: 'long', year: 'numeric' },
 };
 const RATIOS = { wide: '16 / 9', photo: '3 / 2', square: '1 / 1', tall: '4 / 5', natural: 'auto' };

 // The value as words, where the block has a say in them; else as it came.
 const words = computed(() => {
  const { kind, value, text } = entry.value;
  if (kind === 'date') {
   const date = new Date(`${value}T12:00:00Z`);
   return Number.isNaN(date.getTime()) ? text : date.toLocaleDateString('en-US', { ...(DATES[props.data.date_style] ?? DATES.long), timeZone: 'UTC' });
  }
  if (kind === 'number' || kind === 'range') {
   const number = Number(value);
   const style = props.data.number_style;
   const shown = !Number.isFinite(number) || style === 'plain' || !style ? text : number.toLocaleString('en-US', style === 'decimals' ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : {});
   return `${props.data.number_before ?? ''}${shown}${props.data.number_after ?? ''}`;
  }
  return text;
 });
 const worded = computed(() => ['date', 'number', 'range'].includes(entry.value?.kind));
</script>

<template>
 <section v-if="entry || canvas" class="tb-section tb-content-field" :class="[`tb-content-field--${data.show}`, entry?.kind === 'image' ? `tb-content-field--${data.image_size || 'full'}` : '']">
  <div class="tb-wrap">
   <template v-if="entry">
    <h1 v-if="data.show === 'heading'" class="tb-heading tb-content-field__heading">{{ words }}</h1>
    <template v-else>
     <p v-if="data.show === 'labeled'" class="tb-eyebrow">{{ entry.label }}</p>
     <div class="tb-content-field__value">
      <template v-if="worded">{{ words }}</template>
      <TbContentValue v-else :field="entry" :label="data.link_text" :ratio="RATIOS[data.image_shape]" />
     </div>
    </template>
   </template>
   <p v-else class="tb-content-field__stand-in">{{ data.field || 'No field picked' }}<span> · the entry's value shows here</span></p>
  </div>
 </section>
</template>

<style>
 /* Fields stack close: a template is often a run of them. */
 .tb-section.tb-content-field {
  padding-block: calc(var(--site-space) * 0.25);
 }

 .tb-content-field__heading {
  margin: 0;
 }

 .tb-content-field__value {
  max-width: 68ch;
  font-size: 17px;
  line-height: 1.65;
  color: var(--site-body);
 }

 .tb-content-field--full .tb-content-field__value:has(.tb-image) {
  max-width: none;
 }

 .tb-content-field--medium .tb-content-field__value:has(.tb-image) {
  max-width: 640px;
 }

 .tb-content-field--small .tb-content-field__value:has(.tb-image) {
  max-width: 320px;
 }

 .tb-content-field__stand-in {
  margin: 0;
  border: 1.5px dashed var(--site-border);
  border-radius: var(--site-control-radius);
  padding: 12px 14px;
  font: 13px/1.4 ui-monospace, monospace;
  color: var(--site-heading);
 }

 .tb-content-field__stand-in span {
  color: var(--site-muted);
 }
</style>
