<script setup>
 // What a visitor sees when a page can't be drawn: "We couldn't find that
 // page" for an address with nothing published (404), and a short apology
 // for anything else, like the studio not answering. Plain, in the site's
 // own type and colors (the --site-* variables and the shared primitives),
 // with the way home.
 const props = defineProps({
  error: { type: Object, required: true },
 });

 const status = computed(() => Number(props.error?.statusCode) || 500);
 const missing = computed(() => status.value === 404);

 useHead({
  htmlAttrs: { lang: 'en' },
  title: () => (missing.value ? 'Page not found' : 'Something went wrong'),
  meta: [{ name: 'robots', content: 'noindex' }],
 });

 // Home without loading the site again, clearing the error on the way. A
 // modifier key or another button is the browser's (a new tab, say).
 function home(event) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  clearError({ redirect: '/' });
 }
</script>

<template>
 <main class="tb-error">
  <div class="tb-wrap tb-wrap--narrow">
   <p class="tb-eyebrow">{{ status }}</p>
   <h1 class="tb-heading">{{ missing ? "We couldn't find that page." : 'Sorry, something went wrong.' }}</h1>
   <p class="tb-lede">{{ missing ? "It may have moved, or there's a typo in the address." : "This page didn't load. Try again in a minute." }}</p>
   <div class="tb-buttons">
    <a href="/" class="tb-button tb-button--solid" @click="home">Go to the home page</a>
   </div>
  </div>
 </main>
</template>
