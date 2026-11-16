<script setup>
 // A list of a content type's published entries, asked of the studio
 // through the site's own /__timbrr/content (kept a minute at the edge):
 // on the server for a first visit, from the browser when a visitor turns
 // the page. Cards, a plain list or a table; each entry links to its page
 // when its type has an address.
 //
 // The studio's canvas never asks the site: the studio sends each list
 // itself, by the block's id (useTimbrrContent), read with the editor's own
 // access, so it's the working copies drawn the way the site will draw
 // them. Until one arrives (or from a studio that sends none) it draws
 // stand-ins in the chosen layout.
 const props = defineProps({ data: { type: Object, required: true } });
 const shows = useFieldShown();
 const canvas = useCanvas();
 const scope = inject(BLOCK_KEY, null);
 const sent = useTimbrrContent(); // null anywhere but the canvas page
 // undefined: not sent (yet); null: the studio looked and there's no such type.
 const fromStudio = computed(() => sent.value?.lists?.[scope?.id]);
 const standIn = computed(() => Boolean(sent.value || canvas) && fromStudio.value === undefined);

 const source = computed(() => props.data.source ?? {});
 const page = ref(1);
 const query = computed(() => ({
  type: source.value.type,
  sort: source.value.sort,
  dir: source.value.dir,
  limit: source.value.limit,
  ...(source.value.filter ? { ff: source.value.filter.field, fo: source.value.filter.op, fv: source.value.filter.value } : {}),
  ...(source.value.show?.length ? { show: source.value.show.join(',') } : {}),
  // A term's own page, and "what points at the entry this page shows": the studio sets both.
  ...(source.value.term ? { tx: source.value.term.taxonomy, tm: source.value.term.term } : {}),
  ...(source.value.related ? { rel: source.value.relatedTo || '-' } : {}),
  p: page.value,
 }));
 const { data: fetched, pending } = await useFetch('/__timbrr/content', {
  key: `tb-content-${scope?.id ?? source.value.type}`,
  query,
  immediate: Boolean(source.value.type) && !sent.value && !canvas,
  watch: sent.value || canvas ? false : undefined,
  default: () => null,
 });
 const list = computed(() => (sent.value || canvas ? (fromStudio.value ?? null) : fetched.value));
 const entries = computed(() => (standIn.value ? Array.from({ length: Math.min(3, source.value.limit ?? 3) }, (_, index) => ({ id: index, title: `${source.value.type || 'Entry'} ${index + 1}`, fields: [] })) : (list.value?.entries ?? [])));
 const pages = computed(() => (props.data.paging ? (list.value?.pages ?? 1) : 1));
 const root = ref(null);
 function turn(to) {
  if (sent.value) return; // the canvas shows the first page
  page.value = to;
  root.value?.scrollIntoView({ block: 'start', behavior: 'smooth' });
 }
 const picture = (entry) => entry.fields.find((field) => field.kind === 'image');
 const rest = (entry) => entry.fields.filter((field) => field.kind !== 'image');
 const columns = computed(() => {
  const seen = new Map();
  for (const entry of entries.value) for (const field of rest(entry)) seen.set(field.key, field.label);
  return [...seen].map(([key, label]) => ({ key, label }));
 });
</script>

<template>
 <section ref="root" class="tb-section tb-content-list" :aria-busy="pending ? 'true' : undefined">
  <div class="tb-wrap">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>

   <p v-if="canvas && !source.type" class="tb-content-list__empty">Pick a content type for this list in the panel on the right.</p>
   <p v-else-if="!entries.length" class="tb-content-list__empty">{{ data.empty || 'Nothing here yet.' }}</p>

   <div v-else-if="data.layout === 'table'" class="tb-content-list__scroll">
    <table class="tb-content-list__table">
     <thead>
      <tr>
       <th scope="col">{{ list?.type?.singular ?? 'Name' }}</th>
       <th v-for="column in columns" :key="column.key" scope="col">{{ column.label }}</th>
      </tr>
     </thead>
     <tbody>
      <tr v-for="entry in entries" :key="entry.id">
       <th scope="row">
        <NuxtLink v-if="entry.path" :to="entry.path">{{ entry.title }}</NuxtLink>
        <template v-else>{{ entry.title }}</template>
       </th>
       <td v-for="column in columns" :key="column.key">
        <TbContentValue v-if="entry.fields.find((field) => field.key === column.key)" :field="entry.fields.find((field) => field.key === column.key)" brief />
       </td>
      </tr>
     </tbody>
    </table>
   </div>

   <ul v-else class="tb-content-list__items" :class="data.layout === 'cards' ? `tb-content-list__items--cards tb-content-list__items--${data.columns}` : 'tb-content-list__items--list'" role="list">
    <li v-for="entry in entries" :key="entry.id" class="tb-content-list__item" :class="{ 'tb-card': data.layout === 'cards', 'tb-content-list__item--link': entry.path }">
     <TbImage v-if="data.layout === 'cards' && picture(entry)" :image="picture(entry).value" ratio="3 / 2" sizes="(min-width: 720px) 400px, 100vw" class="tb-content-list__image" />
     <div class="tb-content-list__words">
      <h3 class="tb-content-list__title">
       <NuxtLink v-if="entry.path" :to="entry.path">{{ entry.title }}</NuxtLink>
       <template v-else>{{ entry.title }}</template>
      </h3>
      <dl v-if="rest(entry).length" class="tb-content-list__facts">
       <div v-for="field in rest(entry)" :key="field.key">
        <dt>{{ field.label }}</dt>
        <dd><TbContentValue :field="field" brief /></dd>
       </div>
      </dl>
     </div>
    </li>
   </ul>

   <nav v-if="pages > 1" class="tb-content-list__pages" aria-label="Pages of this list">
    <button type="button" class="tb-button tb-button--outline" :disabled="page <= 1" @click="turn(page - 1)">Newer</button>
    <span aria-live="polite">Page {{ page }} of {{ pages }}</span>
    <button type="button" class="tb-button tb-button--outline" :disabled="page >= pages" @click="turn(page + 1)">Older</button>
   </nav>
  </div>
 </section>
</template>

<style>
 .tb-content-list__empty {
  margin: 0;
  color: var(--site-muted);
 }

 .tb-content-list__items {
  display: grid;
  gap: 20px;
  margin: 0;
  padding: 0;
  list-style: none;
 }

 @media (min-width: 720px) {
  .tb-content-list__items--2 {
   grid-template-columns: repeat(2, 1fr);
  }

  .tb-content-list__items--3,
  .tb-content-list__items--4 {
   grid-template-columns: repeat(2, 1fr);
  }
 }

 @media (min-width: 1000px) {
  .tb-content-list__items--3 {
   grid-template-columns: repeat(3, 1fr);
  }

  .tb-content-list__items--4 {
   grid-template-columns: repeat(4, 1fr);
  }
 }

 .tb-content-list__items--list {
  gap: 0;
 }

 .tb-content-list__items--list .tb-content-list__item {
  border-bottom: 1px solid var(--site-border);
  padding-block: 18px;
 }

 /* The title's link covers its card or row. */
 .tb-content-list__item {
  position: relative;
 }

 .tb-content-list__item--link .tb-content-list__title a::after {
  content: '';
  position: absolute;
  inset: 0;
 }

 .tb-content-list__item .tb-content-value__link {
  position: relative;
  z-index: 1;
 }

 /* Out to the card's edges: a picture is as wide as its box says, so the
    negative margins alone would leave it short on the right. */
 .tb-content-list__image {
  width: calc(100% + 44px);
  max-width: none;
  margin: -22px -22px 18px;
  border-radius: var(--site-radius) var(--site-radius) 0 0;
  overflow: hidden;
 }

 .tb-content-list__title {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: 20px;
  font-weight: var(--site-heading-weight);
  line-height: 1.25;
  color: var(--site-heading);
 }

 .tb-content-list__title a {
  color: inherit;
  text-decoration: none;
 }

 .tb-content-list__title a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
 }

 .tb-content-list__facts {
  display: grid;
  gap: 4px;
  margin: 10px 0 0;
  font-size: 14.5px;
  color: var(--site-body);
 }

 .tb-content-list__facts > div {
  display: flex;
  gap: 8px;
 }

 .tb-content-list__facts dt {
  flex: none;
  color: var(--site-muted);
 }

 .tb-content-list__facts dt::after {
  content: ':';
 }

 .tb-content-list__facts dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
 }

 .tb-content-list__scroll {
  overflow-x: auto;
 }

 .tb-content-list__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
 }

 .tb-content-list__table th,
 .tb-content-list__table td {
  border-bottom: 1px solid var(--site-border);
  padding: 12px 14px 12px 0;
  text-align: left;
  vertical-align: top;
 }

 .tb-content-list__table thead th {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--site-muted);
 }

 .tb-content-list__table a {
  color: var(--site-accent);
 }

 .tb-content-list__pages {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 28px;
  font-size: 14px;
  color: var(--site-muted);
 }

 .tb-content-list__pages button {
  cursor: pointer;
 }

 .tb-content-list__pages button:disabled {
  opacity: 0.4;
  cursor: default;
 }
</style>
