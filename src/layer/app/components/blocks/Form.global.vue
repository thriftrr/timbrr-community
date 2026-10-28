<script setup>
 // A contact form: a tagline, headline and a line of intro over boxes for a
 // name, an email address and a message. Sending isn't wired up yet, so the
 // button doesn't send anything. In the studio's canvas the boxes stay
 // still (a click on them selects the block) and the button's label is
 // typed in place, so the button is drawn as a span there, with the same
 // look.
 defineProps({ data: { type: Object, required: true } });

 const canvas = useCanvas();
 const scope = useBlockScope();
 const typing = computed(() => Boolean(canvas) && canvas.editable?.value !== false);

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
 <section class="tb-section tb-form">
  <div class="tb-wrap tb-form__inner">
   <TbText v-if="shows('tagline', data.tagline)" :data="data" field="tagline" tag="p" class="tb-eyebrow" />
   <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   <TbRich v-if="shows('intro', data.intro)" :data="data" field="intro" class="tb-form__intro" />
   <div class="tb-form__fields" :inert="typing">
    <input type="text" name="name" autocomplete="name" placeholder="Name" aria-label="Name" class="tb-form__control" />
    <input type="email" name="email" autocomplete="email" placeholder="Email" aria-label="Email" class="tb-form__control" />
    <textarea name="message" rows="3" placeholder="Message" aria-label="Message" class="tb-form__control tb-form__message" />
   </div>
   <div v-if="shows('submit_label', data.submit_label)" class="tb-form__actions">
    <component :is="typing ? 'span' : 'button'" :type="typing ? undefined : 'button'" class="tb-button tb-button--solid tb-form__submit">
     <TbText :data="data" field="submit_label" />
    </component>
   </div>
  </div>
 </section>
</template>

<style>
 /* One column, centered on the page, with the form under the words. */
 .tb-form__inner {
  max-width: 600px;
  overflow-wrap: break-word;
 }

 .tb-form__intro {
  margin-top: 12px;
  font-size: clamp(16px, 0.4vw + 14px, 17px);
  line-height: 1.6;
  color: var(--site-body);
 }

 .tb-form__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 24px;
 }

 .tb-form__inner > :first-child {
  margin-top: 0;
 }

 /* Quiet boxes with the hint inside, as in the design; the brand color
    rings the one being typed in. 16px type, so phones don't zoom in. */
 .tb-form__control {
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

 .tb-form__control::placeholder {
  color: color-mix(in srgb, var(--site-muted) 78%, var(--site-bg));
  opacity: 1;
 }

 .tb-form__control:hover {
  border-color: color-mix(in srgb, var(--site-muted) 40%, var(--site-border));
 }

 .tb-form__control:focus {
  border-color: var(--site-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--site-accent) 16%, transparent);
  outline: 0;
 }

 /* The message box spans the row and starts a few lines tall. */
 .tb-form__message {
  grid-column: 1 / -1;
  min-height: 88px;
  resize: vertical;
 }

 .tb-form__actions {
  display: flex;
  margin-top: 16px;
 }

 /* The site's solid button, as a real <button> (a span in the canvas). */
 .tb-form__submit {
  margin: 0;
  -webkit-appearance: none;
  appearance: none;
  font-family: inherit;
  text-align: center;
  cursor: pointer;
 }

 /* Phones: one box per row. */
 @media (max-width: 480px) {
  .tb-form__fields {
   grid-template-columns: minmax(0, 1fr);
  }
 }
</style>
