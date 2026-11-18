<script setup>
 // One ring of a sapling. The studio binds the value in as `data.sapling`
 // when it serves the page (and, in its canvas, as it sends the page over:
 // the working copy of the sapling picked there); with none (a ring the
 // sapling leaves empty, or no sapling) it draws nothing. On the canvas,
 // with no value to show, it says which ring it stands for.
 //
 // A date, a number, a picture and a link each take the block's own choices
 // for them. They go by the kind the value really has, never by what the
 // block was told, so a ring whose kind changed still draws as what it is.
 const props = defineProps({ data: { type: Object, required: true } });
 const canvas = useCanvas();
 const sapling = computed(() => (props.data.sapling && typeof props.data.sapling === 'object' ? props.data.sapling : null));

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
  const { kind, value, text } = sapling.value;
  if (kind === 'date' || kind === 'datetime') {
   // A date and time is the site's own local time as typed (2030-05-01T18:30): read as UTC so no zone moves it.
   const date = new Date(kind === 'date' ? `${value}T12:00:00Z` : `${value}:00Z`);
   if (Number.isNaN(date.getTime())) return text;
   const day = date.toLocaleDateString('en-US', { ...(DATES[props.data.date_style] ?? DATES.long), timeZone: 'UTC' });
   return kind === 'date' ? day : `${day}, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })}`;
  }
  if (kind === 'number' || kind === 'range') {
   const number = Number(value);
   const style = props.data.number_style;
   const shown = !Number.isFinite(number) || style === 'plain' || !style ? text : number.toLocaleString('en-US', style === 'decimals' ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : {});
   return `${props.data.number_before ?? ''}${shown}${props.data.number_after ?? ''}`;
  }
  return text;
 });
 const worded = computed(() => ['date', 'datetime', 'number', 'range'].includes(sapling.value?.kind));
</script>

<template>
 <section v-if="sapling || canvas || data.empty" class="tb-section tb-grove-ring" :class="[`tb-grove-ring--${data.show}`, sapling?.kind === 'image' ? `tb-grove-ring--${data.image_size || 'full'}` : '']">
  <div class="tb-wrap">
   <template v-if="sapling">
    <h1 v-if="data.show === 'heading'" class="tb-heading tb-grove-ring__heading">{{ words }}</h1>
    <template v-else>
     <p v-if="data.show === 'labeled'" class="tb-eyebrow">{{ sapling.label }}</p>
     <div class="tb-grove-ring__value">
      <template v-if="worded">{{ words }}</template>
      <TbRingValue v-else :ring="sapling" :label="data.link_text" :ratio="RATIOS[data.image_shape]" />
     </div>
    </template>
   </template>
   <p v-else-if="!canvas" class="tb-grove-ring__value">{{ data.empty }}</p>
   <p v-else class="tb-grove-ring__stand-in">{{ data.ring || 'No ring picked' }}<template v-if="data.via"> of the sapling {{ data.via }} names</template><span> · the sapling's value shows here</span></p>
  </div>
 </section>
</template>

<style>
 /* Rings stack close: a template is often a run of them. */
 .tb-section.tb-grove-ring {
  padding-block: calc(var(--site-space-above, var(--site-space)) * 0.25) calc(var(--site-space-below, var(--site-space)) * 0.25);
 }

 .tb-grove-ring__heading {
  margin: 0;
 }

 .tb-grove-ring__value {
  max-width: 68ch;
  font-size: 17px;
  line-height: 1.65;
  color: var(--site-body);
 }

 .tb-grove-ring--full .tb-grove-ring__value:has(.tb-image) {
  max-width: none;
 }

 .tb-grove-ring--medium .tb-grove-ring__value:has(.tb-image) {
  max-width: 640px;
 }

 .tb-grove-ring--small .tb-grove-ring__value:has(.tb-image) {
  max-width: 320px;
 }

 .tb-grove-ring__stand-in {
  margin: 0;
  border: 1.5px dashed var(--site-border);
  border-radius: var(--site-control-radius);
  padding: 12px 14px;
  font: 13px/1.4 ui-monospace, monospace;
  color: var(--site-heading);
 }

 .tb-grove-ring__stand-in span {
  color: var(--site-muted);
 }
</style>
