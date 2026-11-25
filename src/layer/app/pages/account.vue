<script setup>
 // /account: a member's own page (the studio's docs/members.md): their email,
 // their plan, Manage billing (Stripe's own page: cancel, card, receipts),
 // Pick a plan, and Sign out (here or everywhere). Not signed in: to /members.
 definePageMeta({ layout: false });
 const route = useRoute();
 const nuxtApp = useNuxtApp();
 const { own, site, style, memberIn } = await useTimbrrMembersFrame('Your account');
 const { data, error } = own ? { data: ref(null), error: ref(null) } : await nuxtApp.runWithContext(() => useFetch('/__timbrr/members/me', { key: 'tb-members-me', retry: false, default: () => null }));
 if (!own && error.value?.statusCode === 401 || error.value?.statusCode === 404) {
  memberIn.value = false;
  await nuxtApp.runWithContext(() => navigateTo('/members?back=/account', { replace: true }));
 }
 const me = computed(() => data.value?.member ?? null);
 const busy = ref(false);
 const problem = ref('');
 const day = (value) => (value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
 const planLine = computed(() => {
  const value = me.value;
  if (!value?.plan) return 'Neighbor · free';
  const end = value.periodEnd ? (value.status === 'canceled' ? ` · ends ${day(value.periodEnd)}` : value.status === 'trialing' ? ` · trial ends ${day(value.periodEnd)}` : ` · renews ${day(value.periodEnd)}`) : '';
  return `${value.plan.name}${value.status === 'past_due' ? ' · your last payment failed, update your card' : end}`;
 });
 async function manage() {
  busy.value = true;
  problem.value = '';
  try {
   const answer = await $fetch('/__timbrr/members/portal', { method: 'POST', body: {} });
   if (!/^https:\/\/billing\.stripe\.com\//.test(answer?.url ?? '')) throw new Error('no portal');
   window.location.assign(answer.url);
  } catch (err) {
   problem.value = membersProblem(err, "Couldn't open billing. Try again in a minute.");
   busy.value = false;
  }
 }
 async function signOut(everywhere) {
  busy.value = true;
  try {
   await $fetch('/__timbrr/members/signout', { method: 'POST', body: { everywhere } });
  } catch {
   // The cookie goes either way.
  }
  memberIn.value = false;
  await navigateTo('/', { replace: true });
 }
</script>

<template>
 <TbPublishedPage v-if="own" />
 <TbMembersPage v-else :site="site" :page-style="style">
  <h1 class="tb-heading tb-members__title">Your account</h1>
  <p v-if="route.query.joined" class="tb-members__done" role="status">Welcome. Your plan starts as soon as Stripe confirms it, usually within a minute.</p>
  <template v-if="me">
   <ul class="tb-members__rows">
    <li class="tb-members__row">
     <div>
      <h2 class="tb-heading">Email</h2>
      <p>{{ me.email }}</p>
     </div>
    </li>
    <li class="tb-members__row">
     <div>
      <h2 class="tb-heading">Plan</h2>
      <p>{{ planLine }}</p>
     </div>
     <button v-if="me.billed" type="button" class="tb-button tb-button--outline" :disabled="busy" @click="manage">Manage billing</button>
     <NuxtLink v-else-if="data?.canJoin && data?.plans?.length" to="/join" class="tb-button tb-button--outline">See plans</NuxtLink>
    </li>
   </ul>
   <p v-if="problem" class="tb-members__problem" role="alert">{{ problem }}</p>
   <div class="tb-buttons">
    <button type="button" class="tb-button tb-button--solid" :disabled="busy" @click="signOut(false)">Sign out</button>
    <button type="button" class="tb-members__link" :disabled="busy" @click="signOut(true)">Sign out everywhere</button>
   </div>
  </template>
 </TbMembersPage>
</template>
