<script setup>
 // A form as a visitor fills it in (the studio's docs/forms.md): its steps one
 // at a time, its show/hide rules and totals as they answer, and what it says
 // when something's wrong, all from what the studio sent. Sending goes to this
 // site's own /__timbrr/forms/:id. The studio checks it all again and says how it
 // went: taken (a thank-you, or a page to go to), a mistake to show on a field,
 // or that the Human check has to run first. `locked` is the studio's canvas,
 // where it's only a picture; `compact` is a footer's, with no heading or room
 // around it; `hideTitle` leaves the heading out and names the form for screen
 // readers instead. A Form block that holds its own words passes `intro` (the
 // block's, possibly empty) along with `heading`: then what's given is all that
 // draws, and with no heading the form's name is what screen readers get. With
 // `intro` left out, the form's own title and intro draw as they always did.
 //
 // A form with steps keeps what's typed in this browser only (utils/form-keep.js):
 // a band offers to pick up where they left off, and Start again empties it.
 // When the Human check can't load, a Try again button reloads it and Send waits
 // for it. A failed Next or Send puts focus on "N things to fix", which links to
 // each field, and the thank-you takes focus so a screen reader reads it out.
 const props = defineProps({
  form: { type: Object, required: true },
  heading: { type: String, default: '' },
  intro: { type: [String, Object], default: null }, // rich text, or the plain words an older block or the form held
  hideTitle: { type: Boolean, default: false },
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
 const summary = ref(null);
 const thanks = ref(null);
 const canKeep = ref(false); // this browser lets the form keep answers (a multi-step form, storage on)
 const restored = ref(false); // answers came back from this browser, so a file didn't
 const kept = ref(null); // what an earlier visit left here, { at, step, values }, while the band offers it
 const checkFailed = ref(false); // the Human check couldn't load or run: Try again shows, Send waits
 let challengeKey = '';
 let opened = 0;
 let keepTimer = 0;
 let keepAs = '';

 const steps = computed(() => formSteps(props.form));
 const current = computed(() => Math.min(step.value, steps.value.length - 1));
 const last = computed(() => current.value >= steps.value.length - 1);
 const shown = computed(() => steps.value[current.value].fields.filter((field) => field.type !== 'hidden' && formFieldVisible(props.form, field, values)));
 const own = computed(() => props.intro !== null);
 const title = computed(() => (own.value ? props.heading.trim() : props.heading.trim() || props.form.title));
 // The form's own switch (Build > Form) or the block's hides both heading and intro; the block's alone keeps the intro.
 const noHeading = computed(() => (own.value ? !title.value : props.hideTitle || props.form.hideHeader === true));
 const label = computed(() => (own.value ? props.form.title : title.value));
 const lede = computed(() => (own.value ? props.intro : props.form.hideHeader ? '' : props.form.intro));
 const hasLede = computed(() => hasWords(lede.value));
 const span = (field) => (props.form.advanced && !props.compact ? { half: 6, third: 4 }[field.width] ?? 12 : 12);
 const fieldId = (field) => `${uid}-${field.id}`;
 // A field's hint and error, which a screen reader reads with it.
 const describedBy = (field) => [field.help && `${fieldId(field)}-help`, errors[field.id] && `${fieldId(field)}-error`].filter(Boolean).join(' ') || undefined;
 // The browser can fill what it knows (1.3.5): by type, else by what the label asks for.
 function autofill(field) {
  const byType = { name: 'name', email: 'email', phone: 'tel' }[field.type];
  if (byType) return byType;
  const label = String(field.label ?? '').toLowerCase();
  if (/first name/.test(label)) return 'given-name';
  if (/last name|surname/.test(label)) return 'family-name';
  if (/zip|postal/.test(label)) return 'postal-code';
  if (/street|address/.test(label) && !/email|e-mail/.test(label)) return 'street-address';
  if (/^city\b|\bcity$/.test(label)) return 'address-level2';
  return undefined;
 }
 // After a failed check, focus goes to "N things to fix", which links to each
 // one (every field keeps its own message too). With nothing to list, the first
 // field with a mistake.
 function focusFirstError() {
  nextTick(() => (summary.value ?? root.value?.querySelector('.tb-form__field:has(.tb-form__error) :is(input, select, textarea)'))?.focus());
 }

 // A link in the summary: the field itself (a group of choices, its first).
 function goToField(field) {
  root.value?.querySelector(`[data-form-field="${field.id}"] :is(input, select, textarea)`)?.focus();
 }

 // ── Kept answers ──
 const storage = () => {
  try {
   return window.localStorage;
  } catch {
   return null;
  }
 };

 // Debounced, and only from what the visitor does: restoring isn't saving, so
 // looking at an old copy doesn't make it a week younger.
 function remember() {
  if (!multi.value || !keepAs) return;
  clearTimeout(keepTimer);
  keepTimer = setTimeout(() => {
   const held = keepable(props.form, values);
   try {
    if (Object.keys(held).length) storage()?.setItem(keepAs, JSON.stringify({ at: Date.now(), step: current.value, values: held }));
    else storage()?.removeItem(keepAs);
   } catch {
    // Full or blocked: nothing is kept, and nothing else breaks.
   }
  }, 400);
 }

 function forget() {
  clearTimeout(keepTimer);
  try {
   if (keepAs) storage()?.removeItem(keepAs);
  } catch {
   // Nothing to forget.
  }
 }

 function pickUp() {
  step.value = Math.min(kept.value.step, steps.value.length - 1);
  kept.value = null;
  nextTick(() => root.value?.scrollIntoView?.({ block: 'nearest' }));
 }

 function startAgain() {
  for (const key of Object.keys(values)) delete values[key];
  for (const key of Object.keys(errors)) delete errors[key];
  files.clear();
  step.value = 0;
  kept.value = null;
  restored.value = false;
  forget();
 }
 const priced = (field, option) => props.form.advanced && Number(option.v) > 0;
 const timesGuests = (field) => props.form.fields.some((entry) => entry.type === 'calc' && entry.terms?.some((term) => term.field === field.id && term.op === '×'));
 const price = (field, option) => `${field.type === 'checkbox' ? '+' : ''}${formMoney(option.v)}${field.type === 'radio' && timesGuests(field) ? ' each' : ''}`;
 const accepted = (field) => (field.files?.types ?? []).map((kind) => ({ JPG: '.jpg,.jpeg', HEIC: '.heic,.heif' })[kind] ?? `.${kind.toLowerCase()}`).join(',');
 // "up to 10 MB, JPG or PNG", from the field's own limits, before anything is chosen.
 const fileHint = (field) => {
  const types = field.files?.types ?? [];
  const named = types.length > 1 ? `${types.slice(0, -1).join(', ')} or ${types.at(-1)}` : types[0];
  return [`up to ${field.files?.max ?? 10} MB`, named].filter(Boolean).join(', ');
 };
 const photos = (field) => (field.files?.types ?? []).length > 0 && field.files.types.every((kind) => ['JPG', 'PNG', 'GIF', 'WEBP', 'HEIC'].includes(kind));
 const multi = computed(() => steps.value.length > 1 && !props.locked && !props.compact);

 // The fields on this step that still have a mistake, for "N things to fix".
 const problems = computed(() => shown.value.filter((field) => errors[field.id]));

 function clear(field) {
  delete errors[field.id];
  failed.value = '';
  remember();
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
  if (!checkStep()) return focusFirstError();
  step.value = current.value + 1;
  kept.value = null;
  remember();
  nextTick(() => root.value?.scrollIntoView?.({ block: 'nearest' }));
 }

 function back() {
  step.value = current.value - 1;
  remember();
 }

 // The Human check not loading or not running isn't a mistake in the form: Try
 // again, and Send waits (checkFailed).
 class CheckError extends Error {}
 const LOAD_WAIT = 12000;

 function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise((resolve, reject) => {
   const script = document.createElement('script');
   script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
   script.async = true;
   const fail = () => {
    clearTimeout(timer);
    script.remove(); // a retry loads it afresh
    reject(new CheckError("Couldn't load the check."));
   };
   const timer = setTimeout(fail, LOAD_WAIT);
   script.onload = () => {
    clearTimeout(timer);
    window.turnstile ? resolve(window.turnstile) : fail();
   };
   script.onerror = fail;
   document.head.append(script);
  });
 }

 // The Human check, which usually needs nothing from anyone.
 async function humanToken(siteKey) {
  const turnstile = await loadTurnstile();
  return new Promise((resolve, reject) => {
   check.value.textContent = '';
   turnstile.render(check.value, { sitekey: siteKey, callback: resolve, 'error-callback': () => reject(new CheckError('The check failed.')), 'timeout-callback': () => reject(new CheckError('The check ran out of time.')) });
  });
 }

 function body(token) {
  const answers = {};
  for (const field of props.form.fields) {
   if (['page', 'calc', 'file'].includes(field.type)) continue;
   if (values[field.id] !== undefined) answers[field.id] = values[field.id];
  }
  // `ticket` came with the form and goes back as it came: the studio signed it,
  // and reads how long this took from it. `elapsed` is for a studio from before
  // tickets.
  const payload = JSON.stringify({ answers, page: window.location.pathname, ticket: props.form.ticket, elapsed: Date.now() - opened, trap: trap.value, token });
  if (!files.size) return { body: payload, headers: { 'content-type': 'application/json' } };
  const data = new FormData();
  data.set('payload', payload);
  for (const [id, file] of files) data.set(`file:${id}`, file);
  return { body: data, headers: {} };
 }

 async function send(token = '') {
  const res = await fetch(`/__timbrr/forms/${encodeURIComponent(props.form.id)}`, { method: 'POST', ...body(token) });
  const answer = await res.json().catch(() => null);
  if (res.status === 428 && answer?.siteKey && !token) {
   challengeKey = answer.siteKey;
   return send(await humanToken(answer.siteKey));
  }
  if (res.status === 422 && answer?.errors) {
   Object.assign(errors, answer.errors);
   const at = steps.value.findIndex((entry) => entry.fields.some((field) => answer.errors[field.id]));
   if (at >= 0) step.value = at;
   focusFirstError();
   return;
  }
  // An edge in front of the site can refuse with a page, not JSON, so the status still says what to do.
  if (!res.ok || !answer?.ok) throw new Error(answer?.message ?? { 413: 'That is too much to send in one go. Use smaller files or shorter answers.', 429: 'Lots of sends right now. Try again in a minute.' }[res.status] ?? '');
  if (answer.after === 'redirect' && typeof answer.to === 'string' && answer.to.startsWith('/') && !answer.to.startsWith('//')) {
   timbrrEvent('form_sent');
   forget();
   await navigateTo(answer.to);
   return;
  }
  timbrrEvent('form_sent');
  forget();
  sent.value = answer.message ?? { type: 'doc', content: [] };
  // The thank-you takes focus, so a screen reader reads it out instead of the page staying silent.
  await nextTick();
  thanks.value?.focus();
 }

 // One run of the send, from Send or from Try again: a check that can't run is
 // Try again's to fix; anything else is said where the Send button is.
 async function run(work) {
  if (props.locked || sending.value) return;
  sending.value = true;
  failed.value = '';
  checkFailed.value = false;
  try {
   await work();
  } catch (error) {
   if (error instanceof CheckError) {
    checkFailed.value = true;
    nextTick(() => root.value?.querySelector('.tb-form__retry')?.focus());
   } else failed.value = error.message || "Couldn't send that. Try again in a minute.";
  } finally {
   sending.value = false;
  }
 }

 function submit() {
  if (props.locked || sending.value) return;
  if (!checkStep()) return focusFirstError();
  return run(() => send());
 }

 // Reload the check, and carry on with the send it was holding up.
 const retryCheck = () => run(async () => send(await humanToken(challengeKey)));

 // A link can fill fields in (?guests=40), and hidden ones only ever fill in
 // this way.
 onMounted(() => {
  opened = Date.now();
  if (props.locked) return;
  if (multi.value && storage()) {
   keepAs = keepKey(window.location.host, props.form);
   canKeep.value = true;
   sweepKept(storage());
   const raw = storage().getItem(keepAs);
   const found = raw ? readKept(raw, props.form, steps.value.length) : null;
   if (found) {
    Object.assign(values, found.values);
    kept.value = found;
    restored.value = true;
   } else if (raw) forget();
  }
  const query = new URLSearchParams(window.location.search);
  for (const field of props.form.fields) {
   const value = field.param ? query.get(field.param) : null;
   if (value !== null) values[field.id] = value.slice(0, 200);
  }
 });
</script>

<template>
 <div ref="root" class="tb-form__body" :class="{ 'tb-form__body--compact': compact, 'tb-form__body--untitled': noHeading }" :inert="locked">
  <div role="status"><div v-if="sent" ref="thanks" tabindex="-1" class="tb-form__sent"><TbRich :doc="sent" /></div></div>
  <form v-if="!sent" novalidate :aria-label="noHeading ? label : undefined" @submit.prevent="last ? submit() : next()">
   <div v-if="kept" class="tb-form__kept">
    <div class="tb-form__kept-text">
     <p class="tb-form__kept-title">We kept your answers from {{ keptWhen(kept.at) }}.</p>
     <p class="tb-form__kept-note">Saved in this browser only. They are cleared when you send.</p>
    </div>
    <div class="tb-form__kept-actions">
     <button v-if="kept.step > 0" type="button" class="tb-button tb-button--solid" @click="pickUp">Pick up at step {{ kept.step + 1 }}</button>
     <button type="button" class="tb-form__link" @click="startAgain">Start again</button>
    </div>
   </div>
   <template v-if="!compact">
    <h2 v-if="title && !noHeading" class="tb-heading tb-form__title">{{ title }}</h2>
    <TbRich v-if="hasLede" :doc="lede" class="tb-form__lede" />
   </template>

   <div v-if="steps.length > 1" class="tb-form__progress">
    <div class="tb-form__bars" aria-hidden="true">
     <span v-for="(entry, index) in steps" :key="index" class="tb-form__bar" :class="{ 'is-done': index <= current }" />
    </div>
    <p class="tb-form__step" role="status">Step {{ current + 1 }} of {{ steps.length }} · {{ steps[current].title }}</p>
   </div>

   <section v-if="problems.length" ref="summary" tabindex="-1" class="tb-form__summary" :aria-labelledby="`${uid}-fix`">
    <p :id="`${uid}-fix`" class="tb-form__summary-title">{{ problems.length }} {{ problems.length === 1 ? 'thing' : 'things' }} to fix</p>
    <ul>
     <li v-for="field in problems" :key="field.id"><a :href="`#${fieldId(field)}`" @click.prevent="goToField(field)">{{ field.label }}</a></li>
    </ul>
   </section>

   <div class="tb-form__grid">
    <div v-for="field in shown" :key="field.id" class="tb-form__field" :data-form-field="field.id" :style="{ '--tb-form-span': span(field) }">
     <template v-if="field.type === 'consent'">
      <label class="tb-form__consent-row">
       <input v-model="values[field.id]" type="checkbox" class="tb-form__tick" :aria-required="field.required || undefined" :aria-invalid="Boolean(errors[field.id])" :aria-describedby="describedBy(field)" @change="clear(field)" />
       <span>{{ field.label }}</span>
      </label>
     </template>

     <fieldset v-else-if="field.type === 'radio' || field.type === 'checkbox'" class="tb-form__set" :aria-describedby="describedBy(field)">
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
      <textarea v-if="field.type === 'textarea'" :id="fieldId(field)" v-model="values[field.id]" rows="4" :placeholder="field.placeholder" class="tb-form__control tb-form__long" :aria-required="field.required || undefined" :aria-invalid="Boolean(errors[field.id])" :aria-describedby="describedBy(field)" @input="clear(field)" />
      <div v-else-if="field.type === 'select'" class="tb-form__picker">
       <select :id="fieldId(field)" v-model="values[field.id]" class="tb-form__control" :aria-required="field.required || undefined" :aria-invalid="Boolean(errors[field.id])" :aria-describedby="describedBy(field)" @change="clear(field)">
        <option :value="undefined" disabled>Choose…</option>
        <option v-for="option in field.options" :key="option.l" :value="option.l">{{ option.l }}</option>
       </select>
       <span class="tb-form__arrow" aria-hidden="true">▾</span>
      </div>
      <label v-else-if="field.type === 'file'" class="tb-form__drop">
       <input :id="fieldId(field)" type="file" :accept="accepted(field)" class="tb-form__drop-input" :aria-required="field.required || undefined" :aria-invalid="Boolean(errors[field.id])" :aria-describedby="describedBy(field)" @change="pick(field, $event)" />
       <span class="tb-form__drop-text">{{ values[field.id]?.name ?? (photos(field) ? 'Add a photo' : 'Add a file') }}</span>
       <span class="tb-form__drop-hint">{{ fileHint(field) }}</span>
      </label>
      <input
       v-else
       :id="fieldId(field)"
       v-model="values[field.id]"
       :type="{ email: 'email', phone: 'tel', number: 'number', date: 'date' }[field.type] ?? 'text'"
       :autocomplete="autofill(field)"
       :placeholder="field.placeholder"
       class="tb-form__control"
       :aria-required="field.required || undefined"
       :aria-invalid="Boolean(errors[field.id])"
       :aria-describedby="describedBy(field)"
       @input="clear(field)"
      />
     </template>

     <p v-if="field.help" :id="`${fieldId(field)}-help`" class="tb-form__help">{{ field.help }}</p>
     <p v-if="field.type === 'file' && restored && !values[field.id]" class="tb-form__help">{{ photos(field) ? "Photos can't" : "Files can't" }} be kept in this browser. Add it again if you'd like to send one.</p>
     <p v-if="errors[field.id]" :id="`${fieldId(field)}-error`" class="tb-form__error" role="alert">{{ errors[field.id] }}</p>
    </div>
   </div>

   <input v-model="trap" type="text" name="website_url" tabindex="-1" autocomplete="off" inert class="tb-form__trap" />
   <div ref="check" />
   <div v-if="checkFailed" class="tb-form__check">
    <p class="tb-form__label">Quick check</p>
    <p class="tb-form__error" role="alert">We couldn't load a quick check.</p>
    <button type="button" class="tb-button tb-form__retry" :disabled="sending" @click="retryCheck">Try again</button>
   </div>
   <p v-if="failed" class="tb-form__error" role="alert">{{ failed }}</p>

   <div class="tb-form__actions">
    <button v-if="current > 0" type="button" class="tb-button tb-form__back" @click="back">Back</button>
    <button type="submit" class="tb-button tb-button--solid tb-form__submit" :disabled="sending || checkFailed" :aria-describedby="checkFailed ? `${uid}-held` : undefined">{{ sending ? 'Sending…' : last ? form.button : form.next }}</button>
   </div>
   <p v-if="checkFailed" :id="`${uid}-held`" class="tb-form__help">Send switches on once the quick check loads. Try again above, or check your connection.</p>
   <p v-if="canKeep" class="tb-form__saved">Your answers are saved in this browser until you send.</p>
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

 .tb-form__body--untitled form > :first-child {
  margin-top: 0;
 }

 .tb-form__lede {
  margin: 10px 0 0;
  font-size: clamp(16px, 0.4vw + 14px, 17px);
  line-height: 1.6;
  color: var(--site-body);
 }

 .tb-form__lede p {
  margin: 0;
 }

 .tb-form__lede p + p {
  margin-top: 0.5em;
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

 .tb-form__body--compact .tb-form__control {
  min-height: 24px;
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

 /* Quiet boxes with the hint inside; the brand color fields the one being
    typed in. 16px type, so phones don't zoom in. */
 .tb-form__control {
  display: block;
  width: 100%;
  min-width: 0;
  margin: 0;
  border: 1px solid var(--site-muted);
  border-radius: var(--site-control-radius);
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
  color: var(--site-muted);
  opacity: 1;
 }

 .tb-form__control:hover {
  border-color: var(--site-body);
 }

 .tb-form__control:focus,
 .tb-form__drop:focus-within {
  border-color: var(--site-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--site-accent) 16%, transparent);
  outline: 2px solid var(--site-accent);
  outline-offset: 2px;
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
  border: 1px solid var(--site-muted);
  border-radius: var(--site-control-radius);
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
  border: 1px dashed var(--site-muted);
  border-radius: var(--site-control-radius);
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
  display: inline;
  font-weight: 600;
  color: var(--site-heading);
  overflow-wrap: anywhere;
 }

 .tb-form__drop-hint {
  display: inline;
  font-size: 13px;
  color: var(--site-muted);
 }

 .tb-form__drop-hint::before {
  content: ' · ';
 }

 .tb-form__total {
  margin: 0;
  border-radius: var(--site-control-radius);
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

 /* The band that offers what an earlier visit left: calm, not an alarm. */
 .tb-form__kept {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 20px;
  margin-bottom: 20px;
  border: 1px solid var(--site-border);
  border-radius: var(--site-control-radius);
  padding: 14px 16px;
  background: color-mix(in srgb, var(--site-accent) 7%, var(--site-bg));
 }

 .tb-form__kept-title {
  margin: 0;
  font-weight: 600;
  color: var(--site-heading);
 }

 .tb-form__kept-note {
  margin: 2px 0 0;
  font-size: 14px;
  color: var(--site-muted);
 }

 .tb-form__kept-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
 }

 .tb-form__link {
  margin: 0;
  border: 0;
  padding: 4px 0;
  background: none;
  font: inherit;
  font-weight: 600;
  color: var(--site-heading);
  text-decoration: underline;
  cursor: pointer;
 }

 /* "N things to fix": the mistakes on this step, each a link to its field. */
 .tb-form__summary {
  margin-top: 20px;
  border-radius: var(--site-control-radius);
  padding: 14px 16px;
  background: color-mix(in srgb, #a2463a 9%, var(--site-bg));
  color: #8a3a30;
 }

 .tb-form__summary:focus {
  outline: 2px solid #a2463a;
  outline-offset: 2px;
 }

 .tb-form__summary-title {
  margin: 0;
  font-weight: 700;
 }

 .tb-form__summary ul {
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
 }

 .tb-form__summary a {
  display: inline-block;
  padding: 4px 0;
  font-weight: 600;
  color: inherit;
  text-decoration: underline;
 }

 /* The Human check that couldn't load: what happened, then the one thing to do. */
 .tb-form__check {
  margin-top: 20px;
 }

 .tb-form__check .tb-form__error {
  margin: 0 0 10px;
  font-weight: 600;
 }

 .tb-form__saved {
  margin: 14px 0 0;
  font-size: 14px;
  color: var(--site-muted);
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

 .tb-form__retry {
  margin: 0;
  font-family: inherit;
  cursor: pointer;
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
