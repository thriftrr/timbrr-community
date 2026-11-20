<script setup>
 // One site search hit, as the pop-up and /search draw it: a thumb (its
 // picture, else a date tile for a dated kind, else the kind's icon), its
 // title and a line of its words with what matched in <mark>, and its kind
 // on the right. The studio sends the words as [{ text, hit }], never
 // markup. The parent makes it a link or an option.
 const props = defineProps({
  hit: { type: Object, required: true },
  kind: { type: String, default: '' }, // the kind's name, for the right-hand column
  big: { type: Boolean, default: false }, // /search's bigger thumb and two lines of words
 });

 const parts = (list, fallback) => (Array.isArray(list) && list.length ? list.filter((part) => typeof part?.text === 'string') : [{ text: String(fallback ?? '') }]);
 const title = computed(() => parts(props.hit.titleParts, props.hit.title));
 const snippet = computed(() => parts(props.hit.snippet, props.hit.summary));
 const image = computed(() => (safeSrc(props.hit.image?.src) ? props.hit.image.src : ''));
 const tile = computed(() => (image.value ? null : dateTile(props.hit.date)));
</script>

<template>
 <span class="tb-search-row" :class="{ 'tb-search-row--big': big }">
  <span class="tb-search-row__thumb" :class="{ 'tb-search-row__thumb--date': tile }" aria-hidden="true">
   <img v-if="image" :src="image" alt="" loading="lazy" decoding="async" />
   <template v-else-if="tile">
    <span class="tb-search-row__day">{{ tile.day }}</span>
    <span class="tb-search-row__month">{{ tile.month }}</span>
   </template>
   <svg v-else-if="hit.kind === 'page'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round">
    <path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z" />
    <path d="M14 3v5h5M8.5 13h7M8.5 16.5h5" />
   </svg>
   <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M4 9.5h16M9.5 9.5V20" />
   </svg>
  </span>
  <span class="tb-search-row__text">
   <span class="tb-search-row__title">
    <template v-for="(part, at) in title" :key="at"><mark v-if="part.hit">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template>
   </span>
   <span v-if="snippet.some((part) => part.text.trim())" class="tb-search-row__snippet">
    <template v-for="(part, at) in snippet" :key="at"><mark v-if="part.hit">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template>
   </span>
  </span>
  <span v-if="kind" class="tb-search-row__meta">{{ kind }}</span>
 </span>
</template>

<style>
 .tb-search-row {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
 }

 .tb-search-row__thumb {
  display: grid;
  flex: none;
  place-items: center;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border-radius: calc(var(--site-radius) * 0.6);
  background: var(--site-surface);
  color: var(--site-muted);
 }

 .tb-search-row--big .tb-search-row__thumb {
  width: 88px;
  height: 66px;
 }

 .tb-search-row__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
 }

 .tb-search-row__thumb--date {
  align-content: center;
  gap: 1px;
  background: var(--site-accent);
  color: var(--site-accent-ink);
  line-height: 1;
 }

 .tb-search-row__day {
  font-family: var(--site-font-display);
  font-size: 18px;
  font-weight: var(--site-heading-weight);
 }

 .tb-search-row__month {
  font-family: var(--site-font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
 }

 .tb-search-row__text {
  display: grid;
  flex: 1;
  gap: 2px;
  min-width: 0;
 }

 .tb-search-row__title {
  overflow: hidden;
  font-family: var(--site-font-display);
  font-size: 16px;
  font-weight: var(--site-heading-weight);
  letter-spacing: var(--site-heading-tracking);
  line-height: 1.3;
  color: var(--site-heading);
  text-overflow: ellipsis;
  white-space: nowrap;
 }

 .tb-search-row__snippet {
  overflow: hidden;
  font-size: 14px;
  line-height: 1.45;
  color: var(--site-body);
  text-overflow: ellipsis;
  white-space: nowrap;
 }

 .tb-search-row--big .tb-search-row__title {
  font-size: 19px;
  white-space: normal;
 }

 .tb-search-row--big .tb-search-row__snippet {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 15px;
  white-space: normal;
 }

 .tb-search-row mark {
  border-radius: 3px;
  background: color-mix(in srgb, var(--site-accent) 18%, transparent);
  color: inherit;
 }

 .tb-search-row__meta {
  flex: none;
  max-width: 30%;
  overflow: hidden;
  font-size: 13px;
  color: var(--site-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
 }
</style>
