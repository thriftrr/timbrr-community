<script setup>
 // One atom of an own block (TbOwnBlock), drawn with what Core blocks already
 // use: TbText and TbRich for words (typed into on the canvas), TbImage for a
 // picture, TbButton for buttons. Every style key is a class over a Branding
 // token. An empty atom isn't drawn, except on the canvas while it's typed into.
 //
 // A picture with no alt text that isn't marked decorative is left off the
 // live site (TbOwnBlock lists it on the canvas instead). Nothing here loads a
 // third party: video and embed atoms wait for the site's "What this site
 // collects" list to know about them.
 import { ownAtomLook } from '../../schema/own-block.js';

 const props = defineProps({
  node: { type: Object, required: true },
  row: { type: Object, default: null }, // { list, index } inside a list's grid
 });
 const own = inject(OWN_BLOCK_KEY);
 const canvas = useCanvas();
 const shown = useFieldShown();

 const data = computed(() => own.data.value);
 const field = computed(() => (props.node.field ? (own.fields.value.get(props.node.field) ?? null) : null));
 // The value's path in the block's data: 'title', or 'cards.2.title' in a list.
 const path = computed(() => {
  const key = props.node.field ?? '';
  return props.row ? `${props.row.list}.${props.row.index}.${key.split('.')[1]}` : key;
 });
 const value = computed(() => (path.value ? valueAt(data.value, path.value) : undefined));
 const tag = computed(() => (props.node === own.first.value && !props.row ? own.headTag.value : 'h3'));
 const styles = computed(() => [
  ...['size', 'color', 'font', 'weight', 'align', 'corners', 'shadow'].filter((key) => props.node[key]).map((key) => `tb-own--${key}-${String(props.node[key]).toLowerCase()}`),
  ...ownAtomLook(props.node),
  props.node.class ?? '',
 ]);
 const anchor = computed(() => (canvas ? undefined : props.node.anchor));
 const ratio = (value, fallback = '4:3') => {
  const picked = value ?? fallback;
  return picked === 'auto' ? 'auto' : picked.replace(':', ' / ');
 };

 const picture = computed(() => {
  const image = value.value;
  if (!image?.src) return null;
  const missingAlt = !String(image.alt ?? '').trim() && image.decorative !== true;
  return missingAlt && !canvas ? null : image;
 });
 const buttons = computed(() => (Array.isArray(value.value) ? value.value.flatMap((button, index) => (shown(`${path.value}.${index}.label`, button?.label) ? [index] : [])) : []));
 const icon = computed(() => {
  const picked = value.value;
  // A card icon too (check, star, heart…): a list's tick is one.
  return Array.isArray(picked?.paths) ? picked.paths : (BUTTON_ICONS[picked] ?? CARD_ICONS[picked] ?? null);
 });
 const number = computed(() => {
  if (typeof value.value !== 'number' || !Number.isFinite(value.value)) return '';
  const suffix = field.value?.suffix ?? '';
  return `${field.value?.prefix ?? ''}${value.value.toLocaleString('en-US')}${suffix && /^[A-Za-z]/.test(suffix) ? ' ' : ''}${suffix}`;
 });
 const clock = (time) => {
  const [hours, minutes] = String(time ?? '').split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return '';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
 };
 const when = computed(() => {
  if (props.node.atom === 'time') return clock(value.value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.value ?? '')) return '';
  return new Date(`${value.value}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
 });
 const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
 const hours = computed(() => (Array.isArray(value.value) ? value.value.slice(0, 7).map((day, index) => ({ day: DAYS[index], said: day?.closed ? 'Closed' : day?.open && day?.close ? `${clock(day.open)} – ${clock(day.close)}` : '' })) : []));
 const tags = computed(() => (Array.isArray(value.value) ? value.value.filter((word) => typeof word === 'string' && word.trim()) : []));
</script>

<template>
 <TbText v-if="node.atom === 'eyebrow' && shown(path, value)" :id="anchor" :data="data" :field="path" tag="p" class="tb-eyebrow tb-own__eyebrow" :class="styles" />
 <TbText v-else-if="node.atom === 'heading' && shown(path, value)" :id="anchor" :data="data" :field="path" :tag="tag" class="tb-heading tb-own__heading" :class="styles" />
 <blockquote v-else-if="node.atom === 'quote' && shown(path, value)" :id="anchor" class="tb-own__quote" :class="styles">
  <TbText :data="data" :field="path" tag="p" :multiline="field?.kind === 'textarea'" />
 </blockquote>
 <TbText v-else-if="node.atom === 'text' && shown(path, value)" :id="anchor" :data="data" :field="path" tag="p" :multiline="field?.kind === 'textarea'" class="tb-own__text" :class="styles" />
 <TbRich v-else-if="node.atom === 'rich' && shown(path, value)" :id="anchor" :data="data" :field="path" class="tb-own__rich" :class="styles" />
 <figure v-else-if="node.atom === 'picture' && picture" :id="anchor" class="tb-own__picture" :class="styles">
  <TbImage :image="picture" :field="path" :ratio="ratio(node.ratio, field?.ratios?.[0])" sizes="(min-width: 1120px) 560px, 100vw" />
 </figure>
 <div v-else-if="node.atom === 'buttons' && buttons.length" :id="anchor" class="tb-buttons tb-own__buttons" :class="styles">
  <TbButton v-for="index in buttons" :key="index" :data="data" :field="`${path}.${index}`" />
 </div>
 <a v-else-if="node.atom === 'link' && (value?.label || canvas) && safeHref(value?.to)" :id="anchor" :href="safeHref(value.to)" class="tb-own__link" :class="styles"><TbText :data="data" :field="`${path}.label`" /></a>
 <svg v-else-if="node.atom === 'icon' && icon" :id="anchor" class="tb-own__icon" :class="styles" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path v-for="d in icon" :key="d" :d="d" />
 </svg>
 <p v-else-if="node.atom === 'number' && number" :id="anchor" class="tb-own__number" :class="styles">{{ number }}</p>
 <p v-else-if="(node.atom === 'date' || node.atom === 'time') && when" :id="anchor" class="tb-own__when" :class="styles">{{ when }}</p>
 <table v-else-if="node.atom === 'hours' && hours.some((day) => day.said)" :id="anchor" class="tb-own__hours" :class="styles">
  <tbody>
   <tr v-for="day in hours" :key="day.day">
    <th scope="row">{{ day.day }}</th>
    <td>{{ day.said || 'Closed' }}</td>
   </tr>
  </tbody>
 </table>
 <ul v-else-if="node.atom === 'tags' && tags.length" :id="anchor" class="tb-own__tags" :class="styles">
  <li v-for="word in tags" :key="word">{{ word }}</li>
 </ul>
 <hr v-else-if="node.atom === 'divider'" :id="anchor" class="tb-own__divider" :class="styles" />
 <div v-else-if="node.atom === 'space'" :id="anchor" class="tb-own__space" :class="styles" aria-hidden="true" />
</template>
