<script setup>
 // Donate: a headline, a line or two, three amounts and Other, and the Give
 // button. Give asks the studio (through /__timbrr/pay/donate) for a Stripe
 // Checkout address on the owner's account and goes there. On the live site
 // it draws only when the site says it takes gifts (`site.payments`: the
 // Payments add-on on and a bank connected), so a page never shows a button
 // that can't work. On the studio's canvas it always draws, so it can be
 // edited, with a line saying why it may not show yet.
 const props = defineProps({ data: { type: Object, required: true } });

 const canvas = useCanvas();
 const site = useTimbrrSite();
 const route = useRoute();
 const id = useId();
 const shown = computed(() => Boolean(canvas) || site?.value?.payments === true);
 const amounts = computed(() => [props.data.amount1, props.data.amount2, props.data.amount3].filter((value) => Number.isInteger(value) && value >= 1));

 const picked = ref(String(amounts.value[1] ?? amounts.value[0] ?? ''));
 const other = ref('');
 const busy = ref(false);
 const problem = ref('');
 // Whole dollars, $1 to $10,000, as the studio checks again.
 const dollars = computed(() => (picked.value === 'other' ? Number(String(other.value).replace(/[$,\s]/g, '')) : Number(picked.value)));
 const valid = computed(() => Number.isFinite(dollars.value) && dollars.value >= 1 && dollars.value <= 10000);

 async function give() {
  if (canvas || !valid.value) return;
  busy.value = true;
  problem.value = '';
  try {
   const answer = await $fetch('/__timbrr/pay/donate', { method: 'POST', body: { cents: Math.round(dollars.value * 100), fund: props.data.fund, page: route.path } });
   if (!/^https:\/\/checkout\.stripe\.com\//.test(answer?.url ?? '')) throw new Error('no checkout');
   window.location.assign(answer.url);
  } catch (err) {
   problem.value = err?.data?.message || "Couldn't start that. Try again in a minute.";
   busy.value = false;
  }
 }
 const thanked = computed(() => !canvas && route.query.paid === '1');
</script>

<template>
 <section v-if="shown" class="tb-section tb-donate">
  <div class="tb-wrap tb-wrap--narrow tb-donate__inner">
   <TbText v-if="data.headline || canvas" :data="data" field="headline" tag="h2" class="tb-heading tb-donate__headline" />
   <TbText v-if="data.body || canvas" :data="data" field="body" tag="p" class="tb-donate__body" />
   <p v-if="thanked" class="tb-donate__thanks" role="status">Thank you for your gift. A receipt is on its way to your email.</p>
   <form v-else class="tb-donate__form" @submit.prevent="give">
    <fieldset class="tb-donate__amounts">
     <legend class="tb-donate__legend">How much{{ data.fund ? ` for ${data.fund}` : '' }}</legend>
     <label v-for="value in amounts" :key="value" class="tb-donate__amount" :class="{ 'is-on': picked === String(value) }">
      <input v-model="picked" type="radio" :name="`${id}-amount`" :value="String(value)" />
      ${{ value.toLocaleString('en-US') }}
     </label>
     <label class="tb-donate__amount" :class="{ 'is-on': picked === 'other' }">
      <input v-model="picked" type="radio" :name="`${id}-amount`" value="other" />
      Other
     </label>
    </fieldset>
    <label v-if="picked === 'other'" class="tb-donate__other">
     <span>Amount in dollars</span>
     <input v-model="other" class="tb-form__control" inputmode="decimal" autocomplete="off" placeholder="40" />
    </label>
    <button type="submit" class="tb-button tb-button--solid tb-donate__give" :disabled="busy || (!canvas && !valid)">
     <TbText :data="data" field="label" tag="span" />
    </button>
    <p v-if="problem" class="tb-donate__problem" role="alert">{{ problem }}</p>
    <p class="tb-note">Paid securely through Stripe.</p>
    <p v-if="canvas" class="tb-note">Shows on the live site once Payments is on and your bank is connected (Settings › Payments).</p>
   </form>
  </div>
 </section>
</template>

<style>
 .tb-donate {
  text-align: center;
 }

 .tb-donate__headline {
  margin: 0;
  font-size: calc(clamp(26px, 2vw + 14px, 36px) * var(--site-heading-scale, 1));
 }

 .tb-donate__body {
  max-width: 34em;
  margin: 12px auto 0;
  color: var(--site-body);
 }

 .tb-donate__form {
  display: grid;
  justify-items: center;
  gap: 14px;
  margin-top: 24px;
 }

 .tb-donate__amounts {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
 }

 .tb-donate__legend {
  width: 100%;
  margin-bottom: 8px;
  font-size: 15px;
  color: var(--site-body);
 }

 .tb-donate__amount {
  position: relative;
  min-width: 76px;
  padding: 10px 16px;
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius, 8px);
  font-weight: 600;
  cursor: pointer;
 }

 .tb-donate__amount input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
 }

 .tb-donate__amount.is-on {
  border-color: var(--site-accent);
  box-shadow: inset 0 0 0 1px var(--site-accent);
 }

 .tb-donate__amount:focus-within {
  outline: 2px solid var(--site-accent);
  outline-offset: 2px;
 }

 .tb-donate__other {
  display: grid;
  gap: 4px;
  font-size: 14px;
  text-align: left;
 }

 .tb-donate__give {
  min-width: 200px;
  justify-content: center;
  font: inherit;
  cursor: pointer;
 }

 .tb-donate__problem {
  margin: 0;
  color: #b42318;
 }

 .tb-donate__thanks {
  margin: 24px auto 0;
  max-width: 30em;
  font-weight: 600;
 }
</style>
