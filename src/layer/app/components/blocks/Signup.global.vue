<script setup>
 // Sign-up: a headline, a line, an email box and a button that put a
 // visitor on the site's email list (the studio's docs/marketing.md),
 // through /__timbrr/signup. The studio emails them a confirm link first,
 // and answers the same whether or not they were on the list, so this
 // always says "check your email". A hidden box catches bots. On the
 // studio's canvas it draws and doesn't send.
 const props = defineProps({ data: { type: Object, required: true } });
 const canvas = useCanvas();
 const route = useRoute();
 const id = useId();
 const email = ref('');
 const name = ref('');
 const phone = ref('');
 const textOk = ref(false);
 const hp = ref('');
 const busy = ref(false);
 const done = ref('');
 const problem = ref('');

 async function join() {
  if (canvas || busy.value) return;
  busy.value = true;
  problem.value = '';
  try {
   const answer = await $fetch('/__timbrr/signup', {
    method: 'POST',
    body: { email: email.value, name: props.data.ask_name ? name.value : '', phone: props.data.text_me && textOk.value ? phone.value : '', textOk: Boolean(props.data.text_me && textOk.value && phone.value), consent: props.data.consent, page: route.path, hp: hp.value },
   });
   done.value = answer?.message || 'Almost there. Check your email and press the link to confirm.';
  } catch (err) {
   problem.value = err?.data?.message || "Couldn't sign you up just now. Try again in a minute.";
  } finally {
   busy.value = false;
  }
 }
</script>

<template>
 <section class="tb-section tb-signup">
  <div class="tb-wrap tb-wrap--narrow tb-signup__inner">
   <TbText v-if="data.headline || canvas" :data="data" field="headline" tag="h2" class="tb-heading tb-signup__headline" />
   <TbText v-if="data.body || canvas" :data="data" field="body" tag="p" class="tb-signup__body" />
   <p v-if="done" class="tb-signup__done" role="status">{{ done }}</p>
   <form v-else class="tb-signup__form" @submit.prevent="join">
    <div class="tb-signup__row">
     <label v-if="data.ask_name" class="tb-signup__field">
      <span class="tb-sr">First name</span>
      <input v-model="name" class="tb-form__control" autocomplete="given-name" maxlength="120" placeholder="First name" />
     </label>
     <label class="tb-signup__field tb-signup__field--email">
      <span class="tb-sr">Email</span>
      <input v-model="email" class="tb-form__control" type="email" inputmode="email" autocomplete="email" maxlength="254" placeholder="Your email" required />
     </label>
     <button type="submit" class="tb-button tb-button--solid tb-signup__go" :disabled="busy">
      <TbText :data="data" field="submit_label" tag="span" />
     </button>
    </div>
    <label class="tb-signup__hp" aria-hidden="true">Leave this empty <input v-model="hp" tabindex="-1" autocomplete="off" /></label>
    <template v-if="data.text_me">
     <label class="tb-signup__check"><input v-model="textOk" type="checkbox" /> Text me too</label>
     <label v-if="textOk" class="tb-signup__field">
      <span class="tb-sr">Mobile number</span>
      <input v-model="phone" class="tb-form__control" type="tel" inputmode="tel" autocomplete="tel" maxlength="30" placeholder="Mobile number" />
     </label>
    </template>
    <TbText v-if="data.consent || canvas" :data="data" field="consent" tag="p" class="tb-signup__consent" />
    <p v-if="problem" class="tb-signup__problem" role="alert">{{ problem }}</p>
    <p v-if="canvas" class="tb-note">On the live site, people who sign up get an email to confirm, then join your list in Marketing. Texts aren't sent yet.</p>
   </form>
  </div>
 </section>
</template>

<style>
 .tb-signup {
  text-align: center;
 }

 .tb-signup__headline {
  margin: 0;
  font-size: calc(clamp(26px, 2vw + 14px, 36px) * var(--site-heading-scale, 1));
 }

 .tb-signup__body {
  max-width: 34em;
  margin: 12px auto 0;
  color: var(--site-body);
 }

 .tb-signup__form {
  display: grid;
  justify-items: center;
  gap: 12px;
  margin-top: 24px;
 }

 .tb-signup__row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  width: 100%;
  max-width: 560px;
 }

 .tb-signup__field {
  display: grid;
  flex: 1 1 160px;
 }

 .tb-signup__field--email {
  flex: 2 1 220px;
 }

 .tb-signup__go {
  justify-content: center;
  font: inherit;
  cursor: pointer;
 }

 .tb-signup__check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
 }

 .tb-signup__consent {
  max-width: 36em;
  margin: 0;
  font-size: 13px;
  color: var(--site-body);
 }

 .tb-signup__hp {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
 }

 .tb-signup__done {
  margin: 24px auto 0;
  max-width: 30em;
  font-weight: 600;
 }

 .tb-signup__problem {
  margin: 0;
  color: #b42318;
 }

 .tb-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
 }
</style>
