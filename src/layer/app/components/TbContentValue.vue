<script setup>
 // One value of a content entry, drawn by its kind (docs/README.md §
 // Content): { kind, value, text } as the studio sends it. Every kind is
 // drawn as text or through the site's own image and rich-text parts, so
 // nothing an entry holds is ever markup. `brief` is for a card or a table
 // cell: words only, no pictures or long text. `label` is words to show
 // for a link in place of its address, and `ratio` a picture's shape (the
 // Entry field block's own choices).
 defineProps({
  field: { type: Object, required: true },
  brief: { type: Boolean, default: false },
  label: { type: String, default: '' },
  ratio: { type: String, default: '16 / 9' },
 });
</script>

<template>
 <TbImage v-if="field.kind === 'image' && !brief" :image="field.value" :ratio="ratio" class="tb-content-value__image" />
 <TbRich v-else-if="field.kind === 'html' && !brief" :data="{ value: field.value }" field="value" class="tb-content-value__rich" />
 <a v-else-if="field.kind === 'link' && safeHref(field.value)" :href="safeHref(field.value)" class="tb-content-value__link">{{ label || field.text.replace(/^(https?:\/\/|mailto:|tel:)/i, '') }}</a>
 <a v-else-if="field.kind === 'email'" :href="`mailto:${field.text}`" class="tb-content-value__link">{{ label || field.text }}</a>
 <a v-else-if="field.kind === 'phone'" :href="`tel:${field.text.replace(/[^\d+]/g, '')}`" class="tb-content-value__link">{{ label || field.text }}</a>
 <a v-else-if="field.kind === 'file' && safeHref(field.value?.url)" :href="safeHref(field.value.url)" class="tb-content-value__link">{{ label || field.text }}</a>
 <span v-else-if="field.kind === 'relation' || (field.kind === 'terms' && Array.isArray(field.value))" class="tb-content-value__list">
  <template v-for="(one, index) in field.value" :key="index">
   <template v-if="index">, </template>
   <NuxtLink v-if="one.path" :to="one.path" class="tb-content-value__link">{{ one.title ?? one.name }}</NuxtLink>
   <template v-else>{{ one.title ?? one.name }}</template>
  </template>
 </span>
 <!-- A repeater: each row's fields by their own kind (`rows`), so a repeater or a group inside one is drawn too, however deep. -->
 <ul v-else-if="field.kind === 'items' && !brief && field.rows" class="tb-content-value__rows">
  <li v-for="(row, index) in field.rows" :key="index">
   <template v-for="(sub, at) in row" :key="sub.key">
    <TbContentValue v-if="['items', 'group', 'image', 'html', 'code'].includes(sub.kind)" :field="sub" />
    <template v-else><span v-if="at" aria-hidden="true"> · </span><TbContentValue :field="sub" /></template>
   </template>
  </li>
 </ul>
 <ul v-else-if="field.kind === 'items' && !brief" class="tb-content-value__rows">
  <li v-for="(row, index) in field.value" :key="index">{{ Object.values(row).filter((part) => typeof part === 'string' || typeof part === 'number').join(' · ') }}</li>
 </ul>
 <dl v-else-if="field.kind === 'group' && !brief && field.fields" class="tb-content-value__group">
  <div v-for="sub in field.fields" :key="sub.key">
   <dt>{{ sub.label }}</dt>
   <dd><TbContentValue :field="sub" /></dd>
  </div>
 </dl>
 <pre v-else-if="field.kind === 'code' && !brief" class="tb-content-value__code">{{ field.text }}</pre>
 <span v-else-if="field.kind === 'textarea' && !brief" class="tb-content-value__text">{{ field.text }}</span>
 <span v-else>{{ field.text }}</span>
</template>

<style>
 .tb-content-value__image {
  border-radius: var(--site-radius);
  overflow: hidden;
 }

 .tb-content-value__link {
  color: var(--site-accent);
  text-underline-offset: 3px;
 }

 .tb-content-value__text {
  white-space: pre-line;
 }

 .tb-content-value__rows {
  margin: 0;
  padding-left: 1.2em;
 }

 .tb-content-value__group {
  display: grid;
  gap: 6px;
  margin: 0;
 }

 .tb-content-value__group dt {
  font-size: 13px;
  color: var(--site-muted);
 }

 .tb-content-value__group dd {
  margin: 0;
 }

 .tb-content-value__code {
  margin: 0;
  overflow-x: auto;
  border-radius: var(--site-control-radius);
  padding: 14px;
  background: var(--site-surface);
  font-size: 13px;
 }
</style>
