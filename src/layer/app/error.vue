<script setup>
 // What a visitor sees when a page can't be drawn. An address with nothing
 // published (404) gets the site's own look: its header and footer, "We
 // couldn't find that page", the site's search box when it has search,
 // four of its pages (the menu's, in the site's order) and its opening
 // hours from Site details when they're set. The site comes from the home
 // page's read, quietly (no head tags of its own, no analytics). Anything
 // else, like the studio not answering, or a preview link that has gone,
 // is a short apology with the way home. Always noindex.
 const props = defineProps({
  error: { type: Object, required: true },
 });

 const status = computed(() => Number(props.error?.statusCode) || 500);
 const missing = computed(() => status.value === 404);
 // A preview link that has run out or been turned off (pages/__timbrr/preview/[token].vue).
 const linkGone = computed(() => missing.value && props.error?.data?.preview === true);
 const asked = useRoute().path;

 useHead({
  htmlAttrs: { lang: 'en' },
  title: () => (missing.value ? 'Page not found' : 'Something went wrong'),
  meta: [{ name: 'robots', content: 'noindex' }],
 });

 // The home page's read, for the site's look. A home that won't load either
 // leaves the plain page.
 const home = missing.value && !linkGone.value && !asked.startsWith('/__timbrr/') ? await useTimbrrPage('/', { quiet: true }).catch(() => null) : null;
 const site = computed(() => (home ? { ...home.site.value, overHero: false } : null));
 const framed = computed(() => Boolean(site.value && (site.value.name || site.value.domain)));
 const popular = computed(() => (site.value?.nav ?? []).filter((item) => typeof item?.to === 'string' && item.to !== asked).slice(0, 4));
 const hours = computed(() => groupHours(site.value?.details?.hours));
 const reach = computed(() => {
  const details = site.value?.details ?? {};
  return [details.street, details.phone].map((part) => String(part ?? '').trim()).filter(Boolean).join(' · ');
 });
 // "Open until 5:00 pm": only in the browser, where the clock is the visitor's.
 const openLabel = ref('');
 onMounted(() => {
  if (hours.value.length) openLabel.value = openNow(site.value.details.hours, site.value.details.timezone)?.label ?? '';
 });

 // Another of the site's pages (home too) without loading the site again,
 // clearing the error on the way. A modifier key or another button is the
 // browser's (a new tab, say).
 function go(event, to) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  clearError({ redirect: to });
 }
</script>

<template>
 <div v-if="site" class="tb-page" :style="home.style.value">
  <a href="#main" class="tb-skip">Skip to main content</a>
  <TbSiteHeader v-if="framed" :site="site" />
  <main id="main" tabindex="-1" class="tb-page__main tb-section tb-missing">
   <div class="tb-wrap tb-missing__layout">
    <div class="tb-missing__main">
     <h1 class="tb-heading tb-missing__heading">We couldn't find that page</h1>
     <p class="tb-lede">
      Nothing lives at <code class="tb-missing__path">{{ asked }}</code> any more. It may have moved, or the link had a typo.
      <template v-if="site.search.on">Try a search, or start from one of these.</template>
      <template v-else-if="popular.length">Start from one of these.</template>
     </p>
     <form v-if="site.search.on" class="tb-missing__search" role="search" method="get" action="/search">
      <div class="tb-missing__box">
       <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
        <circle cx="7" cy="7" r="5" />
        <path d="M11 11l3.5 3.5" />
       </svg>
       <input type="search" name="q" aria-label="Search this site" maxlength="100" autocomplete="off" enterkeyhint="search" placeholder="Search" />
      </div>
      <button type="submit" class="tb-button tb-button--solid">Search</button>
     </form>
     <template v-if="popular.length">
      <h2 class="tb-missing__subheading">Popular pages</h2>
      <ul class="tb-missing__pages">
       <li v-for="item in popular" :key="item.to">
        <a :href="item.to" class="tb-missing__page" @click="go($event, item.to)">
         <span>{{ item.label }}</span>
         <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" /></svg>
        </a>
       </li>
      </ul>
     </template>
     <p v-else class="tb-buttons tb-missing__home"><a href="/" class="tb-button tb-button--solid" @click="go($event, '/')">Go to the home page</a></p>
    </div>
    <aside v-if="hours.length" class="tb-missing__hours" aria-labelledby="tb-missing-hours">
     <h2 id="tb-missing-hours" class="tb-missing__subheading">Opening hours</h2>
     <p v-if="openLabel" class="tb-missing__open">{{ openLabel }}</p>
     <dl>
      <div v-for="row in hours" :key="row.title" class="tb-missing__row">
       <dt>{{ row.title }}</dt>
       <dd>{{ row.body }}</dd>
      </div>
     </dl>
     <p v-if="reach" class="tb-missing__reach">{{ reach }}</p>
    </aside>
   </div>
  </main>
  <TbSiteFooter v-if="framed" :site="site" />
 </div>
 <main v-else class="tb-error">
  <div class="tb-wrap tb-wrap--narrow">
   <p class="tb-eyebrow">{{ status }}</p>
   <h1 class="tb-heading">{{ linkGone ? "This preview link doesn't work any more." : missing ? "We couldn't find that page." : 'Sorry, something went wrong.' }}</h1>
   <p class="tb-lede">{{ linkGone ? 'It may have run out, or been turned off. Ask whoever sent it for a new one.' : missing ? "It may have moved, or there's a typo in the address." : "This page didn't load. Try again in a minute." }}</p>
   <div class="tb-buttons">
    <a href="/" class="tb-button tb-button--solid" @click="go($event, '/')">Go to the home page</a>
   </div>
  </div>
 </main>
</template>

<style>
 /* The site's own 404: the message, search and pages, then the hours beside them. */
 .tb-missing__layout {
  display: grid;
  gap: 40px;
  align-items: start;
 }

 @media (min-width: 900px) {
  .tb-missing__layout:has(.tb-missing__hours) {
   grid-template-columns: minmax(0, 1fr) 340px;
   gap: 80px;
  }
 }

 .tb-missing__main {
  max-width: 700px;
 }

 .tb-missing__heading {
  margin: 0 0 16px;
 }

 .tb-missing__path {
  padding: 1px 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--site-accent) 8%, transparent);
  font-family: var(--site-font-mono);
  font-size: 0.85em;
  overflow-wrap: anywhere;
 }

 .tb-missing__search {
  display: flex;
  gap: 10px;
  margin-top: 28px;
 }

 .tb-missing__box {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 10px;
  min-width: 0;
  border: 1px solid var(--site-muted); /* 3:1 edge, 1.4.11 */
  border-radius: var(--site-control-radius);
  padding: 0 18px;
  background: var(--site-bg);
 }

 .tb-missing__box:focus-within {
  border-color: var(--site-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--site-accent) 16%, transparent);
 }

 .tb-missing__box svg {
  flex: none;
  color: var(--site-muted);
 }

 .tb-missing__box input {
  flex: 1;
  min-width: 0;
  border: 0;
  padding: 12px 0;
  background: transparent;
  font: inherit;
  color: var(--site-body);
 }

 .tb-missing__box input:focus-visible {
  outline: 0;
 }

 .tb-missing__home {
  margin-top: 28px;
 }

 .tb-missing__subheading {
  margin: 40px 0 12px;
  font-family: var(--site-font-display);
  font-size: 22px;
  color: var(--site-heading);
 }

 .tb-missing__hours .tb-missing__subheading {
  margin-top: 0;
  margin-bottom: 4px;
 }

 .tb-missing__pages {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--site-border);
 }

 .tb-missing__page {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid var(--site-border);
  color: var(--site-heading);
  font-family: var(--site-font-display);
  font-size: 20px;
  text-decoration: none;
 }

 .tb-missing__page:hover span,
 .tb-missing__page:focus-visible span {
  text-decoration: underline;
 }

 .tb-missing__hours {
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
  padding: 24px;
  background: var(--site-surface);
 }

 .tb-missing__open {
  margin: 0 0 12px;
  color: var(--site-accent);
  font-size: 14px;
  font-weight: 600;
 }

 .tb-missing__hours dl {
  margin: 12px 0 0;
 }

 .tb-missing__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--site-border);
 }

 .tb-missing__row dt {
  font-weight: 600;
 }

 .tb-missing__row dd {
  margin: 0;
  text-align: right;
 }

 .tb-missing__reach {
  margin: 12px 0 0;
  color: var(--site-muted);
  font-size: 14px;
 }
</style>
