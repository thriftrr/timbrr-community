<script setup>
 // One field's value of an entry, drawn by its kind (docs/README.md §
 // Collections): { kind, value, text, settings? } as the studio sends it, its
 // value in the form the field says it sends ("what the site gets"). The
 // site's own collection hooks (defineCollectionHook) get first say: a value one
 // formats is drawn as its words. Every kind is drawn as text or through
 // the site's own image and rich-text parts, so nothing an entry holds is
 // ever markup. `brief` is for a card or a table cell: words only, no
 // pictures or long text. `label` is words to show for a link in place of
 // its address, and `ratio` a picture's shape (the Entry field block's own
 // choices). A password, and a field that only arranges the studio's form,
 // never reaches the site.
 const props = defineProps({
  field: { type: Object, required: true },
  brief: { type: Boolean, default: false },
  label: { type: String, default: '' },
  ratio: { type: String, default: '16 / 9' },
  entry: { type: Object, default: null }, // for a collection hook
  collection: { type: Object, default: null },
 });
 const { format } = useCollectionHooks();
 const hooked = computed(() => {
  const value = format(props.field, props.field.value, props.entry, props.collection);
  return value === props.field.value ? null : String(value ?? '');
 });
 const settings = computed(() => props.field.settings ?? {});
 const list = computed(() => [props.field.value].flat().filter((one) => one !== undefined && one !== null && one !== ''));
 // A picture as an object, whether the field sends the whole picture or its address.
 const image = computed(() => (typeof props.field.value === 'string' ? { src: props.field.value, alt: '' } : props.field.value));
 // Words written out (a date the field sends as kept reads better long).
 const when = computed(() => (typeof props.field.value === 'string' && settings.value.returnFormat && settings.value.returnFormat !== 'iso' ? props.field.value : props.field.text));
 const paragraphs = computed(() => String(props.field.text ?? '').split(/\n\s*\n/).map((one) => one.trim()).filter(Boolean));
 const ICONS = { ...CARD_ICONS, ...BUTTON_ICONS };
 const affixed = (words) => [settings.value.prepend, words, settings.value.append].filter(Boolean).join(settings.value.prepend?.length > 1 || settings.value.append ? ' ' : '');
</script>

<template>
 <span v-if="hooked !== null" class="tb-field-value__text">{{ hooked }}</span>
 <TbImage v-else-if="field.kind === 'image' && !brief && image?.src" :image="image" :ratio="ratio" class="tb-field-value__image" />
 <TbFieldGallery v-else-if="field.kind === 'gallery' && !brief && Array.isArray(field.value)" :value="field.value" />
 <TbRich v-else-if="field.kind === 'html' && !brief" :data="{ value: field.value }" field="value" class="tb-field-value__rich" />
 <TbFieldEmbed v-else-if="field.kind === 'embed' && !brief" :value="field.value" :aspect="settings.aspect" :label="field.label" />
 <TbFieldMap v-else-if="field.kind === 'map' && !brief && field.value" :value="field.value" :height="settings.height" />
 <TbFieldLayouts v-else-if="field.kind === 'layouts' && !brief && field.rows" :rows="field.rows" />
 <a v-else-if="field.kind === 'link' && safeHref(field.value)" :href="safeHref(field.value)" class="tb-field-value__link">{{ label || field.text.replace(/^(https?:\/\/|mailto:|tel:)/i, '') }}</a>
 <a v-else-if="field.kind === 'email'" :href="`mailto:${field.text}`" class="tb-field-value__link">{{ label || field.text }}</a>
 <a v-else-if="field.kind === 'phone'" :href="`tel:${field.text.replace(/[^\d+]/g, '')}`" class="tb-field-value__link">{{ label || field.text }}</a>
 <a v-else-if="field.kind === 'file' && safeHref(field.value?.url ?? field.value)" :href="safeHref(field.value?.url ?? field.value)" class="tb-field-value__link">{{ label || field.text }}</a>
 <TbFieldLink v-else-if="field.kind === 'link_to'" :value="field.value" :label="label" />
 <span v-else-if="field.kind === 'page' && list.every((one) => typeof one === 'object' || String(one).startsWith('/'))" class="tb-field-value__list">
  <template v-for="(one, index) in list" :key="index"><template v-if="index">, </template><TbFieldLink :value="one" :label="list.length === 1 ? label : ''" /></template>
 </span>
 <span v-else-if="field.kind === 'relation' || (field.kind === 'dimensionValues' && Array.isArray(field.value))" class="tb-field-value__list">
  <template v-for="(one, index) in field.value" :key="index">
   <template v-if="index">, </template>
   <NuxtLink v-if="one?.path" :to="one.path" class="tb-field-value__link">{{ one.title ?? one.name }}</NuxtLink>
   <template v-else>{{ typeof one === 'object' ? (one.title ?? one.name) : one }}</template>
  </template>
 </span>
 <span v-else-if="field.kind === 'color'" class="tb-field-value__color"><span class="tb-field-value__swatch" :style="{ background: field.text }" aria-hidden="true" />{{ field.text }}</span>
 <svg v-else-if="field.kind === 'icon' && ICONS[field.text]" class="tb-field-value__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" role="img" :aria-label="field.label">
  <path v-for="(d, index) in ICONS[field.text]" :key="index" :d="d" />
 </svg>
 <span v-else-if="['date', 'datetime', 'time'].includes(field.kind)">{{ when }}</span>
 <span v-else-if="['number', 'range', 'text'].includes(field.kind) && (settings.prepend || settings.append)">{{ affixed(field.text) }}</span>
 <!-- A repeater: each row's fields by their own kind (`rows`), so a repeater or a group inside one is drawn too, however deep. -->
 <ul v-else-if="field.kind === 'items' && !brief && field.rows" class="tb-field-value__rows">
  <li v-for="(row, index) in field.rows" :key="index">
   <template v-for="(sub, at) in row" :key="sub.key">
    <TbFieldValue v-if="['items', 'group', 'image', 'html', 'code', 'gallery', 'map', 'embed', 'layouts'].includes(sub.kind)" :field="sub" :entry="entry" :collection="collection" />
    <template v-else><span v-if="at" aria-hidden="true"> · </span><TbFieldValue :field="sub" :entry="entry" :collection="collection" /></template>
   </template>
  </li>
 </ul>
 <ul v-else-if="field.kind === 'items' && !brief" class="tb-field-value__rows">
  <li v-for="(row, index) in field.value" :key="index">{{ Object.values(row).filter((part) => typeof part === 'string' || typeof part === 'number').join(' · ') }}</li>
 </ul>
 <dl v-else-if="field.kind === 'group' && !brief && field.fields" class="tb-field-value__group">
  <div v-for="sub in field.fields" :key="sub.key">
   <dt>{{ sub.label }}</dt>
   <dd><TbFieldValue :field="sub" :entry="entry" :collection="collection" /></dd>
  </div>
 </dl>
 <pre v-else-if="field.kind === 'code' && !brief" class="tb-field-value__code">{{ field.text }}</pre>
 <div v-else-if="field.kind === 'textarea' && !brief && settings.lines === 'paragraphs'" class="tb-field-value__paragraphs">
  <p v-for="(one, index) in paragraphs" :key="index">{{ one }}</p>
 </div>
 <span v-else-if="field.kind === 'textarea' && !brief && settings.lines !== 'plain'" class="tb-field-value__text">{{ field.text }}</span>
 <span v-else-if="!['password', 'message', 'accordion', 'tab'].includes(field.kind)">{{ field.text }}</span>
</template>

<style>
 .tb-field-value__image {
  border-radius: var(--site-radius);
  overflow: hidden;
 }

 .tb-field-value__link {
  color: var(--site-accent);
  text-underline-offset: 3px;
 }

 .tb-field-value__text {
  white-space: pre-line;
 }

 .tb-field-value__rows {
  margin: 0;
  padding-left: 1.2em;
 }

 .tb-field-value__group {
  display: grid;
  gap: 6px;
  margin: 0;
 }

 .tb-field-value__group dt {
  font-size: 13px;
  color: var(--site-muted);
 }

 .tb-field-value__group dd {
  margin: 0;
 }

 .tb-field-value__paragraphs p {
  margin: 0 0 0.8em;
 }

 .tb-field-value__color {
  display: inline-flex;
  align-items: center;
  gap: 8px;
 }

 .tb-field-value__swatch {
  width: 1em;
  height: 1em;
  border: 1px solid var(--site-border);
  border-radius: 50%;
 }

 .tb-field-value__icon {
  width: 28px;
  height: 28px;
  color: var(--site-accent);
 }

 .tb-field-value__code {
  margin: 0;
  overflow-x: auto;
  border-radius: var(--site-control-radius);
  padding: 14px;
  background: var(--site-surface);
  font-size: 13px;
 }
</style>
