<script setup>
 // A search box over the site's published content entries, asked of the
 // studio through the site's own /__timbrr/search (kept a minute at the
 // edge). What was searched is in the address (?q=), so a search can be
 // linked to, reloaded and gone back to, and the first results come with
 // the page from the server. It's a plain form: without scripts it still
 // sends ?q= to the page. With a results page set, the box sends the
 // visitor there, and the Site search block on that page shows what's
 // found. It searches when asked (Enter or the button), not as you type.
 // On the canvas there's no site to ask, so it draws the box and a note.
 const props = defineProps({ data: { type: Object, required: true } });
 const shows = useFieldShown();
 const canvas = useCanvas();
 const scope = inject(BLOCK_KEY, null);
 const route = useRoute();
 const uid = useId();

 // Results go to another page only when it's a page of this site.
 const to = computed(() => (/^\/(?!\/)/.test(props.data.to ?? '') ? props.data.to.replace(/[?#].*$/, '') : ''));
 const tidy = (path) => path.replace(/\/+$/, '') || '/';
 const elsewhere = computed(() => Boolean(to.value) && tidy(to.value) !== tidy(route.path));
 const q = computed(() => (canvas || elsewhere.value ? '' : String([route.query.q].flat()[0] ?? '').trim().slice(0, 100)));
 const typed = ref(q.value);
 const page = ref(1);

 const query = computed(() => ({ q: q.value.toLowerCase(), limit: props.data.limit ?? 10, p: page.value }));
 const { data: found, pending, error, execute } = await useFetch('/__timbrr/search', {
  key: `tb-search-${scope?.id ?? 'box'}`,
  query,
  immediate: q.value.length >= 2,
  watch: false,
  retry: false,
  default: () => null,
 });
 const ask = () => (q.value.length >= 2 ? execute() : (found.value = null));
 watch(q, (value) => {
  typed.value = value;
  page.value = 1;
  ask();
 });

 async function submit() {
  if (canvas) return;
  const words = typed.value.trim();
  if (elsewhere.value) await navigateTo({ path: to.value, query: words ? { q: words } : {} });
  else if (words === q.value) await ask();
  else await navigateTo({ path: route.path, query: { ...route.query, q: words || undefined } });
 }

 const root = ref(null);
 function turn(next) {
  page.value = next;
  ask();
  root.value?.scrollIntoView({ block: 'start', behavior: 'smooth' });
 }

 const results = computed(() => found.value?.results ?? []);
 const pages = computed(() => found.value?.pages ?? 1);
 const status = computed(() => {
  if (q.value.length < 2) return 'Type at least two letters.';
  if (pending.value) return 'Searching…';
  if (error.value) return error.value.statusCode === 429 ? 'Too many searches. Try again in a minute.' : "Couldn't search right now. Try again in a minute.";
  if (!results.value.length) return props.data.empty || 'Nothing matches. Try other words.';
  const total = found.value.total;
  return `${total} ${total === 1 ? 'result' : 'results'} for “${q.value}”`;
 });
</script>

<template>
 <section ref="root" class="tb-section tb-content-search">
  <div class="tb-wrap">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>

   <form class="tb-content-search__form" role="search" method="get" :action="elsewhere ? to : route.path" @submit.prevent="submit">
    <input
     :id="`${uid}-q`"
     v-model="typed"
     type="search"
     name="q"
     class="tb-content-search__input"
     :placeholder="data.placeholder || 'Search'"
     aria-label="Search this site"
     maxlength="100"
     autocomplete="off"
     enterkeyhint="search"
     :readonly="Boolean(canvas)"
     :tabindex="canvas ? -1 : undefined"
    />
    <button type="submit" class="tb-button tb-button--solid" :tabindex="canvas ? -1 : undefined">Search</button>
   </form>

   <p v-if="canvas" class="tb-content-search__status">{{ to ? `Searching goes to ${to}, where a Site search block shows what's found.` : 'Results show here, under the box, on the site.' }}</p>
   <template v-else-if="q">
    <p class="tb-content-search__status" role="status">{{ status }}</p>
    <ol v-if="results.length && !error" class="tb-content-search__results" role="list" :aria-busy="pending ? 'true' : undefined">
     <li v-for="result in results" :key="result.path" class="tb-content-search__result">
      <p class="tb-content-search__type">{{ result.type.singular }}</p>
      <h3 class="tb-content-search__title">
       <NuxtLink :to="result.path">{{ result.title }}</NuxtLink>
      </h3>
      <p v-if="result.snippet" class="tb-content-search__snippet">{{ result.snippet }}</p>
     </li>
    </ol>
    <nav v-if="pages > 1 && !error" class="tb-content-search__pages" aria-label="Pages of results">
     <button type="button" class="tb-button tb-button--outline" :disabled="page <= 1" @click="turn(page - 1)">Previous</button>
     <span>Page {{ page }} of {{ pages }}</span>
     <button type="button" class="tb-button tb-button--outline" :disabled="page >= pages" @click="turn(page + 1)">Next</button>
    </nav>
   </template>
  </div>
 </section>
</template>

<style>
 /* One column under the section's centered head. */
 .tb-content-search__form {
  display: flex;
  gap: 10px;
  max-width: 720px;
  margin-inline: auto;
 }

 .tb-content-search__input {
  flex: 1;
  min-width: 0;
  margin: 0;
  border: 1px solid color-mix(in srgb, var(--site-muted) 12%, var(--site-border));
  border-radius: var(--site-control-radius);
  padding: 11px 14px;
  background: var(--site-bg);
  font: inherit;
  font-size: 16px;
  line-height: 1.4;
  color: var(--site-heading);
 }

 .tb-content-search__input::placeholder {
  color: color-mix(in srgb, var(--site-muted) 78%, var(--site-bg));
  opacity: 1;
 }

 .tb-content-search__input:focus {
  border-color: var(--site-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--site-accent) 16%, transparent);
  outline: 0;
 }

 .tb-content-search__status {
  max-width: 720px;
  margin: 18px auto 0;
  font-size: 14.5px;
  color: var(--site-muted);
 }

 .tb-content-search__results {
  max-width: 720px;
  margin: 6px auto 0;
  padding: 0;
  list-style: none;
 }

 .tb-content-search__result {
  border-bottom: 1px solid var(--site-border);
  padding-block: 18px;
 }

 .tb-content-search__type {
  margin: 0 0 4px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--site-muted);
 }

 .tb-content-search__title {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: 20px;
  font-weight: var(--site-heading-weight);
  line-height: 1.25;
  color: var(--site-heading);
 }

 .tb-content-search__title a {
  color: inherit;
  text-decoration: none;
 }

 .tb-content-search__title a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
 }

 .tb-content-search__snippet {
  margin: 6px 0 0;
  font-size: 15px;
  line-height: 1.5;
  color: var(--site-body);
  overflow-wrap: anywhere;
 }

 .tb-content-search__pages {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  font-size: 14px;
  color: var(--site-muted);
 }

 .tb-content-search__pages button {
  cursor: pointer;
 }

 .tb-content-search__pages button:disabled {
  opacity: 0.4;
  cursor: default;
 }
</style>
