<script setup>
 // One ring's value of a sapling, drawn by its kind (docs/README.md §
 // Groves): { kind, value, text, settings? } as the studio sends it, its
 // value in the form the ring says it sends ("what the site gets"). The
 // site's own grove hooks (defineGroveHook) get first say: a value one
 // formats is drawn as its words. Every kind is drawn as text or through
 // the site's own image and rich-text parts, so nothing a sapling holds is
 // ever markup. `brief` is for a card or a table cell: words only, no
 // pictures or long text. `label` is words to show for a link in place of
 // its address, and `ratio` a picture's shape (the Sapling ring block's own
 // choices). A password, and a ring that only arranges the studio's form,
 // never reaches the site.
 const props = defineProps({
  ring: { type: Object, required: true },
  brief: { type: Boolean, default: false },
  label: { type: String, default: '' },
  ratio: { type: String, default: '16 / 9' },
  sapling: { type: Object, default: null }, // for a grove hook
  grove: { type: Object, default: null },
 });
 const { format } = useGroveHooks();
 const hooked = computed(() => {
  const value = format(props.ring, props.ring.value, props.sapling, props.grove);
  return value === props.ring.value ? null : String(value ?? '');
 });
 const settings = computed(() => props.ring.settings ?? {});
 const list = computed(() => [props.ring.value].flat().filter((one) => one !== undefined && one !== null && one !== ''));
 // A picture as an object, whether the ring sends the whole picture or its address.
 const image = computed(() => (typeof props.ring.value === 'string' ? { src: props.ring.value, alt: '' } : props.ring.value));
 // Words written out (a date the ring sends as kept reads better long).
 const when = computed(() => (typeof props.ring.value === 'string' && settings.value.returnFormat && settings.value.returnFormat !== 'iso' ? props.ring.value : props.ring.text));
 const paragraphs = computed(() => String(props.ring.text ?? '').split(/\n\s*\n/).map((one) => one.trim()).filter(Boolean));
 const ICONS = { ...CARD_ICONS, ...BUTTON_ICONS };
 const affixed = (words) => [settings.value.prepend, words, settings.value.append].filter(Boolean).join(settings.value.prepend?.length > 1 || settings.value.append ? ' ' : '');
</script>

<template>
 <span v-if="hooked !== null" class="tb-ring-value__text">{{ hooked }}</span>
 <TbImage v-else-if="ring.kind === 'image' && !brief && image?.src" :image="image" :ratio="ratio" class="tb-ring-value__image" />
 <TbRingGallery v-else-if="ring.kind === 'gallery' && !brief && Array.isArray(ring.value)" :value="ring.value" />
 <TbRich v-else-if="ring.kind === 'html' && !brief" :data="{ value: ring.value }" field="value" class="tb-ring-value__rich" />
 <TbRingEmbed v-else-if="ring.kind === 'embed' && !brief" :value="ring.value" :aspect="settings.aspect" :label="ring.label" />
 <TbRingMap v-else-if="ring.kind === 'map' && !brief && ring.value" :value="ring.value" :height="settings.height" />
 <TbRingLayouts v-else-if="ring.kind === 'layouts' && !brief && ring.rows" :rows="ring.rows" />
 <a v-else-if="ring.kind === 'link' && safeHref(ring.value)" :href="safeHref(ring.value)" class="tb-ring-value__link">{{ label || ring.text.replace(/^(https?:\/\/|mailto:|tel:)/i, '') }}</a>
 <a v-else-if="ring.kind === 'email'" :href="`mailto:${ring.text}`" class="tb-ring-value__link">{{ label || ring.text }}</a>
 <a v-else-if="ring.kind === 'phone'" :href="`tel:${ring.text.replace(/[^\d+]/g, '')}`" class="tb-ring-value__link">{{ label || ring.text }}</a>
 <a v-else-if="ring.kind === 'file' && safeHref(ring.value?.url ?? ring.value)" :href="safeHref(ring.value?.url ?? ring.value)" class="tb-ring-value__link">{{ label || ring.text }}</a>
 <TbRingLink v-else-if="ring.kind === 'link_to'" :value="ring.value" :label="label" />
 <span v-else-if="ring.kind === 'page' && list.every((one) => typeof one === 'object' || String(one).startsWith('/'))" class="tb-ring-value__list">
  <template v-for="(one, index) in list" :key="index"><template v-if="index">, </template><TbRingLink :value="one" :label="list.length === 1 ? label : ''" /></template>
 </span>
 <span v-else-if="ring.kind === 'relation' || (ring.kind === 'branches' && Array.isArray(ring.value))" class="tb-ring-value__list">
  <template v-for="(one, index) in ring.value" :key="index">
   <template v-if="index">, </template>
   <NuxtLink v-if="one?.path" :to="one.path" class="tb-ring-value__link">{{ one.title ?? one.name }}</NuxtLink>
   <template v-else>{{ typeof one === 'object' ? (one.title ?? one.name) : one }}</template>
  </template>
 </span>
 <span v-else-if="ring.kind === 'color'" class="tb-ring-value__color"><span class="tb-ring-value__swatch" :style="{ background: ring.text }" aria-hidden="true" />{{ ring.text }}</span>
 <svg v-else-if="ring.kind === 'icon' && ICONS[ring.text]" class="tb-ring-value__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" role="img" :aria-label="ring.label">
  <path v-for="(d, index) in ICONS[ring.text]" :key="index" :d="d" />
 </svg>
 <span v-else-if="['date', 'datetime', 'time'].includes(ring.kind)">{{ when }}</span>
 <span v-else-if="['number', 'range', 'text'].includes(ring.kind) && (settings.prepend || settings.append)">{{ affixed(ring.text) }}</span>
 <!-- A repeater: each row's rings by their own kind (`rows`), so a repeater or a group inside one is drawn too, however deep. -->
 <ul v-else-if="ring.kind === 'items' && !brief && ring.rows" class="tb-ring-value__rows">
  <li v-for="(row, index) in ring.rows" :key="index">
   <template v-for="(sub, at) in row" :key="sub.key">
    <TbRingValue v-if="['items', 'group', 'image', 'html', 'code', 'gallery', 'map', 'embed', 'layouts'].includes(sub.kind)" :ring="sub" :sapling="sapling" :grove="grove" />
    <template v-else><span v-if="at" aria-hidden="true"> · </span><TbRingValue :ring="sub" :sapling="sapling" :grove="grove" /></template>
   </template>
  </li>
 </ul>
 <ul v-else-if="ring.kind === 'items' && !brief" class="tb-ring-value__rows">
  <li v-for="(row, index) in ring.value" :key="index">{{ Object.values(row).filter((part) => typeof part === 'string' || typeof part === 'number').join(' · ') }}</li>
 </ul>
 <dl v-else-if="ring.kind === 'group' && !brief && ring.rings" class="tb-ring-value__group">
  <div v-for="sub in ring.rings" :key="sub.key">
   <dt>{{ sub.label }}</dt>
   <dd><TbRingValue :ring="sub" :sapling="sapling" :grove="grove" /></dd>
  </div>
 </dl>
 <pre v-else-if="ring.kind === 'code' && !brief" class="tb-ring-value__code">{{ ring.text }}</pre>
 <div v-else-if="ring.kind === 'textarea' && !brief && settings.lines === 'paragraphs'" class="tb-ring-value__paragraphs">
  <p v-for="(one, index) in paragraphs" :key="index">{{ one }}</p>
 </div>
 <span v-else-if="ring.kind === 'textarea' && !brief && settings.lines !== 'plain'" class="tb-ring-value__text">{{ ring.text }}</span>
 <span v-else-if="!['password', 'message', 'accordion', 'tab'].includes(ring.kind)">{{ ring.text }}</span>
</template>

<style>
 .tb-ring-value__image {
  border-radius: var(--site-radius);
  overflow: hidden;
 }

 .tb-ring-value__link {
  color: var(--site-accent);
  text-underline-offset: 3px;
 }

 .tb-ring-value__text {
  white-space: pre-line;
 }

 .tb-ring-value__rows {
  margin: 0;
  padding-left: 1.2em;
 }

 .tb-ring-value__group {
  display: grid;
  gap: 6px;
  margin: 0;
 }

 .tb-ring-value__group dt {
  font-size: 13px;
  color: var(--site-muted);
 }

 .tb-ring-value__group dd {
  margin: 0;
 }

 .tb-ring-value__paragraphs p {
  margin: 0 0 0.8em;
 }

 .tb-ring-value__color {
  display: inline-flex;
  align-items: center;
  gap: 8px;
 }

 .tb-ring-value__swatch {
  width: 1em;
  height: 1em;
  border: 1px solid var(--site-border);
  border-radius: 50%;
 }

 .tb-ring-value__icon {
  width: 28px;
  height: 28px;
  color: var(--site-accent);
 }

 .tb-ring-value__code {
  margin: 0;
  overflow-x: auto;
  border-radius: var(--site-control-radius);
  padding: 14px;
  background: var(--site-surface);
  font-size: 13px;
 }
</style>
