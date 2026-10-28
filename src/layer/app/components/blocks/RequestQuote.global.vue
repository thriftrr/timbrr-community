<script setup>
 // A quote request: a few words about what to send, then a short form for
 // a name, a phone number, the service wanted (the block's own list) and
 // photos of the job. Sending isn't wired up yet, so the button doesn't
 // send anything. In the studio's canvas the form stays still (a click on
 // it selects the block) and the button's label is typed in place, so the
 // button is drawn as a span there, with the same look.
 const props = defineProps({ data: { type: Object, required: true } });

 const canvas = useCanvas();
 const scope = useBlockScope();
 const typing = computed(() => Boolean(canvas) && canvas.editable?.value !== false);

 const services = computed(() => props.data.services.map((item) => item.name.trim()).filter(Boolean));
 const photos = ref(0);

 // The photo box says how many were picked.
 const photosText = computed(() => {
  if (!photos.value) return 'Add photos (optional)';
  return `${photos.value} ${photos.value === 1 ? 'photo' : 'photos'} added`;
 });

 function onPhotos(event) {
  photos.value = event.target.files?.length ?? 0;
 }

 // Words to show: a string with something in it, or a rich-text document
 // with some text.
 function hasWords(node) {
  if (typeof node === 'string') return node.trim() !== '';
  if (node?.type === 'text') return Boolean(node.text?.trim());
  return Array.isArray(node?.content) && node.content.some(hasWords);
 }

 // An empty field isn't drawn, except on the studio's canvas while it's
 // being typed into, so clearing it to start over doesn't lose the caret.
 function shows(field, value) {
  if (hasWords(value)) return true;
  const active = canvas?.active.value;
  return Boolean(active && active.id === scope?.id && active.field === field);
 }
</script>

<template>
 <section class="tb-section tb-request-quote">
  <div class="tb-wrap tb-request-quote__inner">
   <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
   <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   <TbRich v-if="shows('body', data.body)" :data="data" field="body" class="tb-request-quote__body" />
   <div class="tb-request-quote__fields" :inert="typing">
    <input type="text" name="name" autocomplete="name" placeholder="Name" aria-label="Name" class="tb-request-quote__control" />
    <input type="tel" name="phone" autocomplete="tel" placeholder="Phone" aria-label="Phone" class="tb-request-quote__control" />
    <div v-if="services.length" class="tb-request-quote__select">
     <select name="service" aria-label="Service" class="tb-request-quote__control">
      <option value="" disabled selected>Service</option>
      <option v-for="(name, index) in services" :key="index" :value="name">{{ name }}</option>
     </select>
     <span class="tb-request-quote__chevron" aria-hidden="true">▾</span>
    </div>
    <label class="tb-request-quote__photos">
     <input type="file" name="photos" accept="image/*" multiple class="tb-request-quote__file" @change="onPhotos" />
     {{ photosText }}
    </label>
   </div>
   <div v-if="shows('submit_label', data.submit_label)" class="tb-request-quote__actions">
    <component :is="typing ? 'span' : 'button'" :type="typing ? undefined : 'button'" class="tb-button tb-button--solid tb-request-quote__submit">
     <TbText :data="data" field="submit_label" />
    </component>
   </div>
  </div>
 </section>
</template>

<style>
 /* One column, centered on the page, with the form under the words. */
 .tb-request-quote__inner {
  max-width: 640px;
  overflow-wrap: break-word;
 }

 .tb-request-quote__body {
  margin-top: 14px;
  font-size: clamp(16px, 0.5vw + 14px, 18px);
  line-height: 1.65;
  color: var(--site-body);
 }

 .tb-request-quote__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 24px;
 }

 .tb-request-quote__inner > :first-child {
  margin-top: 0;
 }

 /* Quiet boxes with the hint inside, as in the design; the brand color
    rings the one being typed in. 16px type, so phones don't zoom in. */
 .tb-request-quote__control {
  display: block;
  width: 100%;
  min-width: 0;
  margin: 0;
  border: 1px solid color-mix(in srgb, var(--site-muted) 12%, var(--site-border));
  border-radius: 9px;
  padding: 11px 14px;
  background: var(--site-bg);
  font: inherit;
  font-size: 16px;
  line-height: 1.4;
  color: var(--site-heading);
  transition:
   border-color 120ms ease,
   box-shadow 120ms ease;
 }

 .tb-request-quote__control::placeholder {
  color: color-mix(in srgb, var(--site-muted) 78%, var(--site-bg));
  opacity: 1;
 }

 .tb-request-quote__control:hover {
  border-color: color-mix(in srgb, var(--site-muted) 40%, var(--site-border));
 }

 .tb-request-quote__control:focus {
  border-color: var(--site-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--site-accent) 16%, transparent);
  outline: 0;
 }

 /* The service menu: the same box, with the design's ▾ in place of the
    browser's own arrow. Until something is picked (the placeholder option
    is the chosen one) it reads as a hint. */
 .tb-request-quote__select {
  position: relative;
  grid-column: 1 / -1;
 }

 .tb-request-quote__select .tb-request-quote__control {
  padding-right: 40px;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
 }

 .tb-request-quote__select .tb-request-quote__control:has(option:disabled:checked) {
  color: color-mix(in srgb, var(--site-muted) 78%, var(--site-bg));
 }

 .tb-request-quote__select option {
  color: var(--site-heading);
 }

 .tb-request-quote__select option:disabled {
  color: var(--site-muted);
 }

 .tb-request-quote__chevron {
  position: absolute;
  top: 50%;
  right: 15px;
  font-size: 14px;
  line-height: 1;
  color: color-mix(in srgb, var(--site-muted) 78%, var(--site-bg));
  transform: translateY(-50%);
  pointer-events: none;
 }

 /* Photos: a dashed box to click, or to drop pictures on. The file input
    covers it, invisibly, so both work without any code. */
 .tb-request-quote__photos {
  position: relative;
  grid-column: 1 / -1;
  display: block;
  border: 1.5px dashed color-mix(in srgb, var(--site-muted) 28%, var(--site-border));
  border-radius: 9px;
  padding: 18px 14px;
  font-size: 15px;
  line-height: 1.4;
  color: var(--site-muted);
  text-align: center;
  transition:
   border-color 120ms ease,
   background-color 120ms ease,
   box-shadow 120ms ease;
 }

 .tb-request-quote__photos:hover {
  border-color: color-mix(in srgb, var(--site-muted) 55%, var(--site-border));
  background: var(--site-surface);
 }

 .tb-request-quote__photos:focus-within {
  border-color: var(--site-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--site-accent) 16%, transparent);
 }

 .tb-request-quote__file {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
 }

 .tb-request-quote__actions {
  display: flex;
  margin-top: 16px;
 }

 /* The site's solid button, as a real <button> (a span in the canvas). */
 .tb-request-quote__submit {
  margin: 0;
  -webkit-appearance: none;
  appearance: none;
  font-family: inherit;
  text-align: center;
  cursor: pointer;
 }

 /* Phones: one box per row. */
 @media (max-width: 480px) {
  .tb-request-quote__fields {
   grid-template-columns: minmax(0, 1fr);
  }
 }
</style>
