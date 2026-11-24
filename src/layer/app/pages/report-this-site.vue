<script setup>
 // /report-this-site: "Report this site", linked small from every footer
 // (the studio's docs/payments-safety.md). A visitor tells Timbrr, the
 // service the site runs on, that something here is wrong: what kind, a few
 // words, and an email if they want an answer. It goes to the Timbrr team,
 // not to the site's owner, through /__timbrr/report. A hidden box catches
 // bots; the studio rate limits. In the site's own header, footer and look,
 // like /how-we-count. Not indexed.
 definePageMeta({ layout: false });

 const { site, style } = await useTimbrrPage('/');
 const route = useRoute();
 const name = computed(() => site.value.name || site.value.domain || 'this site');

 const REASONS = [
  { key: 'illegal', label: 'It sells something illegal or restricted' },
  { key: 'scam', label: "It's a scam or fraud" },
  { key: 'stolen', label: 'It uses my words, photos or brand without permission' },
  { key: 'other', label: 'Something else' },
 ];
 const reason = ref('');
 const details = ref('');
 const email = ref('');
 const hp = ref('');
 const busy = ref(false);
 const done = ref(false);
 const problem = ref('');
 const thanks = ref(null);
 // The page they came from, when the footer link passed it.
 const page = computed(() => (typeof route.query.from === 'string' && route.query.from.startsWith('/') ? route.query.from.slice(0, 300) : ''));

 async function send() {
  if (busy.value) return;
  if (!reason.value) {
   problem.value = "Pick what's wrong.";
   return;
  }
  busy.value = true;
  problem.value = '';
  try {
   await $fetch('/__timbrr/report', { method: 'POST', body: { reason: reason.value, details: details.value, email: email.value, page: page.value, hp: hp.value } });
   done.value = true;
   // The form, and the button that had focus, are gone: land on the thank you.
   await nextTick();
   thanks.value?.focus();
  } catch (err) {
   problem.value = err?.data?.message || "Couldn't send that just now. Try again in a minute.";
  } finally {
   busy.value = false;
  }
 }

 const title = computed(() => ['Report this site', site.value.name].filter(Boolean).join(' · '));
 useHead({ meta: [{ name: 'robots', content: 'noindex' }] });
 useSeoMeta({ title });
</script>

<template>
 <div class="tb-page" :style="style">
  <a href="#main" class="tb-skip">Skip to main content</a>
  <TbSiteHeader :site="site" />
  <main id="main" tabindex="-1" class="tb-page__main tb-section tb-report">
   <div class="tb-wrap tb-wrap--narrow">
    <h1 class="tb-heading tb-report__title">Report this site</h1>
    <p class="tb-report__lede">{{ name }} runs on Timbrr. If something here is illegal, a scam, or yours, tell us. This goes to the Timbrr team, not to the site's owner.</p>

    <p v-if="done" ref="thanks" class="tb-report__done" role="status" tabindex="-1">Thank you. The Timbrr team will look at it.</p>
    <form v-else class="tb-report__form" novalidate @submit.prevent="send">
     <fieldset class="tb-report__reasons">
      <legend class="tb-report__label">What's wrong?</legend>
      <label v-for="one in REASONS" :key="one.key" class="tb-report__reason">
       <input v-model="reason" type="radio" name="reason" :value="one.key" required />
       {{ one.label }}
      </label>
     </fieldset>
     <label class="tb-report__field">
      <span class="tb-report__label">Tell us more <span class="tb-report__hint">{{ reason === 'other' ? '' : '(optional)' }}</span></span>
      <textarea v-model="details" class="tb-report__control" rows="5" maxlength="2000" />
     </label>
     <label class="tb-report__field">
      <span class="tb-report__label">Your email <span class="tb-report__hint">(optional, only if you'd like an answer)</span></span>
      <input v-model.trim="email" class="tb-report__control" type="email" inputmode="email" autocomplete="email" maxlength="254" />
     </label>
     <label class="tb-report__hp" aria-hidden="true">Leave this empty <input v-model="hp" tabindex="-1" autocomplete="off" /></label>
     <p v-if="problem" class="tb-report__problem" role="alert">{{ problem }}</p>
     <div><button type="submit" class="tb-button tb-button--solid" :disabled="busy">{{ busy ? 'Sending…' : 'Send report' }}</button></div>
    </form>
   </div>
  </main>
  <TbSiteFooter :site="site" />
 </div>
</template>

<style>
 .tb-report__title {
  font-size: calc(clamp(30px, 4vw, 44px) * var(--site-heading-scale));
 }

 .tb-report__lede {
  margin: 14px 0 28px;
  color: var(--site-body);
 }

 .tb-report__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
 }

 .tb-report__reasons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
 }

 .tb-report__label {
  margin-bottom: 4px;
  padding: 0;
  font-weight: 600;
  color: var(--site-heading);
 }

 .tb-report__hint {
  font-weight: 400;
  color: var(--site-body);
 }

 .tb-report__reason {
  display: flex;
  align-items: center;
  gap: 10px;
 }

 .tb-report__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
 }

 .tb-report__control {
  width: 100%;
  border: 1px solid var(--site-muted);
  border-radius: var(--site-control-radius);
  padding: 11px 14px;
  background: var(--site-bg);
  font: inherit;
  font-size: 16px;
  color: var(--site-heading);
 }

 .tb-report__control:focus-visible,
 .tb-report__reason input:focus-visible {
  outline: 2px solid var(--site-accent);
  outline-offset: 2px;
 }

 .tb-report__hp {
  position: absolute;
  left: -9999px;
 }

 .tb-report__problem {
  margin: 0;
  color: var(--site-alert, #b42318);
 }

 .tb-report__done {
  padding: 16px 0;
  font-size: 18px;
 }
</style>
