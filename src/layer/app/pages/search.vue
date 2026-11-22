<script setup>
 // /search?q=: site search's own page (the studio's docs/search.md, "Site"),
 // inside the site's header and footer, which come with the home page's
 // read. Everything is in the address (q, kind, each filter, sort, page),
 // so a search can be shared, and the first results come from the server.
 // The filters are one plain GET form with the box, so without script they
 // still work with the Search button; with it, each change searches at once.
 // A site with search off has no /search (404).
 import { telHref } from '../../schema/frames.js';

 definePageMeta({ layout: false });

 const route = useRoute();
 const here = useRequestURL();
 const { site: home, style } = await useTimbrrPage('/');
 if (!home.value.search.on) throw createError({ statusCode: 404, statusMessage: 'Page Not Found', message: 'Nothing is published at /search.', fatal: import.meta.client });
 const site = home;

 const first = (value) => String([value].flat()[0] ?? '');
 const all = (value) => [value].flat().flatMap((one) => (typeof one === 'string' ? one.split(',') : []));
 const q = computed(() => first(route.query.q).trim().slice(0, 100));
 const typed = ref(q.value);
 watch(q, (value) => (typed.value = value));

 const { data: found, pending, error } = await useFetch('/__timbrr/search', {
  key: 'tb-search-page',
  query: computed(() => ({ ...route.query, v: 2, per: 20 })),
  retry: false,
  default: () => null,
 });

 const hits = computed(() => found.value?.hits ?? []);
 const total = computed(() => Number(found.value?.total) || 0);
 const page = computed(() => Number(found.value?.page) || 1);
 const pages = computed(() => Number(found.value?.pages) || 1);
 const sort = computed(() => (first(route.query.sort) === 'newest' ? 'newest' : 'best'));
 const suggestions = computed(() => site.value.search.suggestions);
 const phone = computed(() => String(site.value.details?.phone ?? '').trim());
 const email = computed(() => String(site.value.details?.email ?? '').trim());

 // The filters: kind first, then each of the owner's. A value with nothing
 // in it stays, greyed out, and can still be picked; a picked value always shows.
 const filters = computed(() => {
  const facets = found.value?.facets ?? {};
  const names = (key) => (key === 'kind' ? 'Kind' : slugWords(key.includes('.') ? key.split('.').pop() : key));
  return Object.keys(facets)
   .sort((a, b) => (a === 'kind' ? -1 : b === 'kind' ? 1 : 0))
   .map((key) => {
    const picked = all(route.query[key]);
    // Every kind the site has (`kinds`) shows, at 0 when another filter leaves none.
    const known = key === 'kind' ? Object.keys(found.value?.kinds ?? {}) : [];
    const counts = { ...Object.fromEntries([...known, ...picked].map((value) => [value, 0])), ...(facets[key] ?? {}) };
    const values = Object.entries(counts).map(([value, n]) => ({ value, n: Number(n) || 0, label: key === 'kind' ? kindName(value, found.value) : slugWords(value), on: picked.includes(value) }));
    return { key, name: names(key), values };
   })
   .filter((filter) => filter.values.length);
 });

 const form = ref(null);
 function submit() {
  const query = {};
  for (const [key, value] of new FormData(form.value)) {
   const text = String(value).trim();
   if (!text || (key === 'sort' && text === 'best')) continue;
   query[key] = key in query ? [query[key]].flat().concat(text) : text;
  }
  navigateTo({ path: '/search', query });
 }
 const at = (n) => ({ path: '/search', query: { ...route.query, page: n > 1 ? String(n) : undefined } });
 function opened() {
  rememberSearch(q.value);
  sendSearchNote('opened', q.value);
 }
 // Each search this page loads is logged once (the pop-up's own already was).
 const log = (words) => words.length >= 2 && !takeHandedSearch(words) && sendSearchNote('log', words);
 onMounted(() => log(q.value));
 watch(q, log);

 const title = computed(() => [q.value ? `Search: ${q.value}` : 'Search', site.value.name].filter(Boolean).join(' · '));
 useHead({ link: [{ rel: 'canonical', href: `${here.origin}/search` }], htmlAttrs: { 'data-tb-p': '/search' } });
 useSeoMeta({ title, description: null, robots: 'noindex', ogTitle: title, ogUrl: `${here.origin}/search` });
</script>

<template>
 <div class="tb-page" :style="style">
  <a href="#main" class="tb-skip">Skip to main content</a>
  <TbSiteHeader :site="site" />
  <main id="main" tabindex="-1" class="tb-page__main tb-section tb-search-page">
   <div class="tb-wrap">
    <h1 class="tb-heading tb-search-page__heading">{{ site.name ? `Search ${site.name}` : 'Search' }}</h1>
    <form ref="form" class="tb-search-page__form" role="search" method="get" action="/search" @submit.prevent="submit" @change="submit">
     <div class="tb-search-page__box">
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
       <circle cx="7" cy="7" r="5" />
       <path d="M11 11l3.5 3.5" />
      </svg>
      <input v-model="typed" type="search" name="q" aria-label="Search this site" maxlength="100" autocomplete="off" enterkeyhint="search" placeholder="Search" @change.stop />
      <button type="submit" class="tb-button tb-button--solid">Search</button>
     </div>

     <div class="tb-search-page__layout">
      <aside v-if="filters.length" class="tb-search-page__rail" aria-label="Filters">
       <fieldset v-for="filter in filters" :key="filter.key" class="tb-search-page__filter">
        <legend>{{ filter.name }}</legend>
        <label v-for="item in filter.values" :key="item.value" class="tb-search-page__check" :class="{ 'is-empty': !item.n }">
         <input type="checkbox" :name="filter.key" :value="item.value" :checked="item.on" />
         <span>{{ item.label }}</span>
         <span class="tb-search-page__n">{{ item.n }}</span>
        </label>
       </fieldset>
      </aside>

      <div class="tb-search-page__results">
       <div v-if="q.length >= 2" class="tb-search-page__top">
        <p class="tb-search-page__status" role="status" aria-live="polite">
         <template v-if="pending">Searching…</template>
         <template v-else-if="error">{{ error.statusCode === 429 ? 'Too many searches. Try again in a minute.' : "Couldn't search right now. Try again in a minute." }}</template>
         <template v-else>{{ total }} {{ total === 1 ? 'result' : 'results' }} for “{{ q }}”</template>
        </p>
        <label v-if="total" class="tb-search-page__sort">
         Sort
         <select name="sort" :value="sort">
          <option value="best">Best match</option>
          <option value="newest">Newest</option>
         </select>
        </label>
       </div>
       <p v-else class="tb-search-page__status">Type at least two letters.</p>

       <p v-if="found?.partial && hits.length" class="tb-search-page__note">Nothing has every word. These have some of them.</p>

       <ol v-if="hits.length && !error" class="tb-search-page__list" role="list">
        <li v-for="hit in hits" :key="hit.id ?? hit.path">
         <NuxtLink :to="hit.path" class="tb-search-page__hit" @click="opened">
          <TbSearchRow :hit="hit" :kind="hit.kindName || kindName(hit.kind, found)" big />
         </NuxtLink>
        </li>
       </ol>

       <div v-else-if="q.length >= 2 && found && !pending && !error" class="tb-search-page__none">
        <p v-if="found.didYouMean">
         Did you mean <NuxtLink :to="{ path: '/search', query: { q: found.didYouMean } }">{{ found.didYouMean }}</NuxtLink>?
        </p>
        <template v-if="suggestions.length">
         <p class="tb-eyebrow">Or try</p>
         <ul class="tb-search-page__chips">
          <li v-for="pick in suggestions" :key="pick">
           <NuxtLink :to="{ path: '/search', query: { q: pick } }">{{ pick }}</NuxtLink>
          </li>
         </ul>
        </template>
        <p v-if="phone || email" class="tb-search-page__stuck">
         <strong>Still stuck?</strong>
         <a v-if="telHref(phone)" :href="telHref(phone)">Call {{ phone }}</a>
         <a v-if="email" :href="`mailto:${email}`">Email {{ email }}</a>
        </p>
       </div>

       <nav v-if="pages > 1 && !error" class="tb-search-page__pages" aria-label="Pages of results">
        <NuxtLink v-if="page > 1" :to="at(page - 1)" class="tb-button tb-button--outline">Previous</NuxtLink>
        <span>Page {{ page }} of {{ pages }}</span>
        <NuxtLink v-if="page < pages" :to="at(page + 1)" class="tb-button tb-button--outline">Next</NuxtLink>
       </nav>
      </div>
     </div>
    </form>
   </div>
  </main>
  <TbSiteFooter :site="site" />
 </div>
</template>

<style>
 .tb-search-page__heading {
  margin: 0 0 20px;
 }

 .tb-search-page__box {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--site-muted); /* 3:1 edge, 1.4.11 */
  border-radius: var(--site-radius);
  padding: 8px 8px 8px 18px;
  background: var(--site-bg);
 }

 .tb-search-page__box:focus-within {
  border-color: var(--site-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--site-accent) 16%, transparent);
 }

 .tb-search-page__box svg {
  flex: none;
  color: var(--site-accent);
 }

 .tb-search-page__box input {
  flex: 1;
  min-width: 0;
  border: 0;
  padding: 8px 0;
  background: transparent;
  font: inherit;
  font-family: var(--site-font-display);
  font-size: 22px;
  color: var(--site-heading);
 }

 .tb-search-page__box input:focus-visible {
  outline: 0;
 }

 .tb-search-page__layout {
  display: grid;
  gap: 32px;
  margin-top: 28px;
 }

 @media (min-width: 820px) {
  .tb-search-page__layout:has(.tb-search-page__rail) {
   grid-template-columns: 220px minmax(0, 1fr);
  }
 }

 .tb-search-page__filter {
  margin: 0 0 22px;
  border: 0;
  padding: 0;
 }

 .tb-search-page__filter legend {
  margin-bottom: 8px;
  padding: 0;
  font-family: var(--site-font-mono);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--site-eyebrow);
 }

 .tb-search-page__check {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 36px;
  font-size: 15px;
  color: var(--site-ink);
  cursor: pointer;
 }

 @media (max-width: 640px) {
  .tb-search-page__check {
   min-height: 44px;
  }
 }

 .tb-search-page__check input {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: var(--site-accent);
 }

 /* Nothing there under the other picks: greyed, but still pickable (a value's own filter is an OR). */
 .tb-search-page__check.is-empty {
  color: var(--site-muted);
 }

 .tb-search-page__n {
  margin-left: auto;
  font-size: 13px;
  color: var(--site-muted);
 }

 .tb-search-page__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--site-border);
  padding-bottom: 12px;
 }

 .tb-search-page__status,
 .tb-search-page__note {
  margin: 0;
  font-size: 15px;
  color: var(--site-muted);
 }

 .tb-search-page__note {
  margin-top: 12px;
 }

 .tb-search-page__sort {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--site-muted);
 }

 .tb-search-page__sort select {
  border: 1px solid var(--site-muted);
  border-radius: var(--site-control-radius);
  padding: 6px 10px;
  background: var(--site-bg);
  font: inherit;
  color: var(--site-ink);
 }

 .tb-search-page__list {
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-search-page__hit {
  display: block;
  margin-inline: -12px;
  border-radius: calc(var(--site-radius) * 0.7);
  padding: 14px 12px;
  color: inherit;
  text-decoration: none;
 }

 .tb-search-page__hit:hover {
  background: var(--site-surface);
 }

 .tb-search-page__none {
  padding-top: 16px;
 }

 .tb-search-page__none a {
  font-weight: 600;
  color: var(--site-accent);
 }

 .tb-search-page__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-search-page__chips a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  border: 1px solid var(--site-border);
  border-radius: var(--site-control-radius);
  padding: 0 14px;
  font-weight: 500;
  color: var(--site-ink);
  text-decoration: none;
 }

 .tb-search-page__stuck {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-top: 24px;
  border-radius: calc(var(--site-radius) * 0.7);
  padding: 14px 18px;
  background: var(--site-surface);
 }

 .tb-search-page__pages {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 28px;
  font-size: 14px;
  color: var(--site-muted);
 }
</style>
