// What the studio sends its canvas to draw grove blocks with (the studio's
// docs/groves.md, "In the page builder"), or null anywhere else:
//  lists  { '<block id>:<field key>': a list, exactly as /__timbrr/groves
//         answers }; a studio from before field keys sends '<block id>'
//  raw    { <block id>: the block's data as it's kept }, for a block whose
//         words the studio filled tokens into: what's drawn is the filled
//         copy, and what's typed into is the kept one
// The canvas page sets it; a live page never does, and asks the site itself.
export function useTimbrrGroves() {
 return useState('timbrr-groves', () => null);
}

// A field's value as it's kept, for typing into: from the studio's raw copy
// of this block when it sent one, or what the block was drawn with (which
// is also where a field the kept copy leaves out gets its default).
export function useKeptValue(props) {
 const sent = useTimbrrGroves();
 const scope = useBlockScope();
 return computed(() => valueAt(sent.value?.raw?.[scope?.id], props.field) ?? valueAt(props.data, props.field));
}

const KEY = /^[a-z][a-z0-9_]{0,39}$/;

// A `grove` field's value as the site's /__timbrr/groves reads it
// (docs/README.md § Groves, "Grove-aware blocks"). `answers` are a visitor's
// picks for the list's choices ({ ring: value }); `meta` asks for the grove's
// rings beside the saplings.
export function groveQuery(source, { page = 1, answers = {}, meta = false } = {}) {
 const s = source && typeof source === 'object' ? source : {};
 const related = s.related === true ? 'points_here' : typeof s.related === 'string' ? s.related : 'none';
 const rk = { points_here: 'points_here', same_branch: s.relatedSet ? `same_branch.${s.relatedSet}` : '', linked: s.relatedRing ? `linked.${s.relatedRing}` : '' }[related] ?? '';
 const filters = [...(Array.isArray(s.filters) ? s.filters : []), ...(s.filter?.ring ? [s.filter] : [])].slice(0, 5);
 const choices = (Array.isArray(s.choices) ? s.choices : []).map((choice) => choice?.ring).filter((ring) => KEY.test(ring ?? '')).slice(0, 3);
 const query = {
  grove: s.grove ?? '',
  sort: s.sort ?? 'published',
  dir: s.dir ?? 'desc',
  limit: s.limit ?? 12,
  p: page,
 };
 if (filters.length) query.f = filters.map((one) => `${one.ring}:${one.op}:${[one.value ?? ''].flat().join('|')}`);
 if (s.show?.length) query.show = s.show.join(',');
 if (s.branch) Object.assign(query, { bs: s.branch.set, br: s.branch.slug });
 if (rk) Object.assign(query, { rk, rel: s.relatedTo || '-' });
 if (choices.length) query.facets = choices.join(',');
 for (const ring of choices) if (typeof answers[ring] === 'string' && answers[ring]) query[`c.${ring}`] = answers[ring].slice(0, 200);
 if (meta) query.meta = '1';
 return query;
}

// The saplings a `grove` field names, for a block of the site's own code:
//  const { saplings, total, pages, page, facets, pending, more } = await useSaplings(props.data.source)
// On a live page it asks the site's /__timbrr/groves (kept a minute at the
// edge); on the studio's canvas it reads what the studio sent for this
// block's field (`field`, 'source' unless said). `page` is a ref or a number;
// `answers` a ref of { ring: value } for the list's choices. `more()` adds
// the next page under what's there (Load more).
export async function useSaplings(source, { field = 'source', page = 1, answers = {}, meta = false } = {}) {
 const sent = useTimbrrGroves();
 const canvas = useCanvas();
 const scope = useBlockScope();
 const at = ref(toValue(page));
 watch(
  () => toValue(page),
  (value) => (at.value = value),
 );
 const studio = computed(() => (sent.value || canvas ? (sent.value?.lists?.[`${scope?.id}:${field}`] ?? sent.value?.lists?.[scope?.id]) : undefined));
 const query = computed(() => groveQuery(toValue(source), { page: at.value, answers: toValue(answers), meta }));
 const asks = Boolean(toValue(source)?.grove) && !sent.value && !canvas;
 const { data, pending, refresh } = await useFetch('/__timbrr/groves', {
  key: `tb-saplings-${scope?.id ?? toValue(source)?.grove}-${field}`,
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
   const got = await $fetch('/__timbrr/groves', { query: groveQuery(toValue(source), { page: next, answers: toValue(answers) }) });
   extra.value = [...extra.value, ...(got?.saplings ?? [])];
  } finally {
   loading.value = false;
  }
 }
 return {
  list,
  saplings: computed(() => [...(list.value?.saplings ?? []), ...extra.value]),
  total: computed(() => list.value?.total ?? 0),
  pages: computed(() => list.value?.pages ?? 1),
  page: at,
  shown: computed(() => (list.value?.saplings?.length ?? 0) + extra.value.length),
  facets: computed(() => list.value?.facets ?? {}),
  grove: computed(() => list.value?.grove ?? null),
  rings: computed(() => list.value?.rings ?? []),
  // Whether the canvas is waiting for the studio's copy (draw stand-ins).
  standIn: computed(() => Boolean(sent.value || canvas) && studio.value === undefined),
  pending: computed(() => pending.value || loading.value),
  refresh,
  more,
 };
}

// A grove's name and rings, for a block of the site's own code that lists
// it its own way: const { grove, rings, pending } = await useGrove('events').
export async function useGrove(key) {
 const { grove, rings, pending } = await useSaplings(
  computed(() => ({ grove: toValue(key), limit: 1 })),
  { field: `grove:${toValue(key)}`, meta: true },
 );
 return { grove, rings, pending };
}
