// What the studio sends its canvas to draw collection blocks with (the studio's
// docs/collections.md, "In the page builder"), or null anywhere else:
//  lists  { '<block id>:<field key>': a list, exactly as /__timbrr/collections
//         answers }; a studio from before field keys sends '<block id>'
//  raw    { <block id>: the block's data as it's kept }, for a block whose
//         words the studio filled tokens into: what's drawn is the filled
//         copy, and what's typed into is the kept one
// The canvas page sets it; a live page never does, and asks the site itself.
export function useTimbrrCollections() {
 return useState('timbrr-collections', () => null);
}

// A field's value as it's kept, for typing into: from the studio's raw copy
// of this block when it sent one, or what the block was drawn with (which
// is also where a field the kept copy leaves out gets its default).
export function useKeptValue(props) {
 const sent = useTimbrrCollections();
 const scope = useBlockScope();
 return computed(() => valueAt(sent.value?.raw?.[scope?.id], props.field) ?? valueAt(props.data, props.field));
}

const KEY = /^[a-z][a-z0-9_]{0,39}$/;

// A `collection` field's value as the site's /__timbrr/collections reads it
// (docs/README.md § Collections, "Collection-aware blocks"). `answers` are a visitor's
// picks for the list's choices ({ field: value }); `meta` asks for the collection's
// fields beside the entries.
export function collectionQuery(source, { page = 1, answers = {}, meta = false } = {}) {
 const s = source && typeof source === 'object' ? source : {};
 const related = s.related === true ? 'points_here' : typeof s.related === 'string' ? s.related : 'none';
 const rk = { points_here: 'points_here', same_dimension_value: s.relatedSet ? `same_dimension_value.${s.relatedSet}` : '', linked: s.relatedField ? `linked.${s.relatedField}` : '' }[related] ?? '';
 const filters = [...(Array.isArray(s.filters) ? s.filters : []), ...(s.filter?.field ? [s.filter] : [])].slice(0, 5);
 const choices = (Array.isArray(s.choices) ? s.choices : []).map((choice) => choice?.field).filter((field) => KEY.test(field ?? '')).slice(0, 3);
 const query = {
  collection: s.collection ?? '',
  sort: s.sort ?? 'published',
  dir: s.dir ?? 'desc',
  limit: s.limit ?? 12,
  p: page,
 };
 if (filters.length) query.f = filters.map((one) => `${one.field}:${one.op}:${[one.value ?? ''].flat().join('|')}`);
 if (s.show?.length) query.show = s.show.join(',');
 if (s.dimensionValue) Object.assign(query, { bs: s.dimensionValue.set, br: s.dimensionValue.slug });
 if (rk) Object.assign(query, { rk, rel: s.relatedTo || '-' });
 if (choices.length) query.facets = choices.join(',');
 for (const field of choices) if (typeof answers[field] === 'string' && answers[field]) query[`c.${field}`] = answers[field].slice(0, 200);
 if (meta) query.meta = '1';
 return query;
}

// The entries a `collection` field names, for a block of the site's own code:
//  const { entries, total, pages, page, facets, pending, more } = await useEntries(props.data.source)
// On a live page it asks the site's /__timbrr/collections (kept a minute at the
// edge); on the studio's canvas it reads what the studio sent for this
// block's field (`field`, 'source' unless said). `page` is a ref or a number;
// `answers` a ref of { field: value } for the list's choices. `more()` adds
// the next page under what's there (Load more).
export async function useEntries(source, { field = 'source', page = 1, answers = {}, meta = false } = {}) {
 const sent = useTimbrrCollections();
 const canvas = useCanvas();
 const scope = useBlockScope();
 const at = ref(toValue(page));
 watch(
  () => toValue(page),
  (value) => (at.value = value),
 );
 const studio = computed(() => (sent.value || canvas ? (sent.value?.lists?.[`${scope?.id}:${field}`] ?? sent.value?.lists?.[scope?.id]) : undefined));
 const query = computed(() => collectionQuery(toValue(source), { page: at.value, answers: toValue(answers), meta }));
 const asks = Boolean(toValue(source)?.collection) && !sent.value && !canvas;
 const { data, pending, refresh } = await useFetch('/__timbrr/collections', {
  key: `tb-entries-${scope?.id ?? toValue(source)?.collection}-${field}`,
  query,
  immediate: asks,
  watch: asks ? undefined : false,
  default: () => null,
 });
 const list = computed(() => (sent.value || canvas ? (studio.value ?? null) : data.value));
 // Load more: the pages after the first, fetched one at a time and kept under it.
 const extra = ref([]);
 watch(query, () => (extra.value = []), { deep: true });
 const loading = ref(false);
 async function more() {
  if (!asks || loading.value) return;
  const next = (list.value?.page ?? 1) + extra.value.length + 1;
  if (next > (list.value?.pages ?? 1)) return;
  loading.value = true;
  try {
   const got = await $fetch('/__timbrr/collections', { query: collectionQuery(toValue(source), { page: next, answers: toValue(answers) }) });
   extra.value = [...extra.value, ...(got?.entries ?? [])];
  } finally {
   loading.value = false;
  }
 }
 return {
  list,
  entries: computed(() => [...(list.value?.entries ?? []), ...extra.value]),
  total: computed(() => list.value?.total ?? 0),
  pages: computed(() => list.value?.pages ?? 1),
  page: at,
  shown: computed(() => (list.value?.entries?.length ?? 0) + extra.value.length),
  facets: computed(() => list.value?.facets ?? {}),
  collection: computed(() => list.value?.collection ?? null),
  fields: computed(() => list.value?.fields ?? []),
  // Whether the canvas is waiting for the studio's copy (draw stand-ins).
  standIn: computed(() => Boolean(sent.value || canvas) && studio.value === undefined),
  pending: computed(() => pending.value || loading.value),
  refresh,
  more,
 };
}

// A collection's name and fields, for a block of the site's own code that lists
// it its own way: const { collection, fields, pending } = await useCollection('events').
export async function useCollection(key) {
 const { collection, fields, pending } = await useEntries(
  computed(() => ({ collection: toValue(key), limit: 1 })),
  { field: `collection:${toValue(key)}`, meta: true },
 );
 return { collection, fields, pending };
}
