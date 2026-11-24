<script setup>
 // A pay page, /pay/<token> (the studio's docs/payments.md): an invoice or a
 // pay link the owner sent someone. The site's logo or name on top, what
 // it's for, then one button per way to pay (the whole thing, or a deposit
 // first). A button asks the studio for a Stripe Checkout address and goes
 // there; Stripe does the card form, Apple Pay and Google Pay, then sends
 // them back with ?paid=1. The amount is always worked out by the studio.
 // A token that doesn't exist, or an invoice that's void, is a friendly 404,
 // never indexed.
 definePageMeta({ layout: false });

 const route = useRoute();
 const token = computed(() => String(route.params.token ?? ''));
 const { data, error } = await useFetch(() => `/__timbrr/pay/${encodeURIComponent(token.value)}`, { key: `tb-pay-${token.value}`, retry: false, default: () => null });
 const status = error.value?.statusCode;
 if (error.value && status !== 404) throw createError({ statusCode: 502, statusMessage: 'Bad Gateway', message: "Couldn't get this page from the studio.", fatal: import.meta.client });

 const pay = computed(() => (data.value && typeof data.value.kind === 'string' ? data.value : null));
 const closed = computed(() => !pay.value || pay.value.status === 'void');
 if (import.meta.server && closed.value) setResponseStatus(useRequestEvent(), 404);

 const text = (value) => (typeof value === 'string' ? value.trim() : '');
 const site = computed(() => {
  const value = pay.value?.site ?? {};
  return { name: text(value.name), domain: text(value.domain), accent: text(value.accent), brand: normalizeBrand(value.brand) };
 });
 provide(TIMBRR_SITE_KEY, site);
 const style = computed(() => brandStyle(site.value.accent, site.value.brand));
 useBrandHead(style, () => site.value.brand);
 const logo = computed(() => {
  const image = site.value.brand?.logo;
  const src = safeSrc(image?.src);
  return src ? { src, alt: image.alt || site.value.name, width: image.width, height: image.height } : null;
 });

 const money = (cents) => (Number(cents || 0) / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
 const day = (value) => (value ? new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '');
 const owed = computed(() => Math.max(0, (pay.value?.totalCents ?? 0) - (pay.value?.paidCents ?? 0)));
 const title = computed(() => {
  const value = pay.value;
  if (!value) return '';
  if (value.kind === 'link') return value.title;
  if (value.status === 'paid') return `Invoice #${value.number} is paid`;
  return `${money(owed.value)} due ${day(value.dueOn)}`;
 });
 const justPaid = computed(() => route.query.paid === '1');
 const LABEL = { full: (cents) => `Pay ${money(cents)}`, deposit: (cents) => `Pay ${money(cents)} deposit now`, balance: (cents) => `Pay the rest, ${money(cents)}` };

 const busy = ref('');
 const problem = ref('');
 async function start(part) {
  busy.value = part;
  problem.value = '';
  try {
   const answer = await $fetch(`/__timbrr/pay/${encodeURIComponent(token.value)}`, { method: 'POST', body: { part } });
   if (!/^https:\/\/checkout\.stripe\.com\//.test(answer?.url ?? '')) throw new Error('no checkout');
   window.location.assign(answer.url);
  } catch (err) {
   problem.value = err?.data?.message || "Couldn't start the payment. Try again in a minute.";
   busy.value = '';
  }
 }

 useSeoMeta({ title: () => (closed.value ? 'Nothing to pay here' : [title.value, site.value.name].filter(Boolean).join(' · ')), robots: 'noindex, nofollow' });
</script>

<template>
 <main v-if="closed" class="tb-error tb-pay-closed">
  <div class="tb-wrap tb-wrap--narrow">
   <h1 class="tb-heading">Nothing to pay here.</h1>
   <p class="tb-lede">This link isn't in use. If someone sent it to you, ask them for a new one.</p>
  </div>
 </main>
 <div v-else class="tb-page tb-pay" :style="style">
  <header class="tb-pay__head">
   <div class="tb-wrap tb-pay__inner">
    <img v-if="logo" class="tb-pay__logo" :src="logo.src" :alt="logo.alt" :width="logo.width" :height="logo.height" />
    <span v-else-if="site.name" class="tb-pay__name tb-heading">{{ site.name }}</span>
   </div>
  </header>
  <main id="main" tabindex="-1" class="tb-page__main tb-pay__main">
   <div class="tb-wrap tb-pay__inner">
    <p v-if="pay.kind === 'invoice'" class="tb-eyebrow">Invoice #{{ pay.number }}<template v-if="pay.customerName"> · for {{ pay.customerName }}</template></p>
    <h1 class="tb-heading tb-pay__title">{{ title }}</h1>
    <p v-if="justPaid" class="tb-pay__done" role="status">Thank you. Your payment went through, and a receipt is on its way to your email.</p>
    <p v-if="pay.note" class="tb-pay__note">{{ pay.note }}</p>

    <table v-if="pay.kind === 'invoice'" class="tb-pay__lines" aria-label="What this invoice is for">
     <tbody>
      <tr v-for="(line, index) in pay.lines" :key="index">
       <th scope="row">{{ line.text }}<template v-if="line.qty > 1"> × {{ line.qty }}</template></th>
       <td>{{ money(line.qty * line.cents) }}</td>
      </tr>
      <tr class="tb-pay__total">
       <th scope="row">Total</th>
       <td>{{ money(pay.totalCents) }}</td>
      </tr>
      <tr v-if="pay.paidCents">
       <th scope="row">Paid</th>
       <td>{{ money(pay.paidCents) }}</td>
      </tr>
     </tbody>
    </table>
    <p v-else class="tb-pay__price">{{ money(pay.totalCents) }}</p>

    <div v-if="pay.parts.length && !justPaid" class="tb-pay__buttons">
     <button v-for="(part, index) in pay.parts" :key="part.part" type="button" class="tb-button" :class="index ? 'tb-button--outline' : 'tb-button--solid'" :disabled="Boolean(busy)" @click="start(part.part)">
      {{ busy === part.part ? 'Opening Stripe…' : LABEL[part.part](part.cents) }}
     </button>
    </div>
    <p v-else-if="pay.status === 'off'" class="tb-pay__note">This link is turned off.</p>
    <p v-else-if="pay.paused && pay.status !== 'paid'" class="tb-pay__note">Payments are paused for this site. Nothing was charged.</p>
    <p v-else-if="!pay.open && pay.status !== 'paid'" class="tb-pay__note">{{ site.name || 'This site' }} can't take payments right now. Try again later.</p>
    <p v-if="problem" class="tb-pay__problem" role="alert">{{ problem }}</p>
    <p class="tb-note tb-pay__secure">Paid securely through Stripe. Card, Apple Pay or Google Pay.</p>
   </div>
  </main>
 </div>
</template>

<style>
 .tb-pay__head {
  padding-block: 22px;
  border-bottom: 1px solid var(--site-border);
 }

 .tb-pay__inner {
  max-width: 560px;
 }

 .tb-pay__logo {
  display: block;
  max-width: 220px;
  max-height: 44px;
  width: auto;
  height: auto;
 }

 .tb-pay__name {
  font-size: 22px;
  font-weight: 700;
  color: var(--site-heading);
 }

 .tb-pay__main {
  padding-block: clamp(28px, 6vw, 56px);
 }

 .tb-pay__title {
  margin: 6px 0 12px;
  font-size: clamp(28px, 4vw, 38px);
  line-height: 1.15;
 }

 .tb-pay__note {
  margin: 0 0 20px;
  color: var(--site-body);
  white-space: pre-line;
 }

 .tb-pay__done {
  margin: 0 0 20px;
  padding: 12px 14px;
  border-left: 3px solid var(--site-accent);
  background: color-mix(in srgb, var(--site-accent) 8%, transparent);
 }

 .tb-pay__lines {
  width: 100%;
  margin: 8px 0 24px;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
 }

 .tb-pay__lines th,
 .tb-pay__lines td {
  padding: 12px 0;
  border-bottom: 1px solid var(--site-border);
  font-weight: 400;
  text-align: left;
 }

 .tb-pay__lines td {
  text-align: right;
  white-space: nowrap;
 }

 .tb-pay__total th,
 .tb-pay__total td {
  font-weight: 700;
 }

 .tb-pay__price {
  margin: 0 0 24px;
  font-size: 28px;
  font-weight: 700;
 }

 .tb-pay__buttons {
  display: grid;
  gap: 10px;
 }

 .tb-pay__buttons .tb-button {
  justify-content: center;
  width: 100%;
  font: inherit;
  cursor: pointer;
 }

 .tb-pay__problem {
  margin: 12px 0 0;
  color: #b42318;
 }

 .tb-pay__secure {
  margin-top: 16px;
  text-align: center;
 }
</style>
