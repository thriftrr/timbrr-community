<script setup>
 // A form as a visitor fills it in (the studio's docs/forms.md): its steps one
 // at a time, its show/hide rules and totals as they answer, and what it says
 // when something's wrong, all from what the studio sent. Sending goes to this
 // site's own /__timbrr/forms/:id. The studio checks it all again and says how it
 // went: taken (a thank-you, or a page to go to), a mistake to show on a field,
 // or that the Human check has to run first. `locked` is the studio's canvas,
 // where it's only a picture; `compact` is a footer's, with no heading or room
 // around it.
 const props = defineProps({
  form: { type: Object, required: true },
  heading: { type: String, default: '' },
  locked: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
 });

 const uid = useId();
 const values = reactive({});
 const errors = reactive({});
 const files = new Map();
 const step = ref(0);
 const sending = ref(false);
 const failed = ref('');
 const sent = ref(null);
 const trap = ref('');
 const root = ref(null);
 const check = ref(null);
 let opened = 0;

 const steps = computed(() => formSteps(props.form));
 const current = computed(() => Math.min(step.value, steps.value.length - 1));
 const last = computed(() => current.value >= steps.value.length - 1);
 const shown = computed(() => steps.value[current.value].fields.filter((field) => field.type !== 'hidden' && formFieldVisible(props.form, field, values)));
 const title = computed(() => props.heading.trim() || props.form.title);
 const span = (field) => (props.form.advanced && !props.compact ? { half: 6, third: 4 }[field.width] ?? 12 : 12);
 const fieldId = (field) => `${uid}-${field.id}`;
 const priced = (field, option) => props.form.advanced && Number(option.v) > 0;
 const timesGuests = (field) => props.form.fields.some((entry) => entry.type === 'calc' && entry.terms?.some((term) => term.field === field.id && term.op === '×'));
 const price = (field, option) => `${field.type === 'checkbox' ? '+' : ''}${formMoney(option.v)}${field.type === 'radio' && timesGuests(field) ? ' each' : ''}`;
 const accepted = (field) => (field.files?.types ?? []).map((kind) => ({ JPG: '.jpg,.jpeg', HEIC: '.heic,.heif' })[kind] ?? `.${kind.toLowerCase()}`).join(',');
 const fileHint = (field) => `${(field.files?.types ?? []).join(', ')} · up to ${field.files?.max ?? 10} MB`;

 function clear(field) {
  delete errors[field.id];
  failed.value = '';
 }

 function toggle(field, label) {
  const list = Array.isArray(values[field.id]) ? values[field.id] : [];
  values[field.id] = list.includes(label) ? list.filter((entry) => entry !== label) : [...list, label];
  clear(field);
 }

 function pick(field, input) {
  const file = input.target.files?.[0];
  if (file) {
   files.set(field.id, file);
   values[field.id] = { name: file.name, size: file.size };
  } else {
   files.delete(field.id);
   values[field.id] = '';
  }
  clear(field);
 }

 const today = () => new Date().toISOString().slice(0, 10);

 function checkStep() {
  let good = true;
  for (const field of steps.value[current.value].fields) {
   const message = formFieldVisible(props.form, field, values) ? formFieldError(props.form, field, values, today()) : '';
   if (message) {
    errors[field.id] = message;
    good = false;
   } else delete errors[field.id];
  }
  return good;
 }

 function next() {
  if (!checkStep()) return;
  step.value = current.value + 1;
  nextTick(() => root.value?.scrollIntoView?.({ block: 'nearest' }));
 }

 function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise((resolve, reject) => {
   const script = document.createElement('script');
   script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
   script.async = true;
   script.onload = () => resolve(window.turnstile);
   script.onerror = () => reject(new Error("Couldn't load the check."));
   document.head.append(script);
  });
 }

 // The Human check, which usually needs nothing from anyone.
 async function humanToken(siteKey) {
  const turnstile = await loadTurnstile();
  return new Promise((resolve, reject) => {
   check.value.textContent = '';
   turnstile.render(check.value, { sitekey: siteKey, callback: resolve, 'error-callback': () => reject(new Error('The check failed.')) });
  });
 }

 function body(token) {
  const answers = {};
  for (const field of props.form.fields) {
   if (['page', 'calc', 'file'].includes(field.type)) continue;
   if (values[field.id] !== undefined) answers[field.id] = values[field.id];
  }
  const payload = JSON.stringify({ answers, page: window.location.pathname, elapsed: Date.now() - opened, trap: trap.value, token });
  if (!files.size) return { body: payload, headers: { 'content-type': 'application/json' } };
  const data = new FormData();
  data.set('payload', payload);
  for (const [id, file] of files) data.set(`file:${id}`, file);
  return { body: data, headers: {} };
 }

 async function send(token = '') {
  const res = await fetch(`/__timbrr/forms/${encodeURIComponent(props.form.id)}`, { method: 'POST', ...body(token) });
  const answer = await res.json().catch(() => null);
  if (res.status === 428 && answer?.siteKey && !token) return send(await humanToken(answer.siteKey));
  if (res.status === 422 && answer?.errors) {
   Object.assign(errors, answer.errors);
   const at = steps.value.findIndex((entry) => entry.fields.some((field) => answer.errors[field.id]));
   if (at >= 0) step.value = at;
   return;
  }
  if (!res.ok || !answer?.ok) throw new Error(answer?.message ?? '');
  if (answer.after === 'redirect' && typeof answer.to === 'string' && answer.to.startsWith('/') && !answer.to.startsWith('//')) {
   await navigateTo(answer.to);
   return;
  }
  sent.value = answer.message ?? { type: 'doc', content: [] };
 }

 async function submit() {
  if (props.locked || sending.value || !checkStep()) return;
  sending.value = true;
  failed.value = '';
  try {
   await send();
  } catch (error) {
   failed.value = error.message || "Couldn't send that. Try again in a minute.";
  } finally {
   sending.value = false;
  }
 }

 // A link can fill fields in (?guests=40), and hidden ones only ever fill in
 // this way.
 onMounted(() => {
  opened = Date.now();
  if (props.locked) return;
  const query = new URLSearchParams(window.location.search);
  for (const field of props.form.fields) {
   const value = field.param ? query.get(field.param) : null;
   if (value !== null) values[field.id] = value.slice(0, 200);
  }
 });
</script>

<template>
 <div ref="root" class="tb-form__body" :class="{ 'tb-form__body--compact': compact }" :inert="locked">
  <div v-if="sent" class="tb-form__sent" role="status"><TbRich :doc="sent" /></div>
  <form v-else novalidate @submit.prevent="last ? submit() : next()">
   <template v-if="!compact">
    <h2 v-if="title" class="tb-heading tb-form__title">{{ title }}</h2>
    <p v-if="form.intro" class="tb-form__lede">{{ form.intro }}</p>
   </template>

   <div v-if="steps.length > 1" class="tb-form__progress">
    <div class="tb-form__bars" aria-hidden="true">
     <span v-for="(entry, index) in steps" :key="index" class="tb-form__bar" :class="{ 'is-done': index <= current }" />
    </div>
    <p class="tb-form__step">Step {{ current + 1 }} of {{ steps.length }} · {{ steps[current].title }}</p>
   </div>

   <div class="tb-form__grid">
    <div v-for="field in shown" :key="field.id" class="tb-form__field" :style="{ '--tb-form-span': span(field) }">
     <template v-if="field.type === 'consent'">
      <label class="tb-form__consent-row">
       <input v-model="values[field.id]" type="checkbox" class="tb-form__tick" :aria-invalid="Boolean(errors[field.id])" @change="clear(field)" />
       <span>{{ field.label }}</span>
      </label>
     </template>

     <fieldset v-else-if="field.type === 'radio' || field.type === 'checkbox'" class="tb-form__set">
      <legend class="tb-form__label">
       {{ field.label }}<span v-if="!field.required" class="tb-form__optional">Optional</span>
      </legend>
      <div class="tb-form__options">
       <label v-for="option in field.options" :key="option.l" class="tb-form__option" :class="{ 'is-on': field.type === 'radio' ? values[field.id] === option.l : (values[field.id] ?? []).includes(option.l) }">
        <input
         :type="field.type"
         :name="fieldId(field)"
         :value="option.l"
         :checked="field.type === 'radio' ? values[field.id] === option.l : (values[field.id] ?? []).includes(option.l)"
         class="tb-form__tick"
         @change="field.type === 'radio' ? ((values[field.id] = option.l), clear(field)) : toggle(field, option.l)"
        />
        <span class="tb-form__option-label">{{ option.l }}</span>
        <span v-if="priced(field, option)" class="tb-form__price">{{ price(field, option) }}</span>
       </label>
      </div>
     </fieldset>

     <template v-else-if="field.type === 'calc'">
      <p class="tb-form__label">{{ field.label }}</p>
      <p class="tb-form__total">{{ formMoney(formCalcValue(form, field, values)) }}</p>
     </template>

     <template v-else>
      <label class="tb-form__label" :for="fieldId(field)">
       {{ field.label }}<span v-if="!field.required" class="tb-form__optional">Optional</span>
      </label>
      <textarea v-if="field.type === 'textarea'" :id="fieldId(field)" v-model="values[field.id]" rows="4" :placeholder="field.placeholder" class="tb-form__control tb-form__long" :aria-invalid="Boolean(errors[field.id])" @input="clear(field)" />
      <div v-else-if="field.type === 'select'" class="tb-form__picker">
       <select :id="fieldId(field)" v-model="values[field.id]" class="tb-form__control" :aria-invalid="Boolean(errors[field.id])" @change="clear(field)">
        <option :value="undefined" disabled>Choose…</option>
        <option v-for="option in field.options" :key="option.l" :value="option.l">{{ option.l }}</option>
       </select>
       <span class="tb-form__arrow" aria-hidden="true">▾</span>
      </div>
      <label v-else-if="field.type === 'file'" class="tb-form__drop">
       <input :id="fieldId(field)" type="file" :accept="accepted(field)" class="tb-form__drop-input" :aria-invalid="Boolean(errors[field.id])" @change="pick(field, $event)" />
       <span class="tb-form__drop-text">{{ values[field.id]?.name ?? 'Choose a file or drop it here' }}</span>
       <span class="tb-form__drop-hint">{{ fileHint(field) }}</span>
      </label>
      <input
       v-else
       :id="fieldId(field)"
       v-model="values[field.id]"
       :type="{ email: 'email', phone: 'tel', number: 'number', date: 'date' }[field.type] ?? 'text'"
       :autocomplete="{ name: 'name', email: 'email', phone: 'tel' }[field.type]"
       :placeholder="field.placeholder"
       class="tb-form__control"
       :aria-invalid="Boolean(errors[field.id])"
       @input="clear(field)"
      />
     </template>

     <p v-if="field.help" class="tb-form__help">{{ field.help }}</p>
     <p v-if="errors[field.id]" class="tb-form__error" role="alert">{{ errors[field.id] }}</p>
    </div>
   </div>

   <input v-model="trap" type="text" name="website_url" tabindex="-1" autocomplete="off" aria-hidden="true" class="tb-form__trap" />
   <div ref="check" />
   <p v-if="failed" class="tb-form__error" role="alert">{{ failed }}</p>

   <div class="tb-form__actions">
    <button v-if="current > 0" type="button" class="tb-button tb-form__back" @click="step = current - 1">Back</button>
    <button type="submit" class="tb-button tb-button--solid tb-form__submit" :disabled="sending">{{ sending ? 'Sending…' : last ? form.button : form.next }}</button>
   </div>
  </form>
 </div>
</template>

<style>
 .tb-form__inner {
  max-width: 680px;
  overflow-wrap: break-word;
 }

 .tb-form__body {
  min-width: 0;
 }

 .tb-form__title {
  margin: 0;
 }

 .tb-form__lede {
  margin: 10px 0 0;
  font-size: clamp(16px, 0.4vw + 14px, 17px);
  line-height: 1.6;
  color: var(--site-body);
  white-space: pre-line;
 }

 .tb-form__progress {
  margin-top: 22px;
 }

 .tb-form__bars {
  display: flex;
  gap: 5px;
 }

 .tb-form__bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--site-border);
 }

 .tb-form__bar.is-done {
  background: var(--site-accent);
 }

 .tb-form__step {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--site-muted);
 }

 .tb-form__grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 18px 14px;
  margin-top: 24px;
 }

 .tb-form__body--compact .tb-form__grid {
  margin-top: 0;
  gap: 10px;
 }

 .tb-form__field {
  grid-column: span var(--tb-form-span, 12);
  min-width: 0;
 }

 .tb-form__set {
  margin: 0;
  border: 0;
  padding: 0;
  min-width: 0;
 }

 .tb-form__label {
  display: block;
  margin: 0 0 6px;
  padding: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--site-heading);
 }

 .tb-form__optional {
  margin-left: 7px;
  font-size: 13px;
  font-weight: 400;
  color: var(--site-muted);
 }

 /* Quiet boxes with the hint inside; the brand color rings the one being
    typed in. 16px type, so phones don't zoom in. */
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

 .tb-form__control:focus,
 .tb-form__drop:focus-within {
  border-color: var(--site-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--site-accent) 16%, transparent);
  outline: 0;
 }

 .tb-form__control[aria-invalid='true'] {
  border-color: #a2463a;
 }

 .tb-form__long {
  min-height: 104px;
  resize: vertical;
 }

 .tb-form__picker {
  position: relative;
 }

 .tb-form__picker select {
  padding-right: 34px;
  -webkit-appearance: none;
  appearance: none;
 }

 .tb-form__arrow {
  position: absolute;
  top: 50%;
  right: 14px;
  color: var(--site-muted);
  transform: translateY(-50%);
  pointer-events: none;
 }

 .tb-form__options {
  display: grid;
  gap: 8px;
 }

 .tb-form__option {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid color-mix(in srgb, var(--site-muted) 12%, var(--site-border));
  border-radius: 9px;
  padding: 11px 14px;
  background: var(--site-bg);
  font-size: 16px;
  color: var(--site-heading);
  cursor: pointer;
 }

 .tb-form__option.is-on {
  border-color: var(--site-accent);
  background: color-mix(in srgb, var(--site-accent) 7%, var(--site-bg));
 }

 .tb-form__option-label {
  flex: 1;
  min-width: 0;
 }

 .tb-form__price {
  font-size: 14px;
  color: var(--site-muted);
 }

 .tb-form__tick {
  flex: none;
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: var(--site-accent);
 }

 .tb-form__consent-row {
  display: flex;
  gap: 10px;
  font-size: 15px;
  line-height: 1.45;
  color: var(--site-heading);
  cursor: pointer;
 }

 .tb-form__consent-row .tb-form__tick {
  margin-top: 2px;
 }

 .tb-form__drop {
  position: relative;
  display: block;
  border: 1px dashed color-mix(in srgb, var(--site-muted) 40%, var(--site-border));
  border-radius: 9px;
  padding: 14px;
  background: var(--site-bg);
  cursor: pointer;
 }

 .tb-form__drop-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
 }

 .tb-form__drop-text {
  display: block;
  font-weight: 600;
  color: var(--site-heading);
  overflow-wrap: anywhere;
 }

 .tb-form__drop-hint {
  display: block;
  margin-top: 2px;
  font-size: 13px;
  color: var(--site-muted);
 }

 .tb-form__total {
  margin: 0;
  border-radius: 9px;
  padding: 12px 14px;
  background: color-mix(in srgb, var(--site-accent) 8%, var(--site-bg));
  font-size: 26px;
  font-weight: 700;
  color: var(--site-heading);
 }

 .tb-form__help {
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 1.45;
  color: var(--site-muted);
 }

 .tb-form__error {
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 1.45;
  color: #a2463a;
 }

 /* Where only a bot goes. Not display:none, which a good one reads. */
 .tb-form__trap {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
 }

 .tb-form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
 }

 .tb-form__body--compact .tb-form__actions {
  margin-top: 10px;
 }

 .tb-form__submit,
 .tb-form__back {
  margin: 0;
  -webkit-appearance: none;
  appearance: none;
  font-family: inherit;
  text-align: center;
  cursor: pointer;
 }

 .tb-form__submit:disabled {
  opacity: 0.65;
  cursor: progress;
 }

 .tb-form__sent {
  font-size: 16px;
  line-height: 1.6;
  color: var(--site-body);
 }

 /* Phones: everything full width. */
 @media (max-width: 480px) {
  .tb-form__field {
   grid-column: 1 / -1;
  }
 }
</style>
