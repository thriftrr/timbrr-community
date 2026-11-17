<script setup>
 // A list of a grove's published saplings, asked of the studio through
 // the site's own /__timbrr/groves (kept a minute at the edge) by
 // useSaplings: on the server for a first visit, from the browser when a
 // visitor turns the page, loads more or picks a choice. Cards, a plain
 // list, a table, a grid of pictures, or a row that scrolls sideways; each
 // sapling links to its page when its grove has addresses.
 //
 // A visitor's picks for the list's choices are in the address as
 // ?<block id>.<ring>=value, so a narrowed list can be linked to.
 //
 // The studio's canvas never asks the site: the studio sends each list
 // itself (useTimbrrGroves), read with the editor's own access, so it's the
 // working copies drawn the way the site will draw them. Until one arrives
 // (or from a studio that sends none) it draws stand-ins in the chosen layout.
 const props = defineProps({ data: { type: Object, required: true } });
 const shows = useFieldShown();
 const canvas = useCanvas();
 const scope = useBlockScope();
 const route = useRoute();
 const router = useRouter();

 const source = computed(() => props.data.source ?? {});
 const choices = computed(() => (source.value.choices ?? []).filter((choice) => choice?.ring).slice(0, 3));
 const answerKey = (ring) => `${scope?.id ?? 'list'}.${ring}`;
 const answers = computed(() => (canvas ? {} : Object.fromEntries(choices.value.map((choice) => [choice.ring, String([route.query[answerKey(choice.ring)]].flat()[0] ?? '')]))));
 const page = ref(1);
 watch(answers, () => (page.value = 1), { deep: true });
 const { list, saplings: got, total, pages: allPages, facets, rings, standIn, pending, more, shown } = await useSaplings(source, { page, answers, meta: choices.value.length > 0 });

 const saplings = computed(() => (standIn.value ? Array.from({ length: Math.min(3, source.value.limit ?? 3) }, (_, index) => ({ id: index, title: `${source.value.grove || 'Sapling'} ${index + 1}`, rings: [] })) : got.value));
 const paging = computed(() => (props.data.paging === true ? 'pages' : props.data.paging === false ? 'none' : (props.data.paging ?? 'pages')));
 const pages = computed(() => (paging.value === 'pages' ? allPages.value : 1));
 const canMore = computed(() => paging.value === 'more' && !canvas && shown.value < total.value);
 const root = ref(null);
 function turn(to) {
  if (canvas) return; // the canvas shows the first page
  page.value = to;
  root.value?.scrollIntoView({ block: 'start', behavior: 'smooth' });
 }
 function answer(ring, value) {
  if (canvas) return;
  router.replace({ query: { ...route.query, [answerKey(ring)]: value || undefined } });
 }
 const ringLabel = (ring) => rings.value.find((one) => one.key === ring)?.label ?? ring;
 const counted = computed(() => {
  const grove = list.value?.grove;
  if (!grove) return '';
  return `${total.value} ${(total.value === 1 ? grove.singular : grove.name).toLowerCase()}`;
 });

 const picture = (sapling) => sapling.rings.find((ring) => ring.kind === 'image');
 const rest = (sapling) => sapling.rings.filter((ring) => ring.kind !== 'image');
 const columns = computed(() => {
  const seen = new Map();
  for (const sapling of saplings.value) for (const ring of rest(sapling)) seen.set(ring.key, ring.label);
  return [...seen].map(([key, label]) => ({ key, label }));
 });
 const pictured = computed(() => ['cards', 'grid', 'carousel'].includes(props.data.layout));
 const featured = computed(() => props.data.featured === true && props.data.layout !== 'table' && saplings.value.length > 1);

 // The row that scrolls sideways: its arrows move it by about a card.
 const track = ref(null);
 const slide = (by) => track.value?.scrollBy({ left: by * (track.value.clientWidth * 0.8), behavior: 'smooth' });
</script>

<template>
 <section ref="root" class="tb-section tb-grove-list" :aria-busy="pending ? 'true' : undefined">
  <div class="tb-wrap">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>

   <div v-if="choices.length && source.grove" class="tb-grove-list__choices">
    <div v-for="choice in choices" :key="choice.ring" class="tb-grove-list__choice" role="group" :aria-label="ringLabel(choice.ring)">
     <label v-if="choice.ui !== 'buttons'" class="tb-grove-list__pick">
      <span>{{ ringLabel(choice.ring) }}</span>
      <select :value="answers[choice.ring] ?? ''" :tabindex="canvas ? -1 : undefined" @change="answer(choice.ring, $event.target.value)">
       <option value="">All</option>
       <option v-for="one in facets[choice.ring] ?? []" :key="one.value" :value="one.value">{{ one.label }} ({{ one.count }})</option>
      </select>
     </label>
     <template v-else>
      <span class="tb-grove-list__pick-name">{{ ringLabel(choice.ring) }}</span>
      <div class="tb-grove-list__buttons">
       <button type="button" class="tb-chip" :aria-pressed="!answers[choice.ring] ? 'true' : 'false'" :tabindex="canvas ? -1 : undefined" @click="answer(choice.ring, '')">All</button>
       <button v-for="one in facets[choice.ring] ?? []" :key="one.value" type="button" class="tb-chip" :aria-pressed="answers[choice.ring] === one.value ? 'true' : 'false'" :tabindex="canvas ? -1 : undefined" @click="answer(choice.ring, one.value)">
        {{ one.label }} <span class="tb-grove-list__n">{{ one.count }}</span>
       </button>
      </div>
     </template>
    </div>
   </div>

   <p v-if="data.count && counted && !standIn" class="tb-grove-list__count" aria-live="polite">{{ counted }}</p>

   <p v-if="canvas && !source.grove" class="tb-grove-list__empty">Pick a grove for this list in the panel on the right.</p>
   <div v-else-if="!saplings.length" class="tb-grove-list__none">
    <p class="tb-grove-list__empty">{{ data.empty || 'Nothing here yet.' }}</p>
    <NuxtLink v-if="data.empty_label && safeHref(data.empty_to)" :to="safeHref(data.empty_to)" class="tb-button tb-button--outline">{{ data.empty_label }}</NuxtLink>
   </div>

   <div v-else-if="data.layout === 'table'" class="tb-grove-list__scroll">
    <table class="tb-grove-list__table">
     <thead>
      <tr>
       <th scope="col">{{ list?.grove?.singular ?? 'Name' }}</th>
       <th v-for="column in columns" :key="column.key" scope="col">{{ column.label }}</th>
      </tr>
     </thead>
     <tbody>
      <tr v-for="sapling in saplings" :key="sapling.id">
       <th scope="row">
        <NuxtLink v-if="sapling.path" :to="sapling.path">{{ sapling.title }}</NuxtLink>
        <template v-else>{{ sapling.title }}</template>
       </th>
       <td v-for="column in columns" :key="column.key">
        <TbRingValue v-if="sapling.rings.find((ring) => ring.key === column.key)" :ring="sapling.rings.find((ring) => ring.key === column.key)" :sapling="sapling" :grove="list?.grove" brief />
       </td>
      </tr>
     </tbody>
    </table>
   </div>

   <div v-else :class="{ 'tb-grove-list__carousel': data.layout === 'carousel' }">
    <ul
     ref="track"
     class="tb-grove-list__items"
     :class="[`tb-grove-list__items--${data.layout === 'list' ? 'list' : data.layout}`, ['cards', 'grid'].includes(data.layout) ? `tb-grove-list__items--${data.columns}` : '', featured ? 'tb-grove-list__items--featured' : '']"
     role="list"
    >
     <li
      v-for="(sapling, index) in saplings"
      :key="sapling.id"
      class="tb-grove-list__item"
      :class="{ 'tb-card': ['cards', 'carousel'].includes(data.layout), 'tb-grove-list__item--link': sapling.path, 'tb-grove-list__item--featured': featured && index === 0 }"
     >
      <TbImage v-if="pictured && picture(sapling)" :image="picture(sapling).value" :ratio="data.layout === 'grid' ? '1 / 1' : '3 / 2'" sizes="(min-width: 720px) 400px, 100vw" class="tb-grove-list__image" />
      <div v-else-if="data.layout === 'grid'" class="tb-grove-list__image tb-grove-list__image--none" aria-hidden="true" />
      <div class="tb-grove-list__words">
       <h3 class="tb-grove-list__title">
        <NuxtLink v-if="sapling.path" :to="sapling.path">{{ sapling.title }}</NuxtLink>
        <template v-else>{{ sapling.title }}</template>
       </h3>
       <dl v-if="data.layout !== 'grid' && rest(sapling).length" class="tb-grove-list__facts">
        <div v-for="ring in rest(sapling)" :key="ring.key">
         <dt>{{ ring.label }}</dt>
         <dd><TbRingValue :ring="ring" :sapling="sapling" :grove="list?.grove" brief /></dd>
        </div>
       </dl>
      </div>
     </li>
    </ul>
    <div v-if="data.layout === 'carousel'" class="tb-grove-list__arrows">
     <button type="button" class="tb-button tb-button--outline" aria-label="Back" :tabindex="canvas ? -1 : undefined" @click="slide(-1)">←</button>
     <button type="button" class="tb-button tb-button--outline" aria-label="Forward" :tabindex="canvas ? -1 : undefined" @click="slide(1)">→</button>
    </div>
   </div>

   <nav v-if="pages > 1" class="tb-grove-list__pages" aria-label="Pages of this list">
    <button type="button" class="tb-button tb-button--outline" :disabled="page <= 1" @click="turn(page - 1)">Previous</button>
    <span aria-live="polite">Page {{ page }} of {{ pages }}</span>
    <button type="button" class="tb-button tb-button--outline" :disabled="page >= pages" @click="turn(page + 1)">Next</button>
   </nav>
   <div v-if="canMore" class="tb-grove-list__pages">
    <button type="button" class="tb-button tb-button--outline" :disabled="pending" @click="more">{{ pending ? 'Loading…' : 'Load more' }}</button>
   </div>
  </div>
 </section>
</template>

<style>
 .tb-grove-list__empty {
  margin: 0;
  color: var(--site-muted);
 }

 .tb-grove-list__none {
  display: grid;
  justify-items: start;
  gap: 14px;
 }

 .tb-grove-list__count {
  margin: 0 0 14px;
  font-size: 14px;
  color: var(--site-muted);
 }

 .tb-grove-list__choices {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-bottom: 20px;
 }

 .tb-grove-list__pick {
  display: grid;
  gap: 4px;
  font-size: 13px;
  color: var(--site-muted);
 }

 .tb-grove-list__pick select {
  min-height: 40px;
  border: 1px solid var(--site-border);
  border-radius: var(--site-control-radius);
  padding: 8px 10px;
  background: var(--site-bg);
  font: inherit;
  font-size: 15px;
  color: var(--site-heading);
 }

 .tb-grove-list__pick-name {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--site-muted);
 }

 .tb-grove-list__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
 }

 .tb-grove-list__buttons .tb-chip {
  min-height: 36px;
  border: 1px solid var(--site-border);
  border-radius: 999px;
  padding: 6px 14px;
  background: var(--site-bg);
  font: inherit;
  font-size: 14px;
  color: var(--site-heading);
  cursor: pointer;
 }

 .tb-grove-list__buttons .tb-chip[aria-pressed='true'] {
  border-color: var(--site-accent);
  background: var(--site-accent);
  color: var(--site-on-accent, #fff);
 }

 .tb-grove-list__n {
  opacity: 0.7;
  font-size: 12.5px;
 }

 .tb-grove-list__items {
  display: grid;
  gap: 20px;
  margin: 0;
  padding: 0;
  list-style: none;
 }

 @media (min-width: 720px) {
  .tb-grove-list__items--grid.tb-grove-list__items--3 {
   grid-template-columns: repeat(3, 1fr);
  }

  .tb-grove-list__items--2 {
   grid-template-columns: repeat(2, 1fr);
  }

  .tb-grove-list__items--3,
  .tb-grove-list__items--4 {
   grid-template-columns: repeat(2, 1fr);
  }
 }

 @media (min-width: 1000px) {
  .tb-grove-list__items--3 {
   grid-template-columns: repeat(3, 1fr);
  }

  .tb-grove-list__items--4 {
   grid-template-columns: repeat(4, 1fr);
  }
 }

 .tb-grove-list__items--list {
  gap: 0;
 }

 /* A grid of pictures: square, the title under each. */
 .tb-grove-list__items--grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
 }

 .tb-grove-list__items--grid .tb-grove-list__image {
  width: 100%;
  margin: 0 0 8px;
  border-radius: var(--site-radius);
 }

 /* A sapling with no picture keeps its square in the grid. */
 .tb-grove-list__image--none {
  aspect-ratio: 1 / 1;
  background: color-mix(in srgb, var(--site-accent) 8%, var(--site-surface));
 }

 .tb-grove-list__items--grid .tb-grove-list__title {
  font-size: 16px;
 }

 /* The first, large: across the whole row on a wide screen. */
 @media (min-width: 720px) {
  .tb-grove-list__items--featured .tb-grove-list__item--featured {
   grid-column: 1 / -1;
  }

  .tb-grove-list__items--cards .tb-grove-list__item--featured,
  .tb-grove-list__items--grid .tb-grove-list__item--featured {
   display: grid;
   grid-template-columns: 3fr 2fr;
   align-items: center;
   gap: 28px;
  }

  .tb-grove-list__items--featured .tb-grove-list__item--featured .tb-grove-list__image {
   width: auto;
   margin: 0;
  }

  .tb-grove-list__items--cards .tb-grove-list__item--featured .tb-grove-list__image {
   margin: -22px 0 -22px -22px;
   border-radius: var(--site-radius) 0 0 var(--site-radius);
  }
 }

 .tb-grove-list__item--featured .tb-grove-list__title {
  font-size: 26px;
 }

 /* A row that scrolls sideways, card by card. */
 .tb-grove-list__items--carousel {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 2px;
  padding: 2px 2px 12px;
  scrollbar-width: thin;
 }

 .tb-grove-list__items--carousel > .tb-grove-list__item {
  flex: 0 0 min(80%, 320px);
  scroll-snap-align: start;
 }

 .tb-grove-list__items--carousel > .tb-grove-list__item--featured {
  flex-basis: min(90%, 560px);
 }

 .tb-grove-list__arrows {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
 }

 .tb-grove-list__arrows button {
  min-width: 44px;
  cursor: pointer;
 }

 .tb-grove-list__items--list .tb-grove-list__item {
  border-bottom: 1px solid var(--site-border);
  padding-block: 18px;
 }

 /* The title's link covers its card or row. */
 .tb-grove-list__item {
  position: relative;
 }

 .tb-grove-list__item--link .tb-grove-list__title a::after {
  content: '';
  position: absolute;
  inset: 0;
 }

 .tb-grove-list__item .tb-ring-value__link {
  position: relative;
  z-index: 1;
 }

 /* Out to the card's edges: a picture is as wide as its box says, so the
    negative margins alone would leave it short on the right. */
 .tb-grove-list__image {
  width: calc(100% + 44px);
  max-width: none;
  margin: -22px -22px 18px;
  border-radius: var(--site-radius) var(--site-radius) 0 0;
  overflow: hidden;
 }

 .tb-grove-list__title {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: 20px;
  font-weight: var(--site-heading-weight);
  line-height: 1.25;
  color: var(--site-heading);
 }

 .tb-grove-list__title a {
  color: inherit;
  text-decoration: none;
 }

 .tb-grove-list__title a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
 }

 .tb-grove-list__facts {
  display: grid;
  gap: 4px;
  margin: 10px 0 0;
  font-size: 14.5px;
  color: var(--site-body);
 }

 .tb-grove-list__facts > div {
  display: flex;
  gap: 8px;
 }

 .tb-grove-list__facts dt {
  flex: none;
  color: var(--site-muted);
 }

 .tb-grove-list__facts dt::after {
  content: ':';
 }

 .tb-grove-list__facts dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
 }

 .tb-grove-list__scroll {
  overflow-x: auto;
 }

 .tb-grove-list__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
 }

 .tb-grove-list__table th,
 .tb-grove-list__table td {
  border-bottom: 1px solid var(--site-border);
  padding: 12px 14px 12px 0;
  text-align: left;
  vertical-align: top;
 }

 .tb-grove-list__table thead th {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--site-muted);
 }

 .tb-grove-list__table a {
  color: var(--site-accent);
 }

 .tb-grove-list__pages {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 28px;
  font-size: 14px;
  color: var(--site-muted);
 }

 .tb-grove-list__pages button {
  cursor: pointer;
 }

 .tb-grove-list__pages button:disabled {
  opacity: 0.4;
  cursor: default;
 }
</style>
