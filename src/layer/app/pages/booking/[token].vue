<script setup>
 // A guest's own booking, /booking/<token> (the studio's docs/bookings.md):
 // the link in every booking email. What, when (with its time zone), who,
 // and Cancel while it's still ahead. In time a deposit goes back by
 // itself; late, the page says it's kept before they press. No sign-in: the
 // token is the key. Never indexed.
 definePageMeta({ layout: false });

 const route = useRoute();
 const token = computed(() => String(route.params.token ?? ''));
 const { data, error } = await useFetch(() => `/__timbrr/bookings/booking/${encodeURIComponent(token.value)}`, { key: `tb-booking-${token.value}`, retry: false, default: () => null });
 const status = error.value?.statusCode;
 if (error.value && status !== 404) throw createError({ statusCode: 502, statusMessage: 'Bad Gateway', message: "Couldn't get this page from the studio.", fatal: import.meta.client });
 const booking = ref(data.value && typeof data.value.service === 'string' ? data.value : null);
 if (import.meta.server && !booking.value) setResponseStatus(useRequestEvent(), 404);
 // The site's own look, as the pay page sets it.
 const text = (value) => (typeof value === 'string' ? value.trim() : '');
 const site = computed(() => {
  const value = booking.value?.site ?? {};
  return { name: text(value.name), domain: text(value.domain), accent: text(value.accent), brand: normalizeBrand(value.brand) };
 });
 provide(TIMBRR_SITE_KEY, site);
 const style = computed(() => brandStyle(site.value.accent, site.value.brand));
 useBrandHead(style, () => site.value.brand);

 const money = (cents) => (Number(cents || 0) / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
 const STATUS = { pending: 'Waiting for them to confirm', confirmed: 'Confirmed', cancelled: 'Cancelled', declined: 'Declined', done: 'Done', no_show: 'Missed', held: 'Waiting for the deposit' };
 const busy = ref(false);
 const problem = ref('');
 async function cancel() {
  busy.value = true;
  problem.value = '';
  try {
   booking.value = await $fetch(`/__timbrr/bookings/booking/${encodeURIComponent(token.value)}`, { method: 'POST', body: {} });
  } catch (err) {
   problem.value = err?.data?.message || "Couldn't cancel. Try again in a minute.";
  }
  busy.value = false;
 }
 useSeoMeta({ title: () => (booking.value ? `${booking.value.service} · ${booking.value.site.name}` : 'Booking not found'), robots: 'noindex, nofollow' });
</script>

<template>
 <main v-if="!booking" class="tb-error">
  <div class="tb-wrap tb-wrap--narrow">
   <h1 class="tb-heading">We can't find that booking.</h1>
   <p class="tb-lede">Check the link in your email, or reply to it to reach us.</p>
  </div>
 </main>
 <main v-else id="main" class="tb-page tb-booked" :style="style">
  <div class="tb-wrap tb-wrap--narrow tb-booked__inner">
   <p class="tb-eyebrow">{{ booking.site.name }}</p>
   <h1 class="tb-heading tb-booked__title">{{ booking.service }}</h1>
   <dl class="tb-booked__rows">
    <div><dt>When</dt><dd>{{ booking.when }}</dd></div>
    <div><dt>Name</dt><dd>{{ booking.name }}<template v-if="booking.party > 1">, {{ booking.party }} people</template></dd></div>
    <div><dt>Status</dt><dd>{{ STATUS[booking.status] ?? booking.status }}</dd></div>
    <div v-if="booking.depositCents"><dt>Deposit</dt><dd>{{ money(booking.depositCents) }} paid</dd></div>
   </dl>
   <template v-if="booking.canCancel">
    <p class="tb-note">{{ booking.inTime ? `Free to cancel until ${booking.cancelHours} hours before.${booking.depositCents ? ' Your deposit comes back to your card.' : ''}` : `It's inside ${booking.cancelHours} hours now${booking.depositCents ? ', so the deposit is kept' : ''}.` }}</p>
    <button type="button" class="tb-button tb-button--outline tb-booked__cancel" :disabled="busy" @click="cancel">{{ busy ? 'Cancelling…' : 'Cancel this booking' }}</button>
   </template>
   <p v-if="problem" class="tb-booked__problem" role="alert">{{ problem }}</p>
  </div>
 </main>
</template>

<style>
 .tb-booked {
  padding-block: clamp(28px, 6vw, 56px);
 }

 .tb-booked__inner {
  max-width: 560px;
 }

 .tb-booked__title {
  margin: 6px 0 16px;
  font-size: clamp(28px, 4vw, 38px);
 }

 .tb-booked__rows {
  margin: 0 0 20px;
 }

 .tb-booked__rows div {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--site-border);
 }

 .tb-booked__rows dt {
  color: var(--site-body);
 }

 .tb-booked__rows dd {
  margin: 0;
  font-weight: 600;
 }

 .tb-booked__cancel {
  margin-top: 12px;
  font: inherit;
  cursor: pointer;
 }

 .tb-booked__problem {
  margin: 12px 0 0;
  color: #b42318;
 }
</style>
