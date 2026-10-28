<script setup>
 // Opening hours: the headline, a status line by a dot and a note for
 // holidays on one side, the days and their hours in a card on the other.
 // The status line is typed in, not worked out from the clock. Anything
 // left empty isn't drawn, and smaller screens put the card under the rest.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 const hasNote = computed(() => shows('note', props.data.note));
 const hasIntro = computed(() => shows('tagline', props.data.tagline) || shows('headline', props.data.headline) || shows('status', props.data.status) || hasNote.value);
</script>

<template>
 <section class="tb-section tb-hours">
  <div class="tb-wrap tb-hours__inner" :class="{ 'tb-hours__inner--one': !hasIntro || !data.items.length }">
   <div v-if="hasIntro" class="tb-hours__intro">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
    <p v-if="shows('status', data.status)" class="tb-hours__status">
     <span class="tb-hours__dot" aria-hidden="true"></span>
     <TbText :data="data" field="status" />
    </p>
    <TbRich v-if="hasNote" :data="data" field="note" class="tb-hours__note" />
   </div>
   <dl v-if="data.items.length" class="tb-card tb-hours__card">
    <div v-for="(item, index) in data.items" :key="index" class="tb-hours__row">
     <TbText :data="data" :field="`items.${index}.title`" tag="dt" class="tb-hours__days" />
     <TbText :data="data" :field="`items.${index}.body`" tag="dd" class="tb-hours__time" />
    </div>
   </dl>
  </div>
 </section>
</template>

<style>
 .tb-hours__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: clamp(28px, 4vw, 40px);
  align-items: start;
 }

 /* Only the words, or only the days: one column, kept to a readable width. */
 .tb-hours__inner--one {
  grid-template-columns: minmax(0, 1fr);
  max-width: 640px;
 }

 .tb-hours__intro {
  overflow-wrap: break-word;
 }

 .tb-hours__intro > :first-child {
  margin-top: 0;
 }

 /* The status: a soft pill in the brand color, with a dot that has a ring. */
 .tb-hours__status {
  display: flex;
  align-items: center;
  gap: 9px;
  width: fit-content;
  max-width: 100%;
  margin: 18px 0 0;
  border-radius: 999px;
  padding: 7px 15px 7px 11px;
  background: color-mix(in srgb, var(--site-accent) 8%, var(--site-surface));
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
  color: color-mix(in srgb, var(--site-accent) 70%, var(--site-heading));
 }

 .tb-hours__dot {
  flex: none;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--site-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--site-accent) 18%, transparent);
 }

 .tb-hours__note {
  margin-top: 16px;
  font-size: 15px;
  line-height: 1.55;
  color: var(--site-muted);
 }

 /* The days: name on the left, hours in mono on the right, a rule
    between each. */
 .tb-hours .tb-hours__card {
  margin: 0;
  padding: 8px clamp(18px, 2.2vw, 22px);
 }

 .tb-hours__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: clamp(12px, 1.4vw, 14px) 0;
 }

 .tb-hours__row + .tb-hours__row {
  border-top: 1px solid var(--site-border);
 }

 .tb-hours__days {
  flex: 1 1 auto;
  min-width: 0;
  font-family: var(--site-font-display);
  font-size: clamp(16px, 0.3vw + 14.5px, 17.5px);
  font-weight: 700;
  line-height: 1.35;
  color: var(--site-heading);
  overflow-wrap: break-word;
 }

 .tb-hours__time {
  flex: none;
  margin: 0;
  font-family: var(--site-font-mono);
  font-size: clamp(14px, 0.2vw + 13px, 15px);
  line-height: 1.35;
  color: var(--site-body);
  text-align: right;
  white-space: nowrap;
 }

 /* Smaller screens: the card goes under the words. */
 @media (max-width: 760px) {
  .tb-hours__inner {
   grid-template-columns: minmax(0, 1fr);
  }

  .tb-hours .tb-hours__card {
   max-width: 560px;
  }
 }

 /* The narrowest phones: long hours may wrap rather than run out of the card. */
 @media (max-width: 400px) {
  .tb-hours__time {
   max-width: 60%;
   white-space: normal;
  }
 }
</style>
