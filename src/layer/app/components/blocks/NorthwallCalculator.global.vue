<script setup>
 // Words on one side, a small working sum on the other: how many it's for
 // (a minus, the number, a plus), the extras as tick boxes, and the price
 // they come to, said aloud as it changes. Before any script runs the page
 // shows the price for one with nothing ticked, which is true. Narrower
 // screens stack the words over the sum.
 const props = defineProps({ data: { type: Object, required: true } });
 const shows = useFieldShown();
 const group = useId();

 const most = computed(() => Number(props.data.most));
 const count = ref(1);
 const ticked = ref([]);
 // Fewer allowed, or an extra taken away in the studio: stay inside what's left.
 watchEffect(() => {
  if (count.value > most.value) count.value = most.value;
 });

 const total = computed(() => calculatorTotal(props.data, count.value, ticked.value));
 const money = (amount) => `${props.data.currency}${amount.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 })}`;
 const extraPrice = (addon) => `+${money(priceNumber(addon.price) * (addon.per === 'each' ? count.value : 1))}`;
 const counting = computed(() => props.data.unit.trim() || 'How many');
</script>

<template>
 <section class="tb-section tb-calculator">
  <div class="tb-wrap tb-calculator__row">
   <div class="tb-calculator__words">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
    <TbRich v-if="shows('body', data.body)" :data="data" field="body" class="tb-rich tb-calculator__body" />
   </div>
   <div class="tb-card tb-calculator__sum">
    <div class="tb-calculator__line">
     <TbText :id="group" :data="data" field="unit" tag="p" class="tb-calculator__label" />
     <div class="tb-calculator__stepper" role="group" :aria-labelledby="group">
      <button type="button" class="tb-calculator__step" :disabled="count <= 1" :aria-label="`One fewer: ${counting}`" @click="count--">
       <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 8h10" /></svg>
      </button>
      <output class="tb-calculator__count">{{ count }}</output>
      <button type="button" class="tb-calculator__step" :disabled="count >= most" :aria-label="`One more: ${counting}`" @click="count++">
       <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 8h10M8 3v10" /></svg>
      </button>
     </div>
    </div>
    <label v-for="(addon, index) in data.addons" :key="index" class="tb-calculator__line tb-calculator__extra">
     <input v-model="ticked[index]" type="checkbox" class="tb-calculator__tick" />
     <TbText :data="data" :field="`addons.${index}.label`" class="tb-calculator__label" />
     <span class="tb-calculator__extra-price">{{ extraPrice(addon) }}</span>
    </label>
    <p class="tb-calculator__total" aria-live="polite" aria-atomic="true">
     <span class="tb-calculator__amount">{{ money(total) }}</span>
     <TbText v-if="shows('period', data.period)" :data="data" field="period" class="tb-calculator__period" />
    </p>
    <TbText v-if="shows('note', data.note)" :data="data" field="note" tag="p" class="tb-calculator__note" />
    <div v-if="data.buttons.length && shows('buttons.0.label', data.buttons[0].label)" class="tb-calculator__action">
     <TbButton :data="data" field="buttons.0" />
    </div>
   </div>
  </div>
 </section>
</template>

<style>
 .tb-calculator__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 420px);
  gap: clamp(28px, 5vw, 72px);
  align-items: center;
 }

 .tb-calculator__words .tb-heading {
  margin: 0;
  text-wrap: balance;
 }

 .tb-calculator__body {
  max-width: 56ch;
  margin-top: 14px;
 }

 /* The sum: one card, a rule between its lines. */
 .tb-calculator .tb-calculator__sum {
  padding: clamp(8px, 1vw, 12px) clamp(20px, 2.4vw, 26px) clamp(22px, 2.4vw, 26px);
  border-radius: calc(var(--site-radius) + 2px);
 }

 .tb-calculator__line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-height: 64px;
  border-bottom: 1px solid var(--site-border);
  padding: 10px 0;
 }

 .tb-calculator__label {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--site-heading);
  overflow-wrap: break-word;
 }

 .tb-calculator__stepper {
  display: flex;
  flex: none;
  align-items: center;
  gap: 4px;
 }

 .tb-calculator__step {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1.5px solid var(--site-border);
  border-radius: var(--site-control-radius);
  padding: 0;
  background: transparent;
  color: var(--site-heading);
  cursor: pointer;
  transition:
   border-color 120ms ease,
   color 120ms ease;
 }

 .tb-calculator__step:hover:not(:disabled) {
  border-color: var(--site-accent);
  color: var(--site-accent);
 }

 .tb-calculator__step:disabled {
  opacity: 0.4;
  cursor: default;
 }

 .tb-calculator__step:focus-visible,
 .tb-calculator__tick:focus-visible {
  outline: 2px solid var(--site-accent);
  outline-offset: 2px;
 }

 .tb-calculator__count {
  min-width: 2ch;
  padding: 0 8px;
  font-family: var(--site-font-display);
  font-size: 22px;
  font-weight: var(--site-heading-weight);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: var(--site-heading);
  text-align: center;
 }

 .tb-calculator__extra {
  justify-content: flex-start;
  cursor: pointer;
 }

 .tb-calculator__tick {
  flex: none;
  width: 22px;
  height: 22px;
  margin: 0;
  accent-color: var(--site-accent);
  cursor: pointer;
 }

 .tb-calculator__extra-price {
  flex: none;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  color: var(--site-muted);
 }

 .tb-calculator__total {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 8px;
  margin: 20px 0 0;
 }

 .tb-calculator__amount {
  font-family: var(--site-font-display);
  font-size: clamp(40px, 2vw + 30px, 56px);
  font-weight: var(--site-heading-weight);
  font-variant-numeric: tabular-nums;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--site-heading);
 }

 .tb-calculator__period {
  font-size: 16px;
  color: var(--site-muted);
 }

 .tb-calculator__note {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--site-muted);
 }

 .tb-calculator__action {
  margin-top: 20px;
 }

 @media (max-width: 800px) {
  .tb-calculator__row {
   grid-template-columns: minmax(0, 1fr);
   align-items: start;
  }

  .tb-calculator .tb-calculator__sum {
   max-width: 480px;
  }
 }
</style>
