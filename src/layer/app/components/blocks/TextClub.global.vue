<script setup>
 // A sign-up band for a text or email club, on the site's soft surface: a
 // headline, a line about what members get, one box beside the button, and
 // the consent copy under it. The box asks for a phone number or an email
 // address (the block's choice), so phones show the right keyboard. Sending
 // isn't wired up yet, so the button doesn't send anything.
 //
 // In the studio's canvas the box's hint is typed in place, so the box is
 // drawn as text there, and the button as a span: both measure exactly as
 // the real ones do, so nothing on the page moves.
 const props = defineProps({ data: { type: Object, required: true } });

 const canvas = useCanvas();
 const scope = useBlockScope();
 const typing = computed(() => Boolean(canvas) && canvas.editable?.value !== false);

 const email = computed(() => props.data.channel === 'email');
 // An empty hint still says what goes in the box.
 const hint = computed(() => props.data.placeholder.trim() || (email.value ? 'Email address' : 'Phone number'));

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
 <section class="tb-section tb-text-club">
  <div class="tb-wrap tb-text-club__inner">
   <TbText v-if="shows('headline', data.headline)" :data="data" field="headline" tag="h2" class="tb-heading" />
   <TbRich v-if="shows('body', data.body)" :data="data" field="body" class="tb-text-club__body" />
   <div class="tb-text-club__signup">
    <div v-if="typing" class="tb-text-club__input tb-text-club__input--hint">
     <TbText :data="data" field="placeholder" />
    </div>
    <input
     v-else
     :type="email ? 'email' : 'tel'"
     :name="email ? 'email' : 'phone'"
     :autocomplete="email ? 'email' : 'tel'"
     :placeholder="hint"
     :aria-label="hint"
     class="tb-text-club__input"
    />
    <component
     :is="typing ? 'span' : 'button'"
     v-if="shows('submit_label', data.submit_label)"
     :type="typing ? undefined : 'button'"
     class="tb-button tb-button--solid tb-text-club__submit"
    >
     <TbText :data="data" field="submit_label" />
    </component>
   </div>
   <TbText v-if="shows('consent', data.consent)" :data="data" field="consent" tag="p" class="tb-text-club__consent" multiline />
  </div>
 </section>
</template>

<style>
 .tb-section.tb-text-club {
  background: var(--site-surface);
  text-align: center;
 }

 .tb-text-club__inner {
  max-width: 560px;
  overflow-wrap: break-word;
 }

 .tb-text-club__body {
  margin-top: 14px;
  font-size: clamp(16px, 0.5vw + 14px, 18px);
  line-height: 1.65;
  color: var(--site-body);
 }

 /* The box and the button share one row and one height, as in the design,
    phones included. A label too long to fit beside the box takes the next
    line, centered. */
 .tb-text-club__signup {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 22px;
 }

 .tb-text-club__inner > :first-child {
  margin-top: 0;
 }

 /* A quiet white box with the hint inside, as in the design. Its height is
    set, not measured, so the canvas's stand-in matches it exactly. 16px
    type, so phones don't zoom in. */
 .tb-text-club__input {
  flex: 1 1 200px;
  min-width: 0;
  height: calc(1.4em + 24px);
  margin: 0;
  border: 1px solid color-mix(in srgb, var(--site-muted) 12%, var(--site-border));
  border-radius: 9px;
  padding: 11px 14px;
  background: var(--site-bg);
  font: inherit;
  font-size: 16px;
  line-height: 1.4;
  color: var(--site-heading);
  text-align: left;
  transition:
   border-color 120ms ease,
   box-shadow 120ms ease;
 }

 .tb-text-club__input::placeholder {
  color: color-mix(in srgb, var(--site-muted) 78%, var(--site-bg));
  opacity: 1;
 }

 .tb-text-club__input:hover {
  border-color: color-mix(in srgb, var(--site-muted) 40%, var(--site-border));
 }

 .tb-text-club__input:focus {
  border-color: var(--site-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--site-accent) 16%, transparent);
  outline: 0;
 }

 /* The canvas's stand-in: the hint as text, in the hint's color. */
 .tb-text-club__input--hint {
  display: flex;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
  color: color-mix(in srgb, var(--site-muted) 78%, var(--site-bg));
 }

 .tb-text-club__input--hint > * {
  flex: 1 1 auto;
  min-width: 0;
 }

 /* The site's solid button, as a real <button> (a span in the canvas),
    stretched to the box's height. */
 .tb-text-club__submit {
  flex: 0 1 auto;
  justify-content: center;
  max-width: 100%;
  margin: 0;
  -webkit-appearance: none;
  appearance: none;
  font-family: inherit;
  text-align: center;
  cursor: pointer;
 }

 .tb-text-club__consent {
  margin: 12px 0 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--site-muted);
  white-space: pre-line;
 }
</style>
