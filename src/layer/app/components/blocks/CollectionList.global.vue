<script setup>
 // A list of a collection's published entries, asked of the studio through
 // the site's own /__timbrr/collections (kept a minute at the edge) by
 // useEntries: on the server for a first visit, from the browser when a
 // visitor turns the page, loads more or picks a choice. Cards, a plain
 // list, a table, a grid of pictures, or a row that scrolls sideways; each
 // entry links to its page when its collection has addresses.
 //
 // Rows and People (docs/README.md § Collections) draw each entry from fields the
 // owner names. Rows add the visitor's controls (TbListFilters), month
 // headings, a closing line and, when nothing is left, what to loosen.
 //
 // A visitor's picks for the list's choices are in the address as
 // ?<block id>.<field>=value (several as a|b), the month as ?<block id>._month=2027-01
 // and the order as ?<block id>._sort=price, so a narrowed list can be linked to.
 //
 // The studio's canvas never asks the site: the studio sends each list
 // itself (useTimbrrCollections), read with the editor's own access, so it's the
 // working copies drawn the way the site will draw them. Until one arrives
 // (or from a studio that sends none) it draws stand-ins in the chosen layout.
 const props = defineProps({ data: { type: Object, required: true } });
 const shows = useFieldShown();
 const canvas = useCanvas();
 const scope = useBlockScope();
 const route = useRoute();
 const router = useRouter();

 const source = computed(() => props.data.source ?? {});
 const choices = computed(() => (source.value.choices ?? []).filter((choice) => choice?.field).slice(0, 3));
 const base = scope?.id ?? 'list';
 const answerKey = (field) => `${base}.${field}`;
 const asked = (name) => (canvas ? '' : String([route.query[answerKey(name)]].flat()[0] ?? ''));
 const answers = computed(() => (canvas ? {} : Object.fromEntries(choices.value.map((choice) => [choice.field, asked(choice.field)]))));
 const rowish = computed(() => ['rows', 'person'].includes(props.data.layout));
 const rows = computed(() => props.data.layout === 'rows');
 // Rows and People need the collection's fields by name before they can say which to ask for.
 const wantsRows = ['rows', 'person'].includes(props.data.layout) && !canvas;
 const meta = wantsRows && source.value.collection ? await useCollection(computed(() => source.value.collection)) : null;
 const keys0 = computed(() => rowKeys(props.data, meta?.fields.value ?? []));
 const sortPicks = computed(() => (rows.value && props.data.row_sort ? sortOptions(keys0.value, meta?.fields.value ?? []) : []));
 const askSort = computed(() => sortPicks.value.find((one) => one.value === asked('_sort')));
 const askMonth = computed(() => (rows.value && props.data.row_month && /^\d{4}-\d{2}$/.test(asked('_month')) ? asked('_month') : ''));
 const dateRange = (key, field) => {
  const range = monthRange(key);
  return [{ field, op: 'gte', value: range.from }, { field, op: 'lte', value: range.to }];
 };
 // What's asked of the studio: the block's own, with the fields a row draws, the order a visitor picked and the month.
 const listSource = computed(() => {
  const out = { ...source.value };
  if (rowish.value) out.show = [...new Set([...(out.show ?? []), ...neededKeys(keys0.value)])].slice(0, 12);
  if (askSort.value) Object.assign(out, { sort: askSort.value.sort, dir: askSort.value.dir });
  if (askMonth.value && keys0.value.date) out.filters = [...(out.filters ?? []), ...dateRange(askMonth.value, keys0.value.date)];
  return out;
 });
 const page = ref(1);
 watch([answers, askMonth, askSort], () => (page.value = 1), { deep: true });
 const { list, entries: got, total, pages: allPages, facets, fields, standIn, pending, more, shown } = await useEntries(listSource, { page, answers, meta: choices.value.length > 0 });
 // The choices' answers and the months, counted without the visitor's own picks so the options stay whole
 // (a month that a pick leaves empty is still there to be told so).
 const optionsSource = computed(() => ({ ...source.value, limit: 1, show: [] }));
 const options = wantsRows && source.value.collection && choices.value.length ? await useEntries(optionsSource, { field: 'options' }) : null;
 const monthsSource = computed(() => ({ ...source.value, limit: 1, show: [], choices: [{ field: keys0.value.date, ui: 'select' }] }));
 const monthList = wantsRows && source.value.collection && props.data.row_month && keys0.value.date ? await useEntries(monthsSource, { field: 'months' }) : null;

 const entries = computed(() => (standIn.value ? Array.from({ length: Math.min(3, source.value.limit ?? 3) }, (_, index) => ({ id: index, title: `${source.value.collection || 'Entry'} ${index + 1}`, fields: [] })) : got.value));
 const paging = computed(() => (props.data.paging === true ? 'pages' : props.data.paging === false ? 'none' : (props.data.paging ?? 'pages')));
 const pages = computed(() => (paging.value === 'pages' ? allPages.value : 1));
 const canMore = computed(() => paging.value === 'more' && !canvas && shown.value < total.value);
 const root = ref(null);
 function turn(to) {
  if (canvas) return; // the canvas shows the first page
  page.value = to;
  root.value?.scrollIntoView({ block: 'start', behavior: 'smooth' });
 }
 // What the address keeps for this list: the picks, as one change at a time or all of them.
 function setPicks(patch) {
  if (canvas) return;
  const query = { ...route.query };
  for (const [name, value] of Object.entries(patch)) query[answerKey(name)] = value || undefined;
  router.replace({ query });
 }
 const answer = (field, value) => setPicks({ [field]: value });
 // The page's address with a pick changed, for the links that work without scripts.
 const ours = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.`);
 function hrefFor(patch) {
  const query = { ...route.query };
  if (patch.clear) for (const name of Object.keys(query)) if (ours.test(name) && !name.endsWith('._sort')) delete query[name];
  for (const [name, value] of Object.entries(patch)) if (name !== 'clear') query[answerKey(name)] = value || undefined;
  return { path: route.path, query };
 }
 const hidden = computed(() => Object.fromEntries(Object.entries(route.query).filter(([name, value]) => !ours.test(name) && typeof value === 'string')));
 const fieldLabel = (field) => fields.value.find((one) => one.key === field)?.label ?? field;
 const noun = computed(() => String(list.value?.collection?.name ?? source.value.collection ?? 'entries').toLowerCase());
 const singular = computed(() => String(list.value?.collection?.singular ?? 'entry').toLowerCase());
 // A list that holds to a value of its own (a value's page) names it in what it says: "No Beginner Bread classes".
 const about = computed(() => String(props.data.row_about ?? '').trim().replace(/^\{.*\}$/, ''));
 const phrase = computed(() => [about.value, noun.value].filter(Boolean).join(' '));
 const phraseOne = computed(() => [about.value, singular.value].filter(Boolean).join(' '));
 const counted = computed(() => {
  const collection = list.value?.collection;
  if (!collection) return '';
  return `${total.value} ${(total.value === 1 ? collection.singular : collection.name).toLowerCase()}`;
 });

 const picture = (entry) => entry.fields.find((field) => field.kind === 'image');
 const rest = (entry) => entry.fields.filter((field) => field.kind !== 'image');
 const columns = computed(() => {
  const seen = new Map();
  for (const entry of entries.value) for (const field of rest(entry)) seen.set(field.key, field.label);
  return [...seen].map(([key, label]) => ({ key, label }));
 });
 const pictured = computed(() => ['cards', 'grid', 'carousel'].includes(props.data.layout));
 const featured = computed(() => props.data.featured === true && props.data.layout !== 'table' && entries.value.length > 1);

 // The row that scrolls sideways: its arrows move it by about a card.
 const track = ref(null);
 const slide = (by) => track.value?.scrollBy({ left: by * (track.value.clientWidth * 0.8), behavior: 'smooth' });

 // ── Rows and People ──
 // What the entries carry, when the collection's own list of fields hasn't come (the canvas).
 const known = computed(() => {
  if (meta?.fields.value.length) return meta.fields.value;
  if (fields.value.length) return fields.value;
  const seen = new Map();
  for (const entry of entries.value) for (const field of entry.fields) seen.set(field.key, { key: field.key, label: field.label, kind: field.kind });
  return [...seen.values()];
 });
 const keys = computed(() => rowKeys(props.data, known.value));
 const entryDate = (entry) => entry.fields.find((field) => field.key === keys.value.date)?.value;
 // Month headings when the list runs in date order: a heading wherever the month changes.
 const groups = computed(() => {
  const dated = rows.value && props.data.row_group && keys.value.date && (listSource.value.sort === keys.value.date || canvas);
  if (!dated) return [{ heading: '', entries: entries.value }];
  const out = [];
  const months = entries.value.map((entry) => monthOf(entryDate(entry)));
  const labels = monthLabels([...new Set(months.filter(Boolean))]);
  entries.value.forEach((entry, index) => {
   const key = months[index];
   if (!out.length || out.at(-1).key !== key) out.push({ key, heading: labels[key] ?? '', entries: [] });
   out.at(-1).entries.push(entry);
  });
  return out;
 });
 const optionList = (field) => (options ? options.facets.value[field] : facets.value[field]) ?? [];
 const optionLabel = (field, value) => optionList(field).find((one) => one.value === value)?.label ?? value;
 const choiceRows = computed(() =>
  choices.value.map((choice) => ({
   field: choice.field,
   ui: choice.ui,
   name: fieldLabel(choice.field),
   options: optionList(choice.field),
   answer: answers.value[choice.field] ?? '',
  })),
 );
 const monthOptions = computed(() => {
  if (monthList) return facetMonths(monthList.facets.value[keys0.value.date]);
  return facetMonths(entries.value.map((entry) => ({ value: entryDate(entry), count: 1 })));
 });
 const monthName = computed(() => monthOptions.value.find((one) => one.value === askMonth.value)?.label ?? '');
 // The sort menu's pick: what's asked, else the option that is the block's own order.
 const sortValue = computed(() => askSort.value?.value ?? sortPicks.value.find((one) => one.sort === source.value.sort && one.dir === source.value.dir)?.value ?? sortPicks.value[0]?.value ?? '');
 const sortChoices = computed(() => {
  const own = sortPicks.value.some((one) => one.sort === source.value.sort && one.dir === source.value.dir);
  return own || !sortPicks.value.length ? sortPicks.value : [{ value: '', label: 'As listed' }, ...sortPicks.value];
 });
 const active = computed(() => [
  ...choiceRows.value.filter((choice) => choice.answer).map((choice) => ({ kind: 'choice', field: choice.field, ui: choice.ui, name: choice.name, raw: choice.answer, answer: choice.answer.split('|').map((value) => optionLabel(choice.field, value)) })),
  ...(askMonth.value ? [{ kind: 'month', raw: askMonth.value, answer: [monthName.value || askMonth.value] }] : []),
 ]);
 const narrowed = computed(() => active.value.length > 0);
 const countedLong = computed(() => {
  const labels = active.value.filter((one) => one.kind === 'choice').flatMap((one) => one.answer);
  return counted.value && labels.length ? counted.value.replace(/ /, ` ${labels.join(', ')} `) : counted.value;
 });
 const summary = computed(() => {
  const labels = active.value.flatMap((one) => one.answer);
  return labels.length > 2 ? `${labels[0]} +${labels.length - 1}` : labels.join(', ');
 });
 // How many a pick would show, or one entry of it, from the site.
 async function peek({ answers: picked = {}, month = '', soonest = false, limit = 1 } = {}) {
  const out = { ...listSource.value, limit };
  out.filters = [...(source.value.filters ?? [])];
  if (month && keys.value.date) out.filters.push(...dateRange(month, keys.value.date));
  if (soonest && keys.value.date) {
   out.filters.push({ field: keys.value.date, op: 'gte', value: 'today' });
   Object.assign(out, { sort: keys.value.date, dir: 'asc' });
  }
  try {
   return await $fetch('/__timbrr/collections', { query: collectionQuery(out, { answers: picked }) });
  } catch {
   return null;
  }
 }
 // An empty list says what was asked, what there is instead and how to loosen it.
 const { data: loose } = useAsyncData(
  `tb-loosen-${base}`,
  async () => {
   if (canvas || !rows.value || entries.value.length || !active.value.length || pending.value) return null;
   const now = active.value;
   const keep = now.find((one) => one.kind === 'choice' && one.ui === 'buttons');
   const ask = (without) => ({ answers: Object.fromEntries(now.filter((one) => one.kind === 'choice' && !without.includes(one)).map((one) => [one.field, one.raw])), month: now.find((one) => one.kind === 'month' && !without.includes(one))?.raw ?? '' });
   const order = [...now.filter((one) => one.kind === 'choice' && one !== keep), ...now.filter((one) => one.kind === 'month'), ...(keep ? [keep] : [])];
   const plans = [];
   if (keep && now.length > 2) plans.push({ without: now.filter((one) => one !== keep), label: `See all ${askedWords([keep], phrase.value)}` });
   if (!keep && about.value && now.length > 1) plans.push({ without: now, label: `See all ${phrase.value}` });
   for (const one of order) if (now.length > 1 || !keep) plans.push({ without: [one], one, label: dropWords(now, one, phrase.value) });
   const seen = new Set();
   const found = [];
   for (const plan of plans) {
    const query = ask(plan.without);
    const signature = JSON.stringify(query);
    if (seen.has(signature)) continue;
    seen.add(signature);
    const got = await peek(query);
    if (got?.total > 0) found.push({ ...plan, query, total: got.total });
   }
   const instead = found.find((one) => one.one);
   const month = now.find((one) => one.kind === 'month');
   const next = month ? (await peek({ ...ask([month]), soonest: true }))?.entries?.[0] ?? null : null;
   return {
    instead: instead ? insteadWords(now, instead.one, instead.total, phrase.value, phraseOne.value) : '',
    buttons: found.map((one) => ({ label: one.label, to: hrefFor({ ...Object.fromEntries(choices.value.map((choice) => [choice.field, one.query.answers[choice.field] ?? ''])), _month: one.query.month }) })),
    next,
    nextTitle: `The next ${askedWords(now.filter((one) => one.kind === 'choice'), phraseOne.value)}`,
   };
  },
  { watch: [got, active], default: () => null },
 );
 const endWords = computed(() => {
  if (!rows.value || !props.data.ending || canvas || pending.value || !entries.value.length || canMore.value || pages.value > 1) return null;
  const labels = active.value.filter((one) => one.kind === 'choice').flatMap((one) => one.answer);
  if (!active.value.length && props.data.ending_text) return { words: props.data.ending_text, label: props.data.ending_label, to: safeHref(props.data.ending_to) };
  const words = `That’s every ${[...labels, singular.value].join(' ')} for now.`;
  return active.value.length ? { words, label: `See all ${noun.value}`, to: hrefFor({ clear: true }) } : { words: `That’s every ${singular.value} for now.`, label: props.data.ending_label, to: safeHref(props.data.ending_to) };
 });
 const moreTo = computed(() => safeHref(entryHref(props.data.more_to)));
 const controls = computed(() => rows.value && (choices.value.length > 0 || props.data.row_sort || props.data.row_month));
 const askedLine = computed(() => noneFound(active.value, phrase.value));
</script>

<template>
 <section ref="root" class="tb-section tb-collection-list" :class="{ 'tb-collection-list--rows': rowish }" :aria-busy="pending ? 'true' : undefined">
  <div class="tb-wrap">
   <div v-if="shows('tagline', data.tagline) || shows('headline', data.headline) || (data.more_label && moreTo)" class="tb-collection-list__top">
    <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head" :class="{ 'tb-section__head--start': rowish }">
     <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
     <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
    </header>
    <NuxtLink v-if="data.more_label && moreTo" :to="moreTo" class="tb-collection-list__more">
     {{ data.more_label }}
     <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path v-for="d in UI_ICONS.arrow" :key="d" :d="d" /></svg>
    </NuxtLink>
   </div>

   <TbListFilters
    v-if="controls && source.collection"
    :choices="choiceRows"
    :months="rows && data.row_month ? monthOptions : []"
    :month="askMonth"
    :sorts="sortChoices"
    :sort="sortValue"
    :key-for="answerKey"
    :href-for="hrefFor"
    :peek="peek"
    :hidden="hidden"
    :counted="data.count && counted && !standIn ? counted : ''"
    :counted-long="countedLong"
    :summary="summary"
    :narrowed="narrowed"
    :noun="noun"
    :singular="singular"
    :canvas="Boolean(canvas)"
    @set="setPicks"
   />
   <div v-else-if="!rows && choices.length && source.collection" class="tb-collection-list__choices">
    <div v-for="choice in choices" :key="choice.field" class="tb-collection-list__choice" role="group" :aria-label="fieldLabel(choice.field)">
     <label v-if="choice.ui !== 'buttons'" class="tb-collection-list__pick">
      <span>{{ fieldLabel(choice.field) }}</span>
      <select :value="answers[choice.field] ?? ''" :tabindex="canvas ? -1 : undefined" @change="answer(choice.field, $event.target.value)">
       <option value="">All</option>
       <option v-for="one in facets[choice.field] ?? []" :key="one.value" :value="one.value">{{ one.label }} ({{ one.count }})</option>
      </select>
     </label>
     <template v-else>
      <span class="tb-collection-list__pick-name">{{ fieldLabel(choice.field) }}</span>
      <div class="tb-collection-list__buttons">
       <button type="button" class="tb-chip" :aria-pressed="!answers[choice.field] ? 'true' : 'false'" :tabindex="canvas ? -1 : undefined" @click="answer(choice.field, '')">All</button>
       <button v-for="one in facets[choice.field] ?? []" :key="one.value" type="button" class="tb-chip" :aria-pressed="answers[choice.field] === one.value ? 'true' : 'false'" :tabindex="canvas ? -1 : undefined" @click="answer(choice.field, one.value)">
        {{ one.label }} <span class="tb-collection-list__n">{{ one.count }}</span>
       </button>
      </div>
     </template>
    </div>
   </div>

   <p v-if="data.count && counted && !standIn && !controls" class="tb-collection-list__count" aria-live="polite">{{ counted }}</p>

   <p v-if="canvas && !source.collection" class="tb-collection-list__empty">Pick a collection for this list in the panel on the right.</p>
   <div v-else-if="!entries.length && rows && narrowed" class="tb-collection-list__loosen">
    <h3 class="tb-collection-list__loosen-title">{{ askedLine }}</h3>
    <p v-if="loose?.instead" class="tb-collection-list__loosen-words">{{ loose.instead }}</p>
    <div v-if="loose?.buttons.length" class="tb-collection-list__loosen-buttons">
     <NuxtLink v-for="(one, index) in loose.buttons" :key="one.label" :to="one.to" replace class="tb-button" :class="index === 0 ? 'tb-button--solid' : 'tb-button--outline'">{{ one.label }}</NuxtLink>
    </div>
    <NuxtLink v-if="data.empty_label && safeHref(data.empty_to)" :to="safeHref(data.empty_to)" class="tb-collection-list__notify">
     <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path v-for="d in UI_ICONS.mail" :key="d" :d="d" /></svg>
     {{ data.empty_label }}
    </NuxtLink>
    <section v-if="loose?.next" class="tb-collection-list__next" aria-labelledby="tb-next">
     <h4 id="tb-next">{{ loose.nextTitle }}</h4>
     <ul class="tb-collection-list__rows" role="list"><TbEntryRow :entry="loose.next" :keys="keys" :data="data" :collection="list?.collection" /></ul>
    </section>
   </div>
   <div v-else-if="!entries.length" class="tb-collection-list__none">
    <p class="tb-collection-list__empty">{{ data.empty || 'Nothing here yet.' }}</p>
    <NuxtLink v-if="data.empty_label && safeHref(data.empty_to)" :to="safeHref(data.empty_to)" class="tb-button tb-button--outline">{{ data.empty_label }}</NuxtLink>
   </div>

   <template v-else-if="rowish">
    <template v-for="(group, at) in groups" :key="group.key ?? at">
     <h3 v-if="group.heading" class="tb-collection-list__month">{{ group.heading }}</h3>
     <ul class="tb-collection-list__rows" :class="{ 'tb-collection-list__rows--people': !rows }" role="list">
      <TbEntryRow v-for="entry in group.entries" :key="entry.id" :entry="entry" :keys="keys" :data="data" :collection="list?.collection" :person="!rows" />
     </ul>
    </template>
   </template>

   <div v-else-if="data.layout === 'table'" class="tb-collection-list__scroll">
    <table class="tb-collection-list__table">
     <thead>
      <tr>
       <th scope="col">{{ list?.collection?.singular ?? 'Name' }}</th>
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
        <TbFieldValue v-if="entry.fields.find((field) => field.key === column.key)" :field="entry.fields.find((field) => field.key === column.key)" :entry="entry" :collection="list?.collection" brief />
       </td>
      </tr>
     </tbody>
    </table>
   </div>

   <div v-else :class="{ 'tb-collection-list__carousel': data.layout === 'carousel' }">
    <ul
     ref="track"
     class="tb-collection-list__items"
     :class="[`tb-collection-list__items--${data.layout === 'list' ? 'list' : data.layout}`, ['cards', 'grid'].includes(data.layout) ? `tb-collection-list__items--${data.columns}` : '', featured ? 'tb-collection-list__items--featured' : '']"
     role="list"
    >
     <li
      v-for="(entry, index) in entries"
      :key="entry.id"
      class="tb-collection-list__item"
      :class="{ 'tb-card': ['cards', 'carousel'].includes(data.layout), 'tb-collection-list__item--link': entry.path, 'tb-collection-list__item--featured': featured && index === 0 }"
     >
      <TbImage v-if="pictured && picture(entry)" :image="picture(entry).value" :ratio="data.layout === 'grid' ? '1 / 1' : '3 / 2'" sizes="(min-width: 720px) 400px, 100vw" class="tb-collection-list__image" />
      <div v-else-if="data.layout === 'grid'" class="tb-collection-list__image tb-collection-list__image--none" aria-hidden="true" />
      <div class="tb-collection-list__words">
       <h3 class="tb-collection-list__title">
        <NuxtLink v-if="entry.path" :to="entry.path">{{ entry.title }}</NuxtLink>
        <template v-else>{{ entry.title }}</template>
       </h3>
       <dl v-if="data.layout !== 'grid' && rest(entry).length" class="tb-collection-list__facts">
        <div v-for="field in rest(entry)" :key="field.key">
         <dt>{{ field.label }}</dt>
         <dd><TbFieldValue :field="field" :entry="entry" :collection="list?.collection" brief /></dd>
        </div>
       </dl>
      </div>
     </li>
    </ul>
    <div v-if="data.layout === 'carousel'" class="tb-collection-list__arrows">
     <button type="button" class="tb-button tb-button--outline" aria-label="Back" :tabindex="canvas ? -1 : undefined" @click="slide(-1)">←</button>
     <button type="button" class="tb-button tb-button--outline" aria-label="Forward" :tabindex="canvas ? -1 : undefined" @click="slide(1)">→</button>
    </div>
   </div>

   <nav v-if="pages > 1" class="tb-collection-list__pages" aria-label="Pages of this list">
    <button type="button" class="tb-button tb-button--outline" :disabled="page <= 1" @click="turn(page - 1)">Previous</button>
    <span aria-live="polite">Page {{ page }} of {{ pages }}</span>
    <button type="button" class="tb-button tb-button--outline" :disabled="page >= pages" @click="turn(page + 1)">Next</button>
   </nav>
   <div v-if="canMore" class="tb-collection-list__pages">
    <button type="button" class="tb-button tb-button--outline" :disabled="pending" @click="more">{{ pending ? 'Loading…' : 'Load more' }}</button>
   </div>
   <p v-if="endWords" class="tb-collection-list__end">
    {{ endWords.words }}
    <NuxtLink v-if="endWords.label && endWords.to" :to="endWords.to" replace>{{ endWords.label }}</NuxtLink>
   </p>
  </div>
 </section>
</template>

<style>
 .tb-collection-list__top {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px 20px;
 }

 .tb-collection-list--rows .tb-section__head {
  max-width: none;
  margin-bottom: 14px;
 }

 .tb-collection-list--rows .tb-heading {
  font-size: calc(clamp(22px, 2.6vw, 28px) * var(--site-heading-scale));
 }

 .tb-collection-list__more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 15px;
  font-weight: 700;
  color: var(--site-accent);
  text-decoration: none;
 }

 .tb-collection-list__more:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
 }

 .tb-collection-list__rows {
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .tb-collection-list__rows--people {
  display: grid;
  gap: 8px;
 }

 .tb-collection-list__month {
  margin: 18px 0 0;
  border-bottom: 1px solid var(--site-border);
  padding-bottom: 10px;
  font-family: var(--site-font-display);
  font-size: 20px;
  font-weight: var(--site-heading-weight);
  color: var(--site-heading);
 }

 .tb-collection-list__rows .tb-entry-row:first-child {
  border-top: 0;
 }

 .tb-collection-list__loosen {
  display: grid;
  justify-items: start;
  gap: 14px;
  padding-top: 28px;
 }

 .tb-collection-list__loosen-title {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: 26px;
  font-weight: var(--site-heading-weight);
  line-height: 1.2;
  color: var(--site-heading);
 }

 .tb-collection-list__loosen-words {
  max-width: 640px;
  margin: 0;
  font-size: 17px;
  color: var(--site-body);
 }

 .tb-collection-list__loosen-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
 }

 .tb-collection-list__loosen-buttons .tb-button {
  border-radius: 999px;
  padding: 14px 22px;
  font-size: 15.5px;
 }

 .tb-collection-list__notify {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--site-accent);
  text-underline-offset: 3px;
 }

 .tb-collection-list__next {
  width: 100%;
  margin-top: 14px;
 }

 .tb-collection-list__next h4 {
  margin: 0 0 12px;
  border-bottom: 1px solid var(--site-border);
  padding-bottom: 12px;
  font-family: var(--site-font-display);
  font-size: 18px;
  font-weight: var(--site-heading-weight);
  color: var(--site-heading);
 }

 .tb-collection-list__end {
  margin: 16px 0 0;
  font-size: 14.5px;
  color: var(--site-muted);
 }

 .tb-collection-list__end a {
  font-weight: 700;
  color: var(--site-accent);
  text-underline-offset: 3px;
 }

 .tb-collection-list__empty {
  margin: 0;
  color: var(--site-muted);
 }

 .tb-collection-list__none {
  display: grid;
  justify-items: start;
  gap: 14px;
 }

 .tb-collection-list__count {
  margin: 0 0 14px;
  font-size: 14px;
  color: var(--site-muted);
 }

 .tb-collection-list__choices {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-bottom: 20px;
 }

 .tb-collection-list__pick {
  display: grid;
  gap: 4px;
  font-size: 13px;
  color: var(--site-muted);
 }

 .tb-collection-list__pick select {
  min-height: 40px;
  border: 1px solid var(--site-border);
  border-radius: var(--site-control-radius);
  padding: 8px 10px;
  background: var(--site-bg);
  font: inherit;
  font-size: 15px;
  color: var(--site-heading);
 }

 .tb-collection-list__pick-name {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--site-muted);
 }

 .tb-collection-list__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
 }

 .tb-collection-list__buttons .tb-chip {
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

 .tb-collection-list__buttons .tb-chip[aria-pressed='true'] {
  border-color: var(--site-accent);
  background: var(--site-accent);
  color: var(--site-on-accent, #fff);
 }

 .tb-collection-list__n {
  opacity: 0.7;
  font-size: 12.5px;
 }

 .tb-collection-list__items {
  display: grid;
  gap: 20px;
  margin: 0;
  padding: 0;
  list-style: none;
 }

 @media (min-width: 720px) {
  .tb-collection-list__items--grid.tb-collection-list__items--3 {
   grid-template-columns: repeat(3, 1fr);
  }

  .tb-collection-list__items--2 {
   grid-template-columns: repeat(2, 1fr);
  }

  .tb-collection-list__items--3,
  .tb-collection-list__items--4 {
   grid-template-columns: repeat(2, 1fr);
  }
 }

 @media (min-width: 1000px) {
  .tb-collection-list__items--3 {
   grid-template-columns: repeat(3, 1fr);
  }

  .tb-collection-list__items--4 {
   grid-template-columns: repeat(4, 1fr);
  }
 }

 .tb-collection-list__items--list {
  gap: 0;
 }

 /* A grid of pictures: square, the title under each. */
 .tb-collection-list__items--grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
 }

 .tb-collection-list__items--grid .tb-collection-list__image {
  width: 100%;
  margin: 0 0 8px;
  border-radius: var(--site-radius);
 }

 /* An entry with no picture keeps its square in the grid. */
 .tb-collection-list__image--none {
  aspect-ratio: 1 / 1;
  background: color-mix(in srgb, var(--site-accent) 8%, var(--site-surface));
 }

 .tb-collection-list__items--grid .tb-collection-list__title {
  font-size: 16px;
 }

 /* The first, large: across the whole row on a wide screen. */
 @media (min-width: 720px) {
  .tb-collection-list__items--featured .tb-collection-list__item--featured {
   grid-column: 1 / -1;
  }

  .tb-collection-list__items--cards .tb-collection-list__item--featured,
  .tb-collection-list__items--grid .tb-collection-list__item--featured {
   display: grid;
   grid-template-columns: 3fr 2fr;
   align-items: center;
   gap: 28px;
  }

  .tb-collection-list__items--featured .tb-collection-list__item--featured .tb-collection-list__image {
   width: auto;
   margin: 0;
  }

  .tb-collection-list__items--cards .tb-collection-list__item--featured .tb-collection-list__image {
   margin: -22px 0 -22px -22px;
   border-radius: var(--site-radius) 0 0 var(--site-radius);
  }
 }

 .tb-collection-list__item--featured .tb-collection-list__title {
  font-size: 26px;
 }

 /* A row that scrolls sideways, card by card. */
 .tb-collection-list__items--carousel {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 2px;
  padding: 2px 2px 12px;
  scrollbar-width: thin;
 }

 .tb-collection-list__items--carousel > .tb-collection-list__item {
  flex: 0 0 min(80%, 320px);
  scroll-snap-align: start;
 }

 .tb-collection-list__items--carousel > .tb-collection-list__item--featured {
  flex-basis: min(90%, 560px);
 }

 .tb-collection-list__arrows {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
 }

 .tb-collection-list__arrows button {
  min-width: 44px;
  cursor: pointer;
 }

 .tb-collection-list__items--list .tb-collection-list__item {
  border-bottom: 1px solid var(--site-border);
  padding-block: 18px;
 }

 /* The title's link covers its card or row. */
 .tb-collection-list__item {
  position: relative;
 }

 .tb-collection-list__item--link .tb-collection-list__title a::after {
  content: '';
  position: absolute;
  inset: 0;
 }

 .tb-collection-list__item .tb-field-value__link {
  position: relative;
  z-index: 1;
 }

 /* Out to the card's edges: a picture is as wide as its box says, so the
    negative margins alone would leave it short on the right. */
 .tb-collection-list__image {
  width: calc(100% + 44px);
  max-width: none;
  margin: -22px -22px 18px;
  border-radius: var(--site-radius) var(--site-radius) 0 0;
  overflow: hidden;
 }

 .tb-collection-list__title {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: 20px;
  font-weight: var(--site-heading-weight);
  line-height: 1.25;
  color: var(--site-heading);
 }

 .tb-collection-list__title a {
  color: inherit;
  text-decoration: none;
 }

 .tb-collection-list__title a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
 }

 .tb-collection-list__facts {
  display: grid;
  gap: 4px;
  margin: 10px 0 0;
  font-size: 14.5px;
  color: var(--site-body);
 }

 .tb-collection-list__facts > div {
  display: flex;
  gap: 8px;
 }

 .tb-collection-list__facts dt {
  flex: none;
  color: var(--site-muted);
 }

 .tb-collection-list__facts dt::after {
  content: ':';
 }

 .tb-collection-list__facts dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
 }

 .tb-collection-list__scroll {
  overflow-x: auto;
 }

 .tb-collection-list__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
 }

 .tb-collection-list__table th,
 .tb-collection-list__table td {
  border-bottom: 1px solid var(--site-border);
  padding: 12px 14px 12px 0;
  text-align: left;
  vertical-align: top;
 }

 .tb-collection-list__table thead th {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--site-muted);
 }

 .tb-collection-list__table a {
  color: var(--site-accent);
 }

 .tb-collection-list__pages {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 28px;
  font-size: 14px;
  color: var(--site-muted);
 }

 .tb-collection-list__pages button {
  cursor: pointer;
 }

 .tb-collection-list__pages button:disabled {
  opacity: 0.4;
  cursor: default;
 }
</style>
