<script setup>
 // /members: sign in or join (the studio's docs/members.md; Doop p2gjiRHrCW).
 // One box for both: an email, then a link by email, plus a 6-digit code to
 // type here when the email opens on another device. No password. The link
 // lands back here with ?t=, which signs in at once. `back` (a path on this
 // site) is where they go after.
 definePageMeta({ layout: false });
 const route = useRoute();
 const { own, site, style, memberIn } = await useTimbrrMembersFrame('Sign in');
 const back = computed(() => {
  const to = String(route.query.back ?? '');
  return /^\/(?![/\\])[A-Za-z0-9/_?=&.%-]{0,400}$/.test(to) && !to.startsWith('/members') ? to : '/account';
 });
 const email = ref('');
 const code = ref('');
 const step = ref('email'); // email | code
 const busy = ref(false);
 const problem = ref('');

 async function signedIn() {
  memberIn.value = true;
  await navigateTo(back.value, { replace: true });
 }
 async function verify(body) {
  busy.value = true;
  problem.value = '';
  try {
   await $fetch('/__timbrr/members/verify', { method: 'POST', body });
   await signedIn();
  } catch (error) {
   problem.value = membersProblem(error, "That didn't work. Ask for a new link.");
  } finally {
   busy.value = false;
  }
 }
 async function start() {
  busy.value = true;
  problem.value = '';
  try {
   await $fetch('/__timbrr/members/start', { method: 'POST', body: { email: email.value } });
   step.value = 'code';
  } catch (error) {
   problem.value = membersProblem(error, "Couldn't send the email. Try again in a minute.");
  } finally {
   busy.value = false;
  }
 }
 onMounted(() => {
  if (own) return;
  const token = String(route.query.t ?? '');
  if (/^[A-Za-z0-9_-]{32,64}$/.test(token)) verify({ token });
 });
</script>

<template>
 <TbPublishedPage v-if="own" />
 <TbMembersPage v-else :site="site" :page-style="style">
  <template v-if="memberIn">
   <h1 class="tb-heading tb-members__title">You're signed in</h1>
   <p class="tb-members__lede"><NuxtLink to="/account">Your account</NuxtLink></p>
  </template>
  <template v-else>
   <p v-if="route.query.t && busy" class="tb-members__lede" role="status">Signing you in…</p>
   <template v-if="step === 'email'">
    <h1 class="tb-heading tb-members__title">{{ site.members ? 'Sign in or join' : 'Sign in' }}</h1>
    <p class="tb-members__lede">{{ site.members ? 'One box for both. No password to remember.' : 'For members. No password to remember.' }}</p>
    <form class="tb-members__form" @submit.prevent="start">
     <label class="tb-booking__field"><span>Your email</span><input v-model="email" class="tb-form__control" type="email" autocomplete="email" required maxlength="254" /></label>
     <button type="submit" class="tb-button tb-button--solid tb-booking__go" :disabled="busy">{{ busy ? 'Sending…' : 'Email me a link' }}</button>
    </form>
    <p class="tb-note">New here? We make your account when you use the link. {{ site.name || 'This site' }} never sees a password, because there isn't one. <NuxtLink to="/how-we-count">What this site collects</NuxtLink></p>
   </template>
   <template v-else>
    <h1 class="tb-heading tb-members__title">Check your email</h1>
    <p class="tb-members__lede">We sent a link to {{ email }}. Tap it on this device, or type the 6-digit code from the email here.</p>
    <form class="tb-members__form" @submit.prevent="verify({ email, code })">
     <label class="tb-booking__field"><span>The code</span><input v-model="code" class="tb-form__control" inputmode="numeric" autocomplete="one-time-code" required maxlength="7" pattern="\d{3} ?\d{3}" /></label>
     <button type="submit" class="tb-button tb-button--solid tb-booking__go" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
    </form>
    <p class="tb-note"><button type="button" class="tb-members__link" @click="step = 'email'">Use another email, or send it again</button></p>
   </template>
   <p v-if="problem" class="tb-members__problem" role="alert">{{ problem }}</p>
  </template>
 </TbMembersPage>
</template>
