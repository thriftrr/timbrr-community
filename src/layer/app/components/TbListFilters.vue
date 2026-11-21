<script setup>
 // The controls above a Collection list drawn as rows (docs/README.md §
 // Collections). On a wide screen: the first choice set to buttons as a row of
 // pressed buttons, the other choices, a month and the order as menus, how
 // many there are, and a Clear link when something is narrowed. On a phone:
 // one "Filter" button that opens a bottom sheet (groups of chips, several
 // categories at once, "Show 3 classes") and the order beside it.
 //
 // The buttons are links and the menus sit in a form that sends the page
 // address back, so narrowing works without scripts; the address is where the
 // list keeps what was picked. The sheet is a modal <dialog>: the browser
 // traps the focus in it, closes it on Escape and gives the focus back to
 // the button that opened it. Which answers there are, and what a list with a
 // pick would show, come from the list that draws this.
 const props = defineProps({
  // [{ field, name, ui, options: [{ value, label }], answer }]
  choices: { type: Array, default: () => [] },
  months: { type: Array, default: () => [] },
  month: { type: String, default: '' },
  sorts: { type: Array, default: () => [] },
  sort: { type: String, default: '' },
  keyFor: { type: Function, required: true }, // a pick's name in the address
  hrefFor: { type: Function, required: true }, // the page's address with a pick changed
  peek: { type: Function, required: true }, // how many a pick would show
  hidden: { type: Object, default: () => ({}) }, // the rest of the address, for the form
  counted: { type: String, default: '' },
  countedLong: { type: String, default: '' },
  summary: { type: String, default: '' },
  narrowed: { type: Boolean, default: false },
  noun: { type: String, default: 'entries' },
  singular: { type: String, default: 'entry' },
  canvas: { type: Boolean, default: false },
 });
 const emit = defineEmits(['set']);

 const uid = useId();
 const lead = computed(() => props.choices.find((one) => one.ui === 'buttons'));
 const menus = computed(() => props.choices.filter((one) => one !== lead.value));
 const anyWords = (choice) => `Any ${choice.name.toLowerCase()}`;
 const pickedIn = (choice, value) => String(choice.answer ?? '').split('|').filter(Boolean).includes(value);
 const tab = computed(() => (props.canvas ? -1 : undefined));
 const go = (event) => props.canvas && event.preventDefault();
 const hasAny = computed(() => props.choices.length || props.months.length || props.sorts.length);

 // ── The sheet ──
 const dialog = ref(null);
 const draft = reactive({ answers: {}, month: '' });
 const total = ref(null);
 function open() {
  if (props.canvas) return;
  draft.answers = Object.fromEntries(props.choices.map((choice) => [choice.field, String(choice.answer ?? '')]));
  draft.month = props.month;
  total.value = null;
  dialog.value?.showModal();
  count();
 }
 const close = () => dialog.value?.close();
 // A click on the dim part around the sheet is a click on the dialog itself.
 const outside = (event) => event.target === dialog.value && close();
 function toggle(choice, value) {
  const now = String(draft.answers[choice.field] ?? '').split('|').filter(Boolean);
  if (choice.ui !== 'buttons') draft.answers[choice.field] = now[0] === value ? '' : value;
  else draft.answers[choice.field] = (now.includes(value) ? now.filter((one) => one !== value) : [...now, value]).join('|');
 }
 const clearDraft = () => {
  draft.answers = Object.fromEntries(props.choices.map((choice) => [choice.field, '']));
  draft.month = '';
 };
 let timer;
 function count() {
  clearTimeout(timer);
  timer = setTimeout(async () => {
   const got = await props.peek({ answers: { ...draft.answers }, month: draft.month });
   total.value = got ? got.total : null;
  }, 200);
 }
 watch(draft, count, { deep: true });
 onBeforeUnmount(() => clearTimeout(timer));
 function apply() {
  emit('set', { ...draft.answers, _month: draft.month });
  close();
 }
 const showWords = computed(() => (total.value === null ? `Show ${props.noun}` : `Show ${total.value} ${total.value === 1 ? props.singular : props.noun}`));
</script>

<template>
 <div v-if="hasAny" class="tb-filters">
  <form class="tb-filters__bar" method="get" action="" @submit="canvas && $event.preventDefault()">
   <input v-for="(value, name) in hidden" :key="name" type="hidden" :name="name" :value="value" />

   <div v-if="lead" class="tb-filters__lead" role="group" :aria-label="lead.name">
    <NuxtLink :to="hrefFor({ [lead.field]: '' })" replace class="tb-filters__chip" :aria-current="!lead.answer ? 'true' : undefined" :tabindex="tab" @click="go">All</NuxtLink>
    <NuxtLink v-for="one in lead.options" :key="one.value" :to="hrefFor({ [lead.field]: one.value })" replace class="tb-filters__chip" :aria-current="pickedIn(lead, one.value) ? 'true' : undefined" :tabindex="tab" @click="go">{{ one.label }}</NuxtLink>
   </div>
   <span v-if="lead && (menus.length || months.length)" class="tb-filters__rule" aria-hidden="true" />

   <label v-for="choice in menus" :key="choice.field" class="tb-filters__menu" :class="{ 'tb-filters__menu--set': choice.answer }">
    <span>{{ choice.name }}</span>
    <select :name="keyFor(choice.field)" :value="choice.answer" :tabindex="tab" @change="emit('set', { [choice.field]: $event.target.value })">
     <option value="">{{ anyWords(choice) }}</option>
     <option v-for="one in choice.options" :key="one.value" :value="one.value">{{ one.label }}</option>
    </select>
    <svg class="tb-filters__chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path v-for="d in UI_ICONS.chevron" :key="d" :d="d" /></svg>
   </label>

   <label v-if="months.length" class="tb-filters__menu tb-filters__menu--wide" :class="{ 'tb-filters__menu--set': month }">
    <span>Month</span>
    <select :name="keyFor('_month')" :value="month" :tabindex="tab" @change="emit('set', { _month: $event.target.value })">
     <option value="">Any month</option>
     <option v-for="one in months" :key="one.value" :value="one.value">{{ one.label }}</option>
    </select>
    <svg class="tb-filters__chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path v-for="d in UI_ICONS.chevron" :key="d" :d="d" /></svg>
   </label>

   <NuxtLink v-if="narrowed" :to="hrefFor({ clear: true })" replace class="tb-filters__clear" :tabindex="tab" @click="go">Clear</NuxtLink>

   <button v-if="choices.length || months.length" type="button" class="tb-filters__open" :class="{ 'tb-filters__open--set': narrowed }" :tabindex="tab" @click="open">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path v-for="d in UI_ICONS.filter" :key="d" :d="d" /></svg>
    <span>Filter<template v-if="summary"> · {{ summary }}</template></span>
   </button>

   <label v-if="sorts.length" class="tb-filters__menu tb-filters__menu--sort">
    <span>Sort</span>
    <select :name="keyFor('_sort')" :value="sort" :tabindex="tab" @change="emit('set', { _sort: $event.target.value })">
     <option v-for="one in sorts" :key="one.value" :value="one.value">{{ one.label }}</option>
    </select>
    <svg class="tb-filters__chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path v-for="d in UI_ICONS.chevron" :key="d" :d="d" /></svg>
   </label>

   <p v-if="counted" class="tb-filters__count" aria-live="polite">
    <span class="tb-filters__count--wide">{{ counted }}</span>
    <span class="tb-filters__count--narrow">{{ countedLong || counted }}</span>
   </p>

   <button type="submit" class="tb-button tb-button--outline tb-filters__go">Apply</button>
  </form>

  <dialog v-if="choices.length || months.length" ref="dialog" class="tb-filters__sheet" :aria-labelledby="`${uid}-title`" @click="outside">
   <div class="tb-filters__grip" aria-hidden="true" />
   <header class="tb-filters__sheet-head">
    <h2 :id="`${uid}-title`">Filter {{ noun }}</h2>
    <button type="button" class="tb-filters__close" aria-label="Close" @click="close">
     <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path v-for="d in UI_ICONS.close" :key="d" :d="d" /></svg>
    </button>
   </header>
   <div class="tb-filters__sheet-body">
    <section v-for="choice in choices" :key="choice.field" class="tb-filters__group" :aria-labelledby="`${uid}-${choice.field}`">
     <div class="tb-filters__group-head">
      <h3 :id="`${uid}-${choice.field}`">{{ choice.name }}</h3>
      <p v-if="choice.ui === 'buttons'">Pick one or more</p>
     </div>
     <div class="tb-filters__chips">
      <button type="button" class="tb-filters__pick" :aria-pressed="!draft.answers[choice.field] ? 'true' : 'false'" @click="draft.answers[choice.field] = ''">{{ choice.ui === 'buttons' ? 'All' : anyWords(choice) }}</button>
      <button v-for="one in choice.options" :key="one.value" type="button" class="tb-filters__pick" :aria-pressed="String(draft.answers[choice.field] ?? '').split('|').includes(one.value) ? 'true' : 'false'" @click="toggle(choice, one.value)">
       <svg v-if="choice.ui === 'buttons' && String(draft.answers[choice.field] ?? '').split('|').includes(one.value)" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path v-for="d in UI_ICONS.check" :key="d" :d="d" /></svg>
       {{ one.label }}
      </button>
     </div>
    </section>
    <section v-if="months.length" class="tb-filters__group" :aria-labelledby="`${uid}-dates`">
     <div class="tb-filters__group-head"><h3 :id="`${uid}-dates`">Dates</h3></div>
     <div class="tb-filters__chips">
      <button type="button" class="tb-filters__pick" :aria-pressed="!draft.month ? 'true' : 'false'" @click="draft.month = ''">Any time</button>
      <button v-for="one in months" :key="one.value" type="button" class="tb-filters__pick" :aria-pressed="draft.month === one.value ? 'true' : 'false'" @click="draft.month = one.value">{{ one.label }}</button>
     </div>
    </section>
   </div>
   <footer class="tb-filters__sheet-foot">
    <button type="button" class="tb-filters__reset" @click="clearDraft">Clear all</button>
    <button type="button" class="tb-button tb-button--solid tb-filters__apply" @click="apply">{{ showWords }}</button>
   </footer>
  </dialog>
 </div>
</template>

<style>
 .tb-filters {
  margin-bottom: 4px;
  border-bottom: 1px solid var(--site-border);
  padding-bottom: 18px;
 }

 .tb-filters__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
 }

 .tb-filters__lead {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
 }

 .tb-filters__chip {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  border: 1px solid transparent;
  border-radius: var(--site-control-radius);
  padding: 0 16px;
  font-size: 15px;
  font-weight: 700;
  color: var(--site-heading);
  text-decoration: none;
 }

 .tb-filters__chip:hover {
  background: color-mix(in srgb, var(--site-accent) 8%, transparent);
 }

 .tb-filters__chip[aria-current='true'] {
  border-color: var(--site-accent);
  background: color-mix(in srgb, var(--site-accent) 12%, var(--site-bg));
 }

 .tb-filters__rule {
  align-self: stretch;
  width: 1px;
  margin-block: 8px;
  background: var(--site-border);
 }

 .tb-filters__menu {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  border: 1px solid var(--site-border);
  border-radius: var(--site-control-radius);
  padding: 0 34px 0 14px;
  background: var(--site-bg);
  font-size: 15px;
  color: var(--site-muted);
 }

 .tb-filters__menu select {
  appearance: none;
  border: 0;
  background: transparent;
  padding: 8px 0;
  font: inherit;
  font-weight: 600;
  color: var(--site-heading);
  cursor: pointer;
 }

 .tb-filters__menu:focus-within {
  outline: 2px solid var(--site-accent);
  outline-offset: 2px;
 }

 .tb-filters__menu select:focus {
  outline: none;
 }

 .tb-filters__menu--set {
  border-color: var(--site-accent);
  box-shadow: inset 0 0 0 1px var(--site-accent);
 }

 .tb-filters__chevron {
  position: absolute;
  right: 10px;
  pointer-events: none;
  color: var(--site-heading);
 }

 .tb-filters__clear {
  font-size: 15px;
  font-weight: 700;
  color: var(--site-accent);
  text-underline-offset: 3px;
 }

 .tb-filters__count {
  margin: 0 0 0 auto;
  font-size: 14px;
  color: var(--site-muted);
 }

 .tb-filters__count--narrow {
  display: none;
 }

 .tb-filters__open {
  display: none;
 }

 /* Only with scripts off: the menus can't send themselves, so they get a button. */
 .tb-filters__go {
  display: none;
 }

 @media (scripting: none) {
  .tb-filters__go {
   display: inline-flex;
  }
 }

 /* A phone: one button for the filters, the order beside it. */
 @media (max-width: 719px) {
  .tb-filters {
   padding-bottom: 12px;
  }

  .tb-filters__bar {
   gap: 10px;
  }

  .tb-filters__lead,
  .tb-filters__rule,
  .tb-filters__bar > .tb-filters__menu:not(.tb-filters__menu--sort),
  .tb-filters__clear {
   display: none;
  }

  .tb-filters__open {
   display: inline-flex;
   flex: 1 1 auto;
   align-items: center;
   gap: 10px;
   min-height: 44px;
   border: 1px solid var(--site-border);
   border-radius: var(--site-control-radius);
   padding: 0 16px;
   background: var(--site-bg);
   font: inherit;
   font-size: 15px;
   font-weight: 700;
   color: var(--site-heading);
   cursor: pointer;
  }

  .tb-filters__open--set {
   border-color: var(--site-accent);
   background: color-mix(in srgb, var(--site-accent) 12%, var(--site-bg));
  }

  .tb-filters__menu--sort {
   min-height: 44px;
   flex: 0 1 auto;
  }

  .tb-filters__count {
   order: 9;
   flex-basis: 100%;
   margin: 4px 0 0;
   font-size: 13px;
  }

  .tb-filters__count--wide {
   display: none;
  }

  .tb-filters__count--narrow {
   display: inline;
  }
 }

 .tb-filters__sheet {
  width: 100%;
  max-width: none;
  max-height: 88vh;
  margin: auto 0 0;
  border: 0;
  border-radius: 20px 20px 0 0;
  padding: 0;
  background: var(--site-bg);
  color: var(--site-ink);
  overscroll-behavior: contain;
 }

 .tb-filters__sheet[open] {
  display: flex;
  flex-direction: column;
 }

 .tb-filters__sheet::backdrop {
  background: color-mix(in srgb, var(--site-dark) 55%, transparent);
 }

 .tb-filters__grip {
  align-self: center;
  width: 40px;
  height: 4px;
  margin-top: 8px;
  border-radius: 2px;
  background: var(--site-border);
 }

 .tb-filters__sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px 12px;
 }

 .tb-filters__sheet-head h2 {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: 22px;
  color: var(--site-heading);
 }

 .tb-filters__close {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  background: transparent;
  color: var(--site-heading);
  cursor: pointer;
 }

 .tb-filters__sheet-body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 0 20px;
 }

 .tb-filters__group {
  border-top: 1px solid var(--site-border);
  padding-block: 16px;
 }

 .tb-filters__group-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
 }

 .tb-filters__group-head h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--site-heading);
 }

 .tb-filters__group-head p {
  margin: 0;
  font-size: 13px;
  color: var(--site-muted);
 }

 .tb-filters__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
 }

 .tb-filters__pick {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  border: 1px solid var(--site-border);
  border-radius: var(--site-control-radius);
  padding: 0 16px;
  background: var(--site-bg);
  font: inherit;
  font-size: 15px;
  color: var(--site-heading);
  cursor: pointer;
 }

 .tb-filters__pick[aria-pressed='true'] {
  border-color: var(--site-accent);
  box-shadow: inset 0 0 0 1px var(--site-accent);
  background: color-mix(in srgb, var(--site-accent) 12%, var(--site-bg));
  font-weight: 700;
 }

 .tb-filters__sheet-foot {
  display: flex;
  align-items: center;
  gap: 12px;
  border-top: 1px solid var(--site-border);
  padding: 14px 20px 18px;
 }

 .tb-filters__reset {
  border: 0;
  background: transparent;
  padding: 10px 4px;
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  color: var(--site-accent);
  cursor: pointer;
 }

 .tb-filters__apply {
  flex: 1 1 auto;
  justify-content: center;
  min-height: 52px;
  border-radius: 999px;
  font-size: 16px;
  cursor: pointer;
 }
</style>
