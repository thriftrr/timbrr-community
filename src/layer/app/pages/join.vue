<script setup>
 // /join: pick a plan (the studio's docs/members.md; Doop STeYKZwx2S). Free
 // (Neighbor) is every member; paid plans monthly, or yearly at ten months.
 // A plan opens Stripe Checkout on the site's own account; a trial takes the
 // card at the start. Not signed in, the button signs in first and comes back.
 definePageMeta({ layout: false });
 const route = useRoute();
 const { own, site, style } = await useTimbrrMembersFrame('Pick your plan');
 const memberIn = useTimbrrMemberIn();
 const { data, error } = own ? { data: ref(null), error: ref(null) } : await useFetch('/__timbrr/members/plans', { key: 'tb-members-plans', retry: false, default: () => null });
 const plans = computed(() => data.value?.plans ?? []);
 const yearly = ref(false);
 const busy = ref('');
 const problem = ref('');
 const money = (cents) => (Number(cents || 0) / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: cents % 100 ? 2 : 0 });
 const here = computed(() => encodeURIComponent(route.fullPath));
 async function pick(plan) {
  if (!memberIn.value) return navigateTo(`/members?back=${here.value}`);
  busy.value = plan.id;
  problem.value = '';
  try {
   const answer = await $fetch('/__timbrr/members/join', { method: 'POST', body: { plan: plan.id, interval: yearly.value ? 'year' : 'month' } });
   if (!/^https:\/\/checkout\.stripe\.com\//.test(answer?.url ?? '')) throw new Error('no checkout');
   window.location.assign(answer.url);
  } catch (err) {
   if (err?.statusCode === 401 || err?.response?.status === 401) {
    memberIn.value = false;
    return navigateTo(`/members?back=${here.value}`);
   }
   problem.value = membersProblem(err, "Couldn't open checkout. Try again in a minute.");
   busy.value = '';
  }
 }
</script>

<template>
 <TbPublishedPage v-if="own" />
 <TbMembersPage v-else :site="site" :page-style="style">
  <h1 class="tb-heading tb-members__title">Pick your plan</h1>
  <p class="tb-members__lede">Change or cancel any time. No contract.</p>
  <p v-if="error || data?.open === false" class="tb-members__lede">{{ site.name || 'This site' }} isn't taking new members right now.</p>
  <template v-else>
   <div v-if="plans.length" class="tb-members__switch" role="group" aria-label="Billing">
    <button type="button" class="tb-button" :class="yearly ? 'tb-button--outline' : 'tb-button--solid'" :aria-pressed="!yearly" @click="yearly = false">Monthly</button>
    <button type="button" class="tb-button" :class="yearly ? 'tb-button--solid' : 'tb-button--outline'" :aria-pressed="yearly" @click="yearly = true">Yearly, 2 months free</button>
   </div>
   <ul class="tb-members__rows">
    <li class="tb-members__row">
     <div>
      <h2 class="tb-heading">Neighbor</h2>
      <p>Free. Everything for members.</p>
     </div>
     <span class="tb-members__price">Free</span>
     <NuxtLink v-if="!memberIn" to="/members" class="tb-button tb-button--outline">Join free</NuxtLink>
    </li>
    <li v-for="plan in plans" :key="plan.id" class="tb-members__row">
     <div>
      <h2 class="tb-heading">{{ plan.name }}</h2>
      <p v-if="plan.line">{{ plan.line }}</p>
     </div>
     <span class="tb-members__price">{{ yearly ? `${money(plan.yearlyCents)} a year` : `${money(plan.monthlyCents)} a month` }}</span>
     <button v-if="data?.canJoin" type="button" class="tb-button tb-button--solid" :disabled="Boolean(busy)" @click="pick(plan)">{{ busy === plan.id ? 'Opening Stripe…' : plan.trialDays ? `Start ${plan.trialDays}-day free trial` : 'Choose' }}</button>
    </li>
   </ul>
   <p v-if="plans.length && !data?.canJoin" class="tb-note">Paid plans open soon.</p>
   <p v-if="problem" class="tb-members__problem" role="alert">{{ problem }}</p>
   <p v-if="plans.length" class="tb-note">Paid securely through Stripe.</p>
  </template>
 </TbMembersPage>
</template>
