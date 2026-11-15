<script setup>
 // Prices in groups that open and close. Each group's name is a line to
 // press, with a plus that becomes a minus while its prices show. Prices
 // with no group come first, always showing. With "first open", one group
 // shows at a time; on the canvas they're all open, so every price can be
 // typed into. It's the browser's own <details>, so it works with no script.
 const props = defineProps({ data: { type: Object, required: true } });
 const shows = useFieldShown();
 const canvas = useCanvas();
 const fold = useId();

 // Each group with its rows, and where each row's words live in the data
 // (TbText edits by that path). A block from before groups were their own
 // thing has none: its prices are grouped by the name each one carried.
 const groups = computed(() => {
  const own = props.data.groups ?? [];
  if (own.length) {
   return own.map((group, g) => ({ name: String(group.name ?? '').trim(), at: `groups.${g}.name`, rows: (group.prices ?? []).map((row, index) => ({ row, at: `groups.${g}.prices.${index}` })) }));
  }
  return groupRows(props.data.prices ?? [], 'group').map((group) => ({ name: group.name, at: '', rows: group.rows.map(({ row, index }) => ({ row, at: `prices.${index}` })) }));
 });
 const firstNamed = computed(() => groups.value.findIndex((group) => group.name));
 const all = computed(() => Boolean(canvas) || props.data.opens === 'all');
</script>

<template>
 <section class="tb-section nw-prices">
  <div class="tb-wrap tb-wrap--narrow">
   <header v-if="shows('tagline', data.tagline) || shows('headline', data.headline)" class="tb-section__head">
    <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
    <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   </header>
   <div v-if="groups.length" class="nw-prices__groups">
    <component :is="group.name ? 'details' : 'div'" v-for="(group, at) in groups" :key="at" class="nw-prices__group" :name="group.name && !all ? fold : undefined" :open="group.name ? all || at === firstNamed : undefined">
     <summary v-if="group.name" class="nw-prices__group-name">
      <TbText v-if="group.at" :data="data" :field="group.at" />
      <template v-else>{{ group.name }}</template>
     </summary>
     <ul class="nw-prices__list" role="list">
      <li v-for="entry in group.rows" :key="entry.at" class="nw-prices__row">
       <div class="nw-prices__text">
        <TbText :data="data" :field="`${entry.at}.name`" tag="h3" class="nw-prices__name" />
        <TbText v-if="shows(`${entry.at}.detail`, entry.row.detail)" :data="data" :field="`${entry.at}.detail`" tag="p" class="nw-prices__detail" />
       </div>
       <p class="nw-prices__price">
        <TbText :data="data" :field="`${entry.at}.price`" class="nw-prices__amount" />
        <TbText v-if="shows(`${entry.at}.period`, entry.row.period)" :data="data" :field="`${entry.at}.period`" class="nw-prices__period" />
       </p>
      </li>
     </ul>
    </component>
   </div>
   <TbText v-if="shows('note', data.note)" :data="data" field="note" tag="p" class="nw-prices__note" />
  </div>
 </section>
</template>

<style>
 /* One rule between every line, names and prices alike, and one to close. */
 .nw-prices__groups {
  border-bottom: 1px solid var(--site-border);
 }

 .nw-prices__group-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid var(--site-border);
  padding: clamp(15px, 1.8vw, 19px) 0;
  font-family: var(--site-font-display);
  font-size: clamp(19px, 0.6vw + 16px, 23px);
  font-weight: var(--site-heading-weight);
  line-height: 1.25;
  color: var(--site-heading);
  list-style: none;
  cursor: pointer;
 }

 .nw-prices__group-name::-webkit-details-marker {
  display: none;
 }

 /* The plus is two bars; open, the upright one goes and it's a minus. */
 .nw-prices__group-name::after {
  content: '';
  flex: none;
  width: 14px;
  height: 14px;
  background:
   linear-gradient(currentColor, currentColor) center / 14px 2px no-repeat,
   linear-gradient(currentColor, currentColor) center / 2px 14px no-repeat;
 }

 .nw-prices__group[open] > .nw-prices__group-name::after {
  background: linear-gradient(currentColor, currentColor) center / 14px 2px no-repeat;
 }

 .nw-prices__group-name:hover {
  color: var(--site-accent);
 }

 .nw-prices__group-name:focus-visible {
  outline: 2px solid var(--site-accent);
  outline-offset: 2px;
 }

 .nw-prices__list {
  margin: 0;
  padding: 0;
  list-style: none;
 }

 details.nw-prices__group > .nw-prices__list {
  padding-bottom: 6px;
 }

 .nw-prices__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 20px;
  border-top: 1px solid var(--site-border);
  padding: clamp(13px, 1.5vw, 16px) 0;
  overflow-wrap: break-word;
 }

 /* The first price under a name follows it with no rule between. */
 details.nw-prices__group .nw-prices__row:first-child {
  border-top: 0;
  padding-top: 0;
 }

 .nw-prices__text {
  flex: 1 1 auto;
  min-width: 0;
 }

 .nw-prices__name {
  margin: 0;
  font-family: var(--site-font-display);
  font-size: clamp(17px, 0.4vw + 14.5px, 19px);
  font-weight: 700;
  line-height: 1.3;
  color: var(--site-heading);
 }

 .nw-prices__detail {
  margin: 3px 0 0;
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--site-body);
 }

 .nw-prices__price {
  display: flex;
  flex: none;
  align-items: baseline;
  gap: 0 5px;
  max-width: 45%;
  margin: 0;
 }

 .nw-prices__amount {
  font-family: var(--site-font-display);
  font-size: clamp(18px, 0.5vw + 15.5px, 21px);
  font-weight: var(--site-heading-weight);
  line-height: 1.1;
  color: var(--site-heading);
 }

 .nw-prices__period {
  font-size: 14px;
  color: var(--site-muted);
 }

 .nw-prices__note {
  margin: 14px 0 0;
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--site-muted);
 }
</style>
