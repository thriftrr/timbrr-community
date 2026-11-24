<script setup>
 // Order from the menu: add items to a cart, pick pickup or delivery and a
 // time (or, from a table code's ?table= link, order to the table), type a
 // name and email, then pay on Stripe Checkout, which comes back with
 // ?paid=1. Everything goes through /__timbrr/ordering, relayed to the
 // studio, which prices the cart from the menu (only ids and counts go up)
 // and takes a time in one statement. Something that just sold out, or a
 // time that just filled, says so and loads again. On the live site it
 // draws only while Ordering is on and Payments takes money
 // (`site.ordering`); on the canvas it always draws, with a sample menu.
 const props = defineProps({ data: { type: Object, required: true } });

 const canvas = useCanvas();
 const site = useTimbrrSite();
 const route = useRoute();
 const id = useId();
 const shown = computed(() => Boolean(canvas) || site?.value?.ordering === true);
 const tableCode = computed(() => (canvas ? '' : String(route.query.table ?? '').slice(0, 64)));

 const SAMPLE = {
  timezone: 'America/Chicago',
  paused: false,
  pickup: true,
  delivery: { feeCents: 400, minCents: 2000, zips: [] },
  table: null,
  daysAhead: 7,
  categories: [
   { id: 'c1', name: 'Coffee' },
   { id: 'c2', name: 'Pastries' },
  ],
  items: [
   { id: 'i1', categoryId: 'c1', name: 'Oat latte', description: 'Double shot, oat milk', priceCents: 550, image: '', soldOut: false },
   { id: 'i2', categoryId: 'c1', name: 'Drip coffee', description: '', priceCents: 300, image: '', soldOut: false },
   { id: 'i3', categoryId: 'c2', name: 'Almond croissant', description: 'Baked this morning', priceCents: 475, image: '', soldOut: true },
  ],
 };
 const menu = ref(canvas ? SAMPLE : null);
 const problem = ref('');
 const zone = computed(() => menu.value?.timezone || 'America/Chicago');
 const money = (cents) => '$' + (cents % 100 ? (cents / 100).toFixed(2) : String(cents / 100));

 async function loadMenu() {
  if (canvas || !shown.value) return;
  try {
   menu.value = await $fetch('/__timbrr/ordering/menu', { query: tableCode.value ? { table: tableCode.value } : {} });
  } catch (err) {
   problem.value = err?.data?.message || "Couldn't load the menu. Try again in a minute.";
  }
 }
 onMounted(loadMenu);

 const sections = computed(() => {
  const items = menu.value?.items ?? [];
  const cats = menu.value?.categories ?? [];
  const out = cats.map((cat) => ({ id: cat.id, name: cat.name, items: items.filter((item) => item.categoryId === cat.id) }));
  const rest = items.filter((item) => !cats.some((cat) => cat.id === item.categoryId));
  if (rest.length) out.push({ id: '', name: cats.length ? 'More' : '', items: rest });
  return out.filter((one) => one.items.length);
 });

 // ── The cart: { itemId: count } ──
 const cart = reactive({});
 const lines = computed(() => Object.entries(cart).filter(([, qty]) => qty > 0).map(([itemId, qty]) => ({ item: (menu.value?.items ?? []).find((one) => one.id === itemId), qty })).filter((line) => line.item));
 const add = (item, by) => (cart[item.id] = Math.min(20, Math.max(0, (cart[item.id] ?? 0) + by)));
 const subtotal = computed(() => lines.value.reduce((sum, line) => sum + line.item.priceCents * line.qty, 0));

 // ── How and when ──
 const table = computed(() => menu.value?.table ?? null);
 const ways = computed(() => (table.value ? [] : [...(menu.value?.pickup ? [{ value: 'pickup', label: 'Pickup' }] : []), ...(menu.value?.delivery ? [{ value: 'delivery', label: 'Delivery' }] : [])]));
 const kind = ref('pickup');
 watch(ways, (now) => !now.some((one) => one.value === kind.value) && now[0] && (kind.value = now[0].value), { immediate: true });
 const fee = computed(() => (kind.value === 'delivery' && !table.value ? (menu.value?.delivery?.feeCents ?? 0) : 0));
 const short = computed(() => (kind.value === 'delivery' && !table.value ? Math.max(0, (menu.value?.delivery?.minCents ?? 0) - subtotal.value) : 0));

 const ymd = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: zone.value, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
 const days = computed(() =>
  Array.from({ length: menu.value?.daysAhead ?? 7 }, (_, i) => {
   const date = new Date(Date.now() + i * 86_400_000);
   return { value: ymd(date), label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Intl.DateTimeFormat('en-US', { timeZone: zone.value, weekday: 'short', month: 'short', day: 'numeric' }).format(date) };
  }),
 );
 const day = ref('');
 watch(days, (now) => !day.value && now[0] && (day.value = now[0].value), { immediate: true });
 const times = ref([]);
 const loadingTimes = ref(false);
 const at = ref(0);
 const clock = (ms) => new Intl.DateTimeFormat('en-US', { timeZone: zone.value, hour: 'numeric', minute: '2-digit' }).format(new Date(ms));
 const zoneName = computed(() => new Intl.DateTimeFormat('en-US', { timeZone: zone.value, timeZoneName: 'short' }).formatToParts(new Date()).find((part) => part.type === 'timeZoneName')?.value ?? '');

 async function loadTimes() {
  at.value = 0;
  times.value = [];
  if (table.value || !day.value || !menu.value) return;
  if (canvas) {
   times.value = ['09:00', '09:15', '09:30'].map((time, i) => ({ time, at: i + 1 }));
   return;
  }
  loadingTimes.value = true;
  try {
   const answer = await $fetch('/__timbrr/ordering/times', { query: { date: day.value } });
   times.value = Array.isArray(answer?.times) ? answer.times : [];
  } catch (err) {
   problem.value = err?.data?.message || "Couldn't load the times. Try again in a minute.";
  } finally {
   loadingTimes.value = false;
  }
 }
 watch([day, menu], loadTimes, { immediate: true });

 // ── Paying ──
 // textOk: the "Text me when it's ready" box (the studio's docs/texting.md),
 // never ticked for them, shown only when the site can text.
 const who = reactive({ name: '', email: '', phone: '', textOk: false, note: '', address: '', zip: '' });
 const busy = ref(false);
 const ready = computed(() => lines.value.length && (table.value || at.value) && !short.value);
 async function order() {
  if (canvas || !ready.value || busy.value) return;
  busy.value = true;
  problem.value = '';
  try {
   const answer = await $fetch('/__timbrr/ordering/order', {
    method: 'POST',
    body: { kind: table.value ? 'table' : kind.value, at: table.value ? null : at.value, table: tableCode.value, cart: lines.value.map((line) => ({ id: line.item.id, qty: line.qty })), ...who, page: route.path },
   });
   if (!/^https:\/\/checkout\.stripe\.com\//.test(answer?.url ?? '')) throw new Error('no checkout');
   window.location.assign(answer.url);
   return;
  } catch (err) {
   problem.value = err?.data?.message || "Couldn't place that order. Try again in a minute.";
   if (err?.data?.data?.menu) await loadMenu();
   if (err?.data?.data?.taken) await loadTimes();
  }
  busy.value = false;
 }
 const paid = computed(() => !canvas && route.query.paid === '1');
</script>

<template>
 <section v-if="shown" class="tb-section tb-order">
  <div class="tb-wrap tb-wrap--narrow">
   <TbText v-if="data.headline || canvas" :data="data" field="headline" tag="h2" class="tb-heading tb-booking__headline" />
   <TbText v-if="data.body || canvas" :data="data" field="body" tag="p" class="tb-booking__body" />
   <p v-if="paid" class="tb-booking__done" role="status">Thanks, your order is in and paid. We'll email you when it's ready.</p>
   <p v-else-if="menu?.paused" class="tb-booking__done" role="status">We're not taking orders right now.{{ menu.pausedNote ? ` ${menu.pausedNote}` : '' }}</p>
   <form v-else class="tb-booking__form" @submit.prevent="order">
    <p v-if="table" class="tb-booking__line">Ordering to <strong>{{ table.name }}</strong>. We'll bring it over.</p>
    <p v-if="menu && !sections.length" class="tb-note">Nothing on the menu right now.</p>

    <div v-for="section in sections" :key="section.id" class="tb-order__section">
     <h3 v-if="section.name" class="tb-booking__legend">{{ section.name }}</h3>
     <ul class="tb-order__items">
      <li v-for="item in section.items" :key="item.id" class="tb-order__item" :class="{ 'is-out': item.soldOut }">
       <img v-if="item.image" :src="item.image" alt="" class="tb-order__pic" loading="lazy" />
       <div class="tb-order__what">
        <span class="tb-booking__name">{{ item.name }}</span>
        <span v-if="item.description" class="tb-booking__line">{{ item.description }}</span>
        <span class="tb-booking__line">{{ item.soldOut ? 'Sold out today' : money(item.priceCents) }}</span>
       </div>
       <div v-if="!item.soldOut" class="tb-order__qty">
        <button v-if="cart[item.id]" type="button" class="tb-button tb-order__step" :aria-label="`One less ${item.name}`" @click="add(item, -1)">−</button>
        <span v-if="cart[item.id]" class="tb-order__count" aria-live="polite">{{ cart[item.id] }}</span>
        <button type="button" class="tb-button tb-order__step" :aria-label="`Add ${item.name}`" @click="add(item, 1)">+</button>
       </div>
      </li>
     </ul>
    </div>

    <template v-if="lines.length">
     <fieldset v-if="ways.length > 1" class="tb-booking__set">
      <legend class="tb-booking__legend">How</legend>
      <div class="tb-booking__grid">
       <label v-for="one in ways" :key="one.value" class="tb-booking__choice" :class="{ 'is-on': kind === one.value }">
        <input v-model="kind" type="radio" :name="`${id}-kind`" :value="one.value" />
        {{ one.label }}
       </label>
      </div>
     </fieldset>

     <template v-if="!table">
      <fieldset class="tb-booking__set">
       <legend class="tb-booking__legend">Day</legend>
       <div class="tb-booking__grid">
        <label v-for="one in days" :key="one.value" class="tb-booking__choice" :class="{ 'is-on': day === one.value }">
         <input v-model="day" type="radio" :name="`${id}-day`" :value="one.value" />
         {{ one.label }}
        </label>
       </div>
      </fieldset>
      <fieldset class="tb-booking__set" :aria-busy="loadingTimes ? 'true' : 'false'">
       <legend class="tb-booking__legend">{{ kind === 'delivery' ? 'Deliver at' : 'Ready at' }} <span class="tb-booking__zone">{{ zoneName }}</span></legend>
       <p v-if="!loadingTimes && !times.length" class="tb-note">No times left this day. Try another.</p>
       <div class="tb-booking__grid">
        <label v-for="one in times" :key="one.at" class="tb-booking__choice" :class="{ 'is-on': at === one.at }">
         <input v-model="at" type="radio" :name="`${id}-time`" :value="one.at" />
         {{ canvas ? one.time : clock(one.at) }}
        </label>
       </div>
      </fieldset>
     </template>

     <div class="tb-booking__who">
      <label class="tb-booking__field"><span>Name</span><input v-model="who.name" class="tb-form__control" autocomplete="name" required maxlength="120" /></label>
      <label class="tb-booking__field"><span>Email</span><input v-model="who.email" class="tb-form__control" type="email" autocomplete="email" required maxlength="254" /></label>
      <label class="tb-booking__field"><span>Phone <small>{{ who.textOk ? '(for texts)' : '(if you like)' }}</small></span><input v-model="who.phone" class="tb-form__control" type="tel" autocomplete="tel" maxlength="40" :required="who.textOk" /></label>
      <label v-if="menu?.texting" class="tb-booking__check"><input v-model="who.textOk" type="checkbox" /> <span>{{ menu.texting.consent }}<small v-if="who.textOk"> US numbers only. Otherwise we'll email you instead.</small></span></label>
      <template v-if="kind === 'delivery' && !table">
       <label class="tb-booking__field"><span>Street address</span><input v-model="who.address" class="tb-form__control" autocomplete="street-address" required maxlength="300" /></label>
       <label class="tb-booking__field"><span>ZIP code</span><input v-model="who.zip" class="tb-form__control" autocomplete="postal-code" inputmode="numeric" required maxlength="5" pattern="\d{5}" /></label>
      </template>
      <label class="tb-booking__field"><span>Anything we should know?</span><textarea v-model="who.note" class="tb-form__control" rows="2" maxlength="500" /></label>
     </div>

     <dl class="tb-order__sum">
      <template v-for="line in lines" :key="line.item.id">
       <dt>{{ line.item.name }}<template v-if="line.qty > 1"> × {{ line.qty }}</template></dt>
       <dd>{{ money(line.item.priceCents * line.qty) }}</dd>
      </template>
      <template v-if="fee">
       <dt>Delivery</dt>
       <dd>{{ money(fee) }}</dd>
      </template>
      <dt class="tb-order__total">Total</dt>
      <dd class="tb-order__total">{{ money(subtotal + fee) }}</dd>
     </dl>
     <p v-if="short" class="tb-note">Delivery orders start at {{ money(menu.delivery.minCents) }}. Add {{ money(short) }} more, or pick it up.</p>
    </template>

    <button v-if="sections.length" type="submit" class="tb-button tb-button--solid tb-booking__go" :disabled="busy || (!canvas && !ready)">
     <TbText v-if="!lines.length" :data="data" field="label" tag="span" />
     <span v-else>{{ data.label || 'Pay and order' }} · {{ money(subtotal + fee) }}</span>
    </button>
    <p v-if="problem" class="tb-booking__problem" role="alert">{{ problem }}</p>
    <p v-if="canvas" class="tb-note">Sample menu. Shows on the live site once Ordering is on, Payments takes money, and your menu is set up (Ordering in the studio).</p>
   </form>
  </div>
 </section>
</template>

<style>
 .tb-order__section {
  display: grid;
  gap: 4px;
 }

 .tb-order__items {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--site-border);
 }

 .tb-order__item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--site-border);
 }

 .tb-order__item.is-out {
  opacity: 0.6;
 }

 .tb-order__pic {
  width: 56px;
  height: 56px;
  border-radius: var(--site-radius, 8px);
  object-fit: cover;
 }

 .tb-order__what {
  display: grid;
  gap: 2px;
  grid-column: 2;
 }

 .tb-order__qty {
  display: flex;
  align-items: center;
  gap: 8px;
  grid-column: 3;
 }

 .tb-order__step {
  min-width: 36px;
  justify-content: center;
  padding: 4px 10px;
  font: inherit;
  cursor: pointer;
 }

 .tb-order__count {
  min-width: 1.5em;
  text-align: center;
  font-weight: 600;
 }

 .tb-order__sum {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px 16px;
  margin: 0;
 }

 .tb-order__sum dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
 }

 .tb-order__total {
  padding-top: 6px;
  border-top: 1px solid var(--site-border);
  font-weight: 700;
 }
</style>
