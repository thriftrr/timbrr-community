<script setup>
 // The join box under a locked page or entry's teaser (the studio's
 // docs/members.md): what it takes to see the rest, and one way in. Free
 // ("Any member") is Join, which is signing in; plans go to /join. A
 // signed-in member on the wrong plan is sent to /join to pick one.
 const props = defineProps({ access: { type: Object, required: true } });
 const route = useRoute();
 const memberIn = useTimbrrMemberIn();
 const site = inject(TIMBRR_SITE_KEY, ref({}));
 const back = computed(() => encodeURIComponent(route.fullPath));
 const plans = computed(() => (Array.isArray(props.access.plans) ? props.access.plans.map((plan) => plan.name).filter(Boolean) : []));
 const forPlans = computed(() => props.access.who === 'plans' && plans.value.length);
 const words = computed(() => (forPlans.value ? `For members on ${plans.value.length > 1 ? `${plans.value.slice(0, -1).join(', ')} or ${plans.value.at(-1)}` : plans.value[0]}.` : `Free to join${site.value?.name ? ` ${site.value.name}` : ''}. Takes a minute, no password.`));
 const to = computed(() => (forPlans.value || memberIn.value ? `/join?back=${back.value}` : `/members?back=${back.value}`));
</script>

<template>
 <section class="tb-members-gate" aria-labelledby="tb-members-gate">
  <div class="tb-wrap">
   <div class="tb-members-gate__box">
    <h2 id="tb-members-gate" class="tb-heading">The rest is for members</h2>
    <p>{{ words }}</p>
    <div class="tb-buttons">
     <NuxtLink :to="to" class="tb-button tb-button--solid">{{ forPlans ? 'See the plans' : memberIn ? 'Pick a plan' : 'Join or sign in' }}</NuxtLink>
    </div>
   </div>
  </div>
 </section>
</template>
