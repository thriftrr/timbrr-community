<script setup>
 // Book a time: pick what (or a party size, to reserve a table), then a day,
 // then one of the free times, then a name and email. Everything goes
 // through /__timbrr/bookings, relayed to the studio, which only ever offers
 // free times and takes one in a single statement. A time someone just took
 // says so and the times load again. With a deposit, Book goes to Stripe
 // Checkout and comes back with ?paid=1. On the live site it draws only
 // while Bookings is on (`site.bookings`); on the canvas it always draws,
 // with sample times, so it can be edited.
 const props = defineProps({ data: { type: Object, required: true } });

 const canvas = useCanvas();
 const site = useTimbrrSite();
 const route = useRoute();
 const id = useId();
 const shown = computed(() => Boolean(canvas) || site?.value?.bookings === true);
 const reserve = computed(() => props.data.mode === 'reserve');

 const SAMPLE = {
  timezone: 'America/Chicago',
  services: [
   { id: 's1', kind: 'appointment', name: 'Consultation', minutes: 45, priceCents: 0, depositCents: 0, maxParty: 1, staff: [] },
   { id: 's2', kind: 'class', name: 'Sourdough class', minutes: 120, priceCents: 6500, depositCents: 0, maxParty: 4, staff: [] },
   { id: 's3', kind: 'seating', name: 'Dinner', minutes: 90, priceCents: 0, depositCents: 0, maxParty: 8, staff: [] },
  ],
 };
 const list = ref(canvas ? SAMPLE : null);
 const problem = ref('');
 const services = computed(() => (list.value?.services ?? []).filter((one) => (reserve.value ? one.kind === 'seating' : one.kind !== 'seating')));
 const zone = computed(() => list.value?.timezone || 'America/Chicago');

 const pick = ref('');
 const service = computed(() => services.value.find((one) => one.id === pick.value) ?? null);
 const staff = ref('');
 const party = ref(reserve.value ? 2 : 1);
 const day = ref('');
 const times = ref([]);
 const loadingTimes = ref(false);
 const at = ref(0);
 const guest = reactive({ name: '', email: '', phone: '', note: '' });
 const busy = ref(false);
 const done = ref('');

 const ymd = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: zone.value, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
 const weeks = ref(1);
 const horizon = computed(() => Math.max(1, Math.min(service.value?.horizonDays ?? 14, 365)));
 const days = computed(() => {
  const out = [];
  for (let i = 0; i < Math.min(weeks.value * 14, horizon.value); i++) {
   const date = new Date(Date.now() + i * 86_400_000);
   out.push({ value: ymd(date), week: new Intl.DateTimeFormat('en-US', { timeZone: zone.value, weekday: 'short' }).format(date), label: new Intl.DateTimeFormat('en-US', { timeZone: zone.value, month: 'short', day: 'numeric' }).format(date) });
  }
  return out;
 });
 const clock = (ms) => new Intl.DateTimeFormat('en-US', { timeZone: zone.value, hour: 'numeric', minute: '2-digit' }).format(new Date(ms));
 const zoneName = computed(() => new Intl.DateTimeFormat('en-US', { timeZone: zone.value, timeZoneName: 'short' }).formatToParts(new Date()).find((part) => part.type === 'timeZoneName')?.value ?? '');
 const money = (cents) => '$' + (cents % 100 ? (cents / 100).toFixed(2) : String(cents / 100));
 const priceLine = (one) => [`${one.minutes} min`, one.priceCents ? money(one.priceCents) : 'Free', one.depositCents ? `${money(one.depositCents)} deposit now` : ''].filter(Boolean).join(' · ');

 onMounted(async () => {
  if (canvas || !shown.value) return;
  try {
   list.value = await $fetch('/__timbrr/bookings/services');
  } catch (err) {
   problem.value = err?.data?.message || "Couldn't load what can be booked. Try again in a minute.";
  }
 });
 watch(
  services,
  (now) => {
   if (!pick.value && now.length === 1) pick.value = now[0].id;
   if (reserve.value && !pick.value && now.length) pick.value = now[0].id;
  },
  { immediate: true },
 );

 async function loadTimes() {
  at.value = 0;
  times.value = [];
  if (!service.value || !day.value) return;
  if (canvas) {
   times.value = ['09:00', '10:30', '12:00'].map((time, i) => ({ time, at: i + 1, left: service.value.kind === 'appointment' ? undefined : 6 - i * 2 }));
   return;
  }
  loadingTimes.value = true;
  try {
   const answer = await $fetch('/__timbrr/bookings/times', { query: { service: service.value.id, date: day.value, party: party.value, staff: staff.value } });
   times.value = Array.isArray(answer?.times) ? answer.times : [];
  } catch (err) {
   problem.value = err?.data?.message || "Couldn't load the times. Try again in a minute.";
  } finally {
   loadingTimes.value = false;
  }
 }
 watch(service, (now) => {
  if (now && party.value > now.maxParty) party.value = now.maxParty;
  if (now && !now.staff?.some((person) => person.id === staff.value)) staff.value = '';
 });
 watch(pick, () => (weeks.value = 1));
 watch([pick, staff, party, day], loadTimes);

 async function book() {
  if (canvas || !at.value || busy.value) return;
  busy.value = true;
  problem.value = '';
  try {
   const answer = await $fetch('/__timbrr/bookings/book', { method: 'POST', body: { service: service.value.id, at: at.value, staff: staff.value, party: Number(party.value), ...guest, page: route.path } });
   if (answer?.url) {
    if (!/^https:\/\/checkout\.stripe\.com\//.test(answer.url)) throw new Error('no checkout');
    window.location.assign(answer.url);
    return;
   }
   done.value = answer?.status === 'pending' ? `Your request for ${answer.when} is in. You'll get an email when it's confirmed.` : `You're booked for ${answer?.when}. A confirmation is on its way to your email.`;
  } catch (err) {
   problem.value = err?.data?.message || "Couldn't book that. Try again in a minute.";
   if (err?.data?.data?.taken || err?.statusCode === 409) await loadTimes();
  }
  busy.value = false;
 }
 const paid = computed(() => !canvas && route.query.paid === '1');
</script>

<template>
 <section v-if="shown" class="tb-section tb-booking">
  <div class="tb-wrap tb-wrap--narrow">
   <TbText v-if="data.headline || canvas" :data="data" field="headline" tag="h2" class="tb-heading tb-booking__headline" />
   <TbText v-if="data.body || canvas" :data="data" field="body" tag="p" class="tb-booking__body" />
   <p v-if="paid" class="tb-booking__done" role="status">Your deposit is paid. A confirmation is on its way to your email.</p>
   <p v-else-if="done" class="tb-booking__done" role="status">{{ done }}</p>
   <form v-else class="tb-booking__form" @submit.prevent="book">
    <p v-if="list && !services.length" class="tb-note">Nothing can be booked here right now.</p>

    <fieldset v-if="!reserve && services.length > 1" class="tb-booking__set">
     <legend class="tb-booking__legend">What</legend>
     <label v-for="one in services" :key="one.id" class="tb-booking__choice tb-booking__choice--row" :class="{ 'is-on': pick === one.id }">
      <input v-model="pick" type="radio" :name="`${id}-service`" :value="one.id" />
      <span class="tb-booking__name">{{ one.name }}</span>
      <span class="tb-booking__line">{{ priceLine(one) }}</span>
     </label>
    </fieldset>
    <p v-else-if="service && !reserve" class="tb-booking__line">{{ service.name }} · {{ priceLine(service) }}</p>

    <label v-if="service?.staff?.length > 1" class="tb-booking__field">
     <span class="tb-booking__legend">With</span>
     <select v-model="staff" class="tb-form__control">
      <option value="">Anyone free</option>
      <option v-for="person in service.staff" :key="person.id" :value="person.id">{{ person.name }}</option>
     </select>
    </label>

    <fieldset v-if="service && service.maxParty > 1" class="tb-booking__set">
     <legend class="tb-booking__legend">Party size</legend>
     <div class="tb-booking__grid tb-booking__grid--small">
      <label v-for="n in service.maxParty" :key="n" class="tb-booking__choice" :class="{ 'is-on': Number(party) === n }">
       <input v-model.number="party" type="radio" :name="`${id}-party`" :value="n" />
       {{ n }}
      </label>
     </div>
    </fieldset>

    <fieldset v-if="service" class="tb-booking__set">
     <legend class="tb-booking__legend">Day</legend>
     <div class="tb-booking__grid">
      <label v-for="one in days" :key="one.value" class="tb-booking__choice" :class="{ 'is-on': day === one.value }">
       <input v-model="day" type="radio" :name="`${id}-day`" :value="one.value" />
       <span class="tb-booking__name">{{ one.week }}</span>
       <span class="tb-booking__line">{{ one.label }}</span>
      </label>
     </div>
     <button v-if="days.length < horizon" type="button" class="tb-button tb-booking__more" @click="weeks++">Later days</button>
    </fieldset>

    <fieldset v-if="service && day" class="tb-booking__set" :aria-busy="loadingTimes ? 'true' : 'false'">
     <legend class="tb-booking__legend">Time <span class="tb-booking__zone">{{ zoneName }}</span></legend>
     <p v-if="!loadingTimes && !times.length" class="tb-note">No free times this day. Try another.</p>
     <div class="tb-booking__grid">
      <label v-for="one in times" :key="one.at" class="tb-booking__choice" :class="{ 'is-on': at === one.at }">
       <input v-model="at" type="radio" :name="`${id}-time`" :value="one.at" />
       <span class="tb-booking__name">{{ canvas ? one.time : clock(one.at) }}</span>
       <span v-if="one.left != null" class="tb-booking__line">{{ one.left }} left</span>
      </label>
     </div>
    </fieldset>

    <div v-if="at" class="tb-booking__who">
     <label class="tb-booking__field"><span>Name</span><input v-model="guest.name" class="tb-form__control" autocomplete="name" required maxlength="120" /></label>
     <label class="tb-booking__field"><span>Email</span><input v-model="guest.email" class="tb-form__control" type="email" autocomplete="email" required maxlength="254" /></label>
     <label class="tb-booking__field"><span>Phone <small>(if you like)</small></span><input v-model="guest.phone" class="tb-form__control" type="tel" autocomplete="tel" maxlength="40" /></label>
     <label class="tb-booking__field"><span>Anything we should know?</span><textarea v-model="guest.note" class="tb-form__control" rows="2" maxlength="500" /></label>
    </div>

    <button v-if="service" type="submit" class="tb-button tb-button--solid tb-booking__go" :disabled="busy || (!canvas && !at)">
     <TbText v-if="!at || !service.depositCents" :data="data" field="label" tag="span" />
     <span v-else>Pay {{ money(service.depositCents) }} deposit and book</span>
    </button>
    <p v-if="problem" class="tb-booking__problem" role="alert">{{ problem }}</p>
    <p v-if="service?.cancelHours" class="tb-note">Free to cancel until {{ service.cancelHours }} hours before, from the link in your email.</p>
    <p v-if="canvas" class="tb-note">Sample times. Shows on the live site once Bookings is on and something is set up to book (Bookings in the studio).</p>
   </form>
  </div>
 </section>
</template>

<style>
 .tb-booking__headline {
  margin: 0;
  font-size: calc(clamp(26px, 2vw + 14px, 36px) * var(--site-heading-scale, 1));
 }

 .tb-booking__body {
  margin: 12px 0 0;
  color: var(--site-body);
 }

 .tb-booking__form {
  display: grid;
  gap: 20px;
  margin-top: 24px;
 }

 .tb-booking__set {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
 }

 .tb-booking__legend {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--site-body);
 }

 .tb-booking__zone {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
 }

 .tb-booking__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
 }

 .tb-booking__more {
  margin-top: 8px;
 }

 .tb-booking__grid--small {
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
 }

 .tb-booking__choice {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 2px;
  padding: 10px 8px;
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius, 8px);
  font-weight: 600;
  cursor: pointer;
 }

 .tb-booking__choice--row {
  justify-items: start;
  padding: 12px 14px;
 }

 .tb-booking__choice input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
 }

 .tb-booking__choice.is-on {
  border-color: var(--site-accent);
  box-shadow: inset 0 0 0 1px var(--site-accent);
 }

 .tb-booking__choice:focus-within {
  outline: 2px solid var(--site-accent);
  outline-offset: 2px;
 }

 .tb-booking__line {
  font-size: 13px;
  font-weight: 400;
  color: var(--site-body);
 }

 .tb-booking__who {
  display: grid;
  gap: 12px;
 }

 .tb-booking__field {
  display: grid;
  gap: 4px;
  font-size: 14px;
 }

 .tb-booking__go {
  justify-content: center;
  width: 100%;
  font: inherit;
  cursor: pointer;
 }

 .tb-booking__problem {
  margin: 0;
  color: #b42318;
 }

 .tb-booking__done {
  margin: 24px 0 0;
  padding: 12px 14px;
  border-left: 3px solid var(--site-accent);
  background: color-mix(in srgb, var(--site-accent) 8%, transparent);
  font-weight: 600;
 }
</style>
