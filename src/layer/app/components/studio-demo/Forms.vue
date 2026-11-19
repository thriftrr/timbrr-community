<script setup>
 // The Forms room, open on the site's "Request a visit" form. Build: the
 // kinds of field on the left, the form as a visitor sees it in the middle,
 // the picked field's settings on the right. Answers: what people sent.
 // Notifications: who gets an email when a new answer comes in.
 import { FORM, FORM_ANSWER_MORE, FORM_KINDS, FORM_NOTIFY, FORM_STARTS } from '../../utils/studio-demo/sample.js';
 import { themeStyle } from '../../utils/studio-demo/theme.js';

 const demo = inject('studioDemo');
 const copy = (value) => JSON.parse(JSON.stringify(value));

 const tab = ref('build');
 const TABS = [
  ['build', 'Build'],
  ['answers', 'Answers'],
  ['notify', 'Notifications'],
 ];
 // The top bar says where in the form you are, past Build.
 watch(
  tab,
  (next) => (demo.crumb.value = next === 'build' ? null : ['Forms', FORM.name, TABS.find(([key]) => key === next)[1]]),
  { immediate: true },
 );
 onBeforeUnmount(() => (demo.crumb.value = null));

 const status = ref('saved');
 let saving;
 function touch() {
  status.value = 'saving';
  clearTimeout(saving);
  saving = setTimeout(() => (status.value = 'saved'), 700);
 }
 onBeforeUnmount(() => clearTimeout(saving));

 function publish() {
  demo.toast('Publishing is off in the demo. On your own site, the new form goes live on every page that shows it.', { link: true });
 }

 /* ── Build ── */
 const KIND = Object.fromEntries(FORM_KINDS.map((entry) => [entry.kind, entry]));
 const HAS_OPTIONS = ['select', 'radio', 'checkbox'];
 const fields = ref(copy(FORM.fields));
 const selected = ref(fields.value[0].id);
 const field = computed(() => fields.value.find((entry) => entry.id === selected.value) ?? null);
 const at = computed(() => fields.value.findIndex((entry) => entry.id === selected.value));
 const fresh = ref(null);
 // At a phone's width one pane shows at a time.
 const buildPane = ref('form');
 const sheet = ref(null);

 let uid = 0;
 function add(kind) {
  const start = FORM_STARTS[kind];
  const next = { id: `n${++uid}`, kind, label: start.label, help: '', required: false, width: start.width, ...(start.options ? { options: [...start.options] } : {}) };
  const after = field.value;
  fields.value.splice(at.value < 0 ? fields.value.length : at.value + 1, 0, next);
  selected.value = next.id;
  fresh.value = next.id;
  buildPane.value = 'form';
  touch();
  demo.toast(after ? `${KIND[kind].label} added after “${after.label || 'Untitled'}”. Its settings are on the right.` : `${KIND[kind].label} added. Its settings are on the right.`);
  nextTick(() => sheet.value?.querySelector(`[data-field="${next.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
 }

 function move(step) {
  const from = at.value;
  const to = from + step;
  if (from < 0 || to < 0 || to >= fields.value.length) return;
  const [entry] = fields.value.splice(from, 1);
  fields.value.splice(to, 0, entry);
  touch();
 }

 function remove() {
  const from = at.value;
  if (from < 0) return;
  const [gone] = fields.value.splice(from, 1);
  selected.value = (fields.value[from] ?? fields.value[from - 1])?.id ?? null;
  touch();
  demo.toast(`“${gone.label || 'Untitled'}” removed. Start over brings it back.`);
 }

 function addOption() {
  field.value.options.push(`Choice ${field.value.options.length + 1}`);
  touch();
 }

 function removeOption(index) {
  field.value.options.splice(index, 1);
  touch();
 }

 /* ── Answers ── */
 const answers = ref(copy(FORM.answers).map((entry) => ({ ...entry, ...FORM_ANSWER_MORE[entry.id], status: entry.new ? 'new' : 'replied' })));
 const newCount = computed(() => answers.value.filter((entry) => entry.status === 'new').length);
 const picked = ref(answers.value[0].id);
 const answer = computed(() => answers.value.find((entry) => entry.id === picked.value));
 const answerPane = ref('list');
 // Answers keep the form as it was when they came in, so a field renamed
 // in Build doesn't rename what people already sent.
 const ANSWER_ROWS = [
  ['f1', 'name'],
  ['f2', 'phone'],
  ['f3', 'email'],
  ['f4', 'fixing'],
  ['f5', 'day'],
  ['f6', 'found'],
 ].map(([id, key]) => [FORM.fields.find((entry) => entry.id === id).label, key]);
 const STATUS = { new: 'New', replied: 'Replied', done: 'Done' };

 function pick(id) {
  picked.value = id;
  answerPane.value = 'answer';
 }

 function mark(next) {
  answer.value.status = next;
  demo.toast(next === 'new' ? 'Back to New.' : `Marked as ${STATUS[next].toLowerCase()}. Only your team sees this.`);
 }

 function reply() {
  const who = answer.value.name.split(' ')[0];
  demo.toast(answer.value.email ? `Email is off in the demo. On your site, this opens a reply to ${who} with the answer quoted.` : `${who} left no email. Call ${answer.value.phone} instead.`);
 }

 /* ── Notifications ── */
 const notify = ref(copy(FORM_NOTIFY));
 const address = ref('');
 const error = ref('');
 const copyVisitor = ref(true);

 function addAddress() {
  const value = address.value.trim().toLowerCase();
  if (!value) error.value = 'Type an email address first.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) error.value = 'That doesn’t look like an email address. It needs an @ and a domain, like name@okaforplumbing.com.';
  else if (notify.value.some((entry) => entry.email === value)) error.value = 'That address already gets told.';
  else {
   notify.value.push({ email: value, when: 'Every new answer' });
   address.value = '';
   error.value = '';
   demo.toast(`Added. On your site, ${value} gets an email for every new answer.`);
  }
 }

 function removeAddress(index) {
  const [gone] = notify.value.splice(index, 1);
  demo.toast(`${gone.email} won’t be told any more.`);
 }

 function test(email) {
  demo.toast(`Email is off in the demo. On your site, a test answer goes to ${email}.`);
 }
</script>

<template>
 <div class="fo" :data-tab="tab" :data-build="buildPane" :data-answers="answerPane">
  <div class="fo-bar">
   <h2 class="sd-title fo-title">{{ FORM.name }}</h2>
   <div class="fo-tabs" role="tablist" aria-label="Form">
    <button v-for="[key, name] in TABS" :id="`fo-tab-${key}`" :key="key" type="button" role="tab" :aria-selected="tab === key" :aria-controls="`fo-panel-${key}`" @click="tab = key">
     {{ name }}
     <span v-if="key === 'answers' && newCount" class="sd-badge sd-badge--live">{{ newCount }} new</span>
    </button>
   </div>
   <!-- A phone has no room for tabs and the pane switch, so the tabs fold into this. -->
   <select class="sd-input fo-pick" aria-label="Form" :value="tab" @change="tab = $event.target.value">
    <option v-for="[key, name] in TABS" :key="key" :value="key">{{ name }}{{ key === 'answers' && newCount ? ` (${newCount} new)` : '' }}</option>
   </select>
   <div v-if="tab === 'build'" class="sd-seg fo-panes" aria-label="Show">
    <button type="button" :aria-pressed="buildPane === 'fields'" @click="buildPane = 'fields'">List</button>
    <button type="button" :aria-pressed="buildPane === 'form'" @click="buildPane = 'form'">Preview</button>
    <button type="button" :aria-pressed="buildPane === 'settings'" :disabled="!field" @click="buildPane = 'settings'">Edit</button>
   </div>
   <div v-else-if="tab === 'answers'" class="sd-seg fo-panes" aria-label="Show">
    <button type="button" :aria-pressed="answerPane === 'list'" @click="answerPane = 'list'">List</button>
    <button type="button" :aria-pressed="answerPane === 'answer'" @click="answerPane = 'answer'">Edit</button>
   </div>
   <span v-if="tab === 'build'" class="fo-status" role="status">{{ status === 'saving' ? 'Saving draft…' : 'Draft saved' }}</span>
   <button type="button" class="sd-btn sd-btn--primary" @click="publish">Publish</button>
  </div>

  <!-- Build -->
  <div v-if="tab === 'build'" id="fo-panel-build" class="fo-view" role="tabpanel" aria-labelledby="fo-tab-build">
   <div class="fo-build">
    <aside class="fo-kinds" aria-label="Fields">
     <p class="fo-kinds__head sd-caps">{{ FORM_KINDS.length }} field types</p>
     <div class="sd-pane fo-kinds__list">
      <button v-for="entry in FORM_KINDS" :key="entry.kind" type="button" class="fo-row" @click="add(entry.kind)">
       <StudioDemoIcon :name="entry.icon" :size="16" />
       <span class="fo-row__name">{{ entry.label }}</span>
       <span class="fo-row__add" aria-hidden="true">Add</span>
      </button>
     </div>
     <p class="fo-hint">
      <template v-if="field">Adds after <b>{{ field.label || 'Untitled' }}</b>.</template>
      <template v-else>Adds at the end of the form.</template>
     </p>
    </aside>

    <main class="fo-canvas sd-pane" aria-label="The form">
     <div class="sd-site fo-page" :style="themeStyle(demo.theme)">
      <div ref="sheet" class="fo-form">
       <h2 class="ss-title">{{ FORM.name }}</h2>
       <p class="ss-lead">{{ FORM.intro }}</p>
       <div class="fo-grid">
        <div
         v-for="entry in fields"
         :key="entry.id"
         class="fo-field"
         :class="{ 'is-half': entry.width === 'half', 'is-selected': entry.id === selected, 'is-fresh': entry.id === fresh }"
         :data-field="entry.id"
         tabindex="0"
         role="button"
         :aria-pressed="entry.id === selected"
         :aria-label="`${entry.label || 'Untitled'}, ${KIND[entry.kind].label.toLowerCase()} field${entry.required ? ', required' : ''}`"
         @click="selected = entry.id"
         @keydown.enter.self.prevent="selected = entry.id"
         @keydown.space.self.prevent="selected = entry.id"
         @animationend="fresh = null"
        >
         <span v-if="entry.kind === 'consent'" class="fo-choice"><span class="fo-tick" aria-hidden="true" />{{ entry.label || 'Untitled' }}<span v-if="entry.required" class="fo-star" aria-hidden="true">*</span></span>
         <template v-else>
          <span class="fo-label" :class="{ 'is-empty': !entry.label }">{{ entry.label || 'Untitled' }}<span v-if="entry.required" class="fo-star" aria-hidden="true">*</span></span>
          <span v-if="entry.kind === 'textarea'" class="fo-box fo-box--tall" aria-hidden="true" />
          <span v-else-if="entry.kind === 'select'" class="fo-box" aria-hidden="true"><span class="fo-box__hint">Choose one</span><StudioDemoIcon name="chevron-down" :size="16" /></span>
          <span v-else-if="entry.kind === 'date'" class="fo-box" aria-hidden="true"><span class="fo-box__hint">mm/dd/yyyy</span><StudioDemoIcon name="form-date" :size="16" /></span>
          <span v-else-if="entry.kind === 'radio' || entry.kind === 'checkbox'" class="fo-choices" aria-hidden="true">
           <span v-for="(option, index) in entry.options" :key="index" class="fo-choice"><span :class="entry.kind === 'radio' ? 'fo-dot' : 'fo-tick'" />{{ option }}</span>
          </span>
          <span v-else class="fo-box" aria-hidden="true" />
         </template>
         <span v-if="entry.help" class="fo-note">{{ entry.help }}</span>
        </div>
       </div>
       <p v-if="!fields.length" class="fo-empty">This form has no fields. Add one from the list.</p>
       <div class="fo-send">
        <span class="ss-button">{{ FORM.button }}</span>
        <span class="fo-note"><span class="fo-star" aria-hidden="true">*</span> Required</span>
       </div>
      </div>
     </div>
    </main>

    <aside class="fo-inspector" aria-label="Field settings">
     <p class="fo-inspector__bar sd-caps">Field</p>
     <template v-if="field">
      <div class="fo-head">
       <span class="fo-head__icon" aria-hidden="true"><StudioDemoIcon :name="KIND[field.kind].icon" :size="18" /></span>
       <div class="fo-head__name">
        <p class="fo-head__title">{{ field.label || 'Untitled' }}</p>
        <p class="fo-head__kind">{{ KIND[field.kind].label }}, {{ field.required ? 'required' : 'optional' }}</p>
       </div>
       <button type="button" class="sd-btn sd-btn--ghost sd-btn--icon sd-btn--danger" :aria-label="`Remove ${field.label || 'this field'}`" title="Remove" @click="remove"><StudioDemoIcon name="trash" :size="15" /></button>
      </div>
      <div class="sd-pane fo-inspector__body">
       <section class="fo-sec">
        <div class="sd-field">
         <label class="sd-label" :for="`fo-${field.id}-label`">Label</label>
         <input :id="`fo-${field.id}-label`" v-model="field.label" class="sd-input" :aria-invalid="!field.label.trim()" :aria-describedby="field.label.trim() ? undefined : `fo-${field.id}-label-error`" @input="touch" />
         <p v-if="!field.label.trim()" :id="`fo-${field.id}-label-error`" class="fo-error">A field needs a label, so people know what to put in it.</p>
        </div>
        <div class="sd-field">
         <label class="sd-label" :for="`fo-${field.id}-help`">Help text</label>
         <input :id="`fo-${field.id}-help`" v-model="field.help" class="sd-input" placeholder="Shown under the field" @input="touch" />
        </div>
       </section>
       <div class="fo-line">
        <span :id="`fo-${field.id}-req`" class="fo-line__name">Required</span>
        <button type="button" class="sd-switch" role="switch" :aria-checked="field.required" :aria-labelledby="`fo-${field.id}-req`" @click="(field.required = !field.required), touch()" />
       </div>
       <div class="fo-line">
        <span :id="`fo-${field.id}-width`" class="fo-line__name">Width</span>
        <div class="sd-seg fo-width" role="group" :aria-labelledby="`fo-${field.id}-width`">
         <button type="button" :aria-pressed="field.width === 'full'" @click="(field.width = 'full'), touch()">Full</button>
         <button type="button" :aria-pressed="field.width === 'half'" @click="(field.width = 'half'), touch()">Half</button>
        </div>
       </div>
       <section v-if="HAS_OPTIONS.includes(field.kind)" class="fo-sec">
        <p class="sd-label">Options</p>
        <ul class="fo-options">
         <li v-for="(option, index) in field.options" :key="index">
          <input v-model="field.options[index]" class="sd-input" :aria-label="`Option ${index + 1}`" @input="touch" />
          <button type="button" class="sd-btn sd-btn--ghost sd-btn--icon" :disabled="field.options.length < 2" :aria-label="`Remove ${option || `option ${index + 1}`}`" @click="removeOption(index)"><StudioDemoIcon name="x" :size="14" /></button>
         </li>
        </ul>
        <button v-if="field.options.length < 8" type="button" class="sd-btn fo-wide" @click="addOption"><StudioDemoIcon name="plus" :size="14" />Add an option</button>
       </section>
      </div>
      <div class="fo-moves">
       <button type="button" class="sd-btn" :disabled="at === 0" @click="move(-1)"><StudioDemoIcon name="arrow-up" :size="14" />Move up</button>
       <button type="button" class="sd-btn" :disabled="at === fields.length - 1" @click="move(1)"><StudioDemoIcon name="arrow-down" :size="14" />Move down</button>
      </div>
     </template>
     <div v-else class="fo-nothing">
      <p class="fo-head__title">{{ FORM.name }}</p>
      <p>Click a field on the form to change it, or add one from the list.</p>
     </div>
    </aside>
   </div>
  </div>

  <!-- Answers -->
  <div v-else-if="tab === 'answers'" id="fo-panel-answers" class="fo-view" role="tabpanel" aria-labelledby="fo-tab-answers">
   <div class="fo-answers">
    <div class="fo-list sd-pane" aria-label="Answers">
     <p class="fo-list__head sd-caps">{{ answers.length }} answers · {{ newCount }} new</p>
     <ul>
      <li v-for="entry in answers" :key="entry.id">
       <button type="button" class="fo-answer" :class="{ 'is-new': entry.status === 'new' }" :aria-pressed="entry.id === picked" @click="pick(entry.id)">
        <span class="fo-answer__top">
         <b>{{ entry.name }}</b>
         <span class="sd-badge" :class="{ 'sd-badge--live': entry.status === 'new' }">{{ STATUS[entry.status] }}</span>
        </span>
        <span class="fo-answer__line">{{ entry.fixing }}</span>
        <span class="fo-answer__when">{{ entry.when }}</span>
       </button>
      </li>
     </ul>
    </div>
    <article class="fo-detail sd-pane" :aria-label="`Answer from ${answer.name}`">
     <header class="fo-detail__head">
      <div>
       <h3 class="sd-title">{{ answer.name }}</h3>
       <p class="fo-detail__when">{{ answer.when }} · sent from the Contact page</p>
      </div>
      <span class="sd-badge" :class="{ 'sd-badge--live': answer.status === 'new' }" role="status">{{ STATUS[answer.status] }}</span>
     </header>
     <div class="fo-detail__acts">
      <button type="button" class="sd-btn sd-btn--primary" @click="reply"><StudioDemoIcon name="mail" :size="14" />Reply by email</button>
      <button v-if="answer.status !== 'replied'" type="button" class="sd-btn" @click="mark('replied')"><StudioDemoIcon name="check" :size="14" />Mark as replied</button>
      <button v-if="answer.status !== 'done'" type="button" class="sd-btn" @click="mark('done')">Done</button>
      <button v-if="answer.status !== 'new'" type="button" class="sd-btn sd-btn--ghost" @click="mark('new')">Mark as new</button>
     </div>
     <dl class="fo-values">
      <div v-for="[name, key] in ANSWER_ROWS" :key="key">
       <dt>{{ name }}</dt>
       <dd :class="{ 'is-empty': !answer[key] }">{{ answer[key] || 'Not given' }}</dd>
      </div>
     </dl>
    </article>
   </div>
  </div>

  <!-- Notifications -->
  <div v-else id="fo-panel-notify" class="fo-view fo-notify sd-pane" role="tabpanel" aria-labelledby="fo-tab-notify">
   <div class="fo-notify__col">
    <section>
     <h3 class="fo-h">Who gets told</h3>
     <p class="fo-sub">Each new answer is emailed to these addresses. Answers stay in Answers either way.</p>
     <ul class="fo-people">
      <li v-for="(entry, index) in notify" :key="entry.email">
       <span class="fo-people__icon" aria-hidden="true"><StudioDemoIcon name="mail" :size="16" /></span>
       <span class="fo-people__name">
        <b>{{ entry.email }}</b>
        <span>{{ entry.when }}</span>
       </span>
       <button type="button" class="sd-btn sd-btn--ghost" @click="test(entry.email)">Send a test</button>
       <button type="button" class="sd-btn sd-btn--ghost sd-btn--icon" :aria-label="`Stop telling ${entry.email}`" title="Remove" @click="removeAddress(index)"><StudioDemoIcon name="x" :size="15" /></button>
      </li>
      <li v-if="!notify.length" class="fo-people__none">Nobody gets an email. New answers still land in Answers.</li>
     </ul>
     <form class="fo-adder" novalidate @submit.prevent="addAddress">
      <label class="sd-label" for="fo-address">Add an address</label>
      <div class="fo-adder__row">
       <input id="fo-address" v-model="address" type="email" class="sd-input" placeholder="name@okaforplumbing.com" autocomplete="off" :aria-invalid="Boolean(error)" :aria-describedby="error ? 'fo-address-error' : undefined" @input="error = ''" />
       <button type="submit" class="sd-btn"><StudioDemoIcon name="plus" :size="14" />Add</button>
      </div>
      <p v-if="error" id="fo-address-error" class="fo-error" role="alert">{{ error }}</p>
     </form>
    </section>
    <section>
     <h3 class="fo-h">The person who sent it</h3>
     <div class="fo-line fo-line--flush">
      <span class="fo-line__name">
       <span id="fo-copy">Email them a copy of what they sent</span>
       <span class="fo-line__help">Only when they gave an email.</span>
      </span>
      <button type="button" class="sd-switch" role="switch" :aria-checked="copyVisitor" aria-labelledby="fo-copy" @click="copyVisitor = !copyVisitor" />
     </div>
    </section>
   </div>
  </div>
 </div>
</template>

<style>
 .fo {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
 }

 .fo-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  border-bottom: 1px solid var(--sd-border);
  padding: 0 12px 0 16px;
  background: var(--sd-raised);
 }

 .fo-title {
  white-space: nowrap;
 }

 .fo-tabs {
  display: flex;
  align-self: stretch;
  gap: 22px;
  margin-left: 12px;
  margin-right: auto;
 }

 .fo-tabs button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: -1px;
  border: 0;
  border-bottom: 2px solid transparent;
  padding: 0;
  background: none;
  font-size: 14px;
  color: var(--sd-muted);
  white-space: nowrap;
  cursor: pointer;
 }

 .fo-tabs button:hover {
  color: var(--sd-strong);
 }

 .fo-tabs button[aria-selected='true'] {
  border-bottom-color: var(--sd-strong);
  font-weight: 600;
  color: var(--sd-strong);
 }

 .fo-status {
  font: 500 12.5px/1 var(--sd-body);
  color: var(--sd-muted);
 }

 .fo-view {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  min-height: 0;
 }

 /* Only at a phone's width: the tabs as a menu, and the pane switch. */
 .fo .fo-pick,
 .fo .fo-panes {
  display: none;
 }

 /* Build */
 .fo-build {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 296px;
  min-height: 0;
 }

 .fo-kinds {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 0;
  border-right: 1px solid var(--sd-rule);
  background: var(--sd-raised);
 }

 .fo-kinds__head {
  display: flex;
  align-items: center;
  height: 40px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 16px;
 }

 .fo-kinds__list {
  padding: 6px 6px 12px;
 }

 .fo-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 34px;
  border: 0;
  border-radius: 6px;
  padding: 0 8px;
  background: none;
  font-size: 14px;
  text-align: left;
  color: var(--sd-strong);
  cursor: pointer;
 }

 .fo-row:is(:hover, :focus-visible) {
  background: var(--sd-soft);
 }

 .fo-row .sd-icon {
  color: var(--sd-muted);
 }

 .fo-row__name {
  flex: 1;
  min-width: 0;
 }

 .fo-row__add {
  font: 500 12.5px/1 var(--sd-body);
  color: var(--sd-brand);
  opacity: 0;
 }

 .fo-row:is(:hover, :focus-visible) .fo-row__add {
  opacity: 1;
 }

 .fo-hint {
  overflow: hidden;
  border-top: 1px solid var(--sd-rule);
  padding: 11px 14px;
  font-size: 12.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--sd-muted);
 }

 .fo-hint b {
  color: var(--sd-strong);
 }

 .fo-canvas {
  padding: 22px;
  background: var(--sd-sunken);
 }

 .fo-page {
  max-width: 640px;
  margin: 0 auto;
  border-radius: 6px;
 }

 .fo-form {
  padding: 36px 40px 40px;
  font-family: var(--s-body-font);
  color: var(--s-text);
 }

 .fo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 14px;
  margin: 24px -10px 0;
 }

 .fo-field {
  position: relative;
  display: grid;
  grid-column: span 2;
  align-content: start;
  gap: 7px;
  border-radius: 6px;
  padding: 10px;
  cursor: pointer;
 }

 .fo-field.is-half {
  grid-column: span 1;
 }

 .fo-field::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  outline: 2px solid transparent;
  outline-offset: -2px;
  pointer-events: none;
  transition: outline-color 0.16s var(--sd-ease);
 }

 .fo-field:hover::after {
  outline-color: color-mix(in srgb, var(--sd-brand) 38%, transparent);
 }

 .fo-field.is-selected {
  background: color-mix(in srgb, var(--sd-brand) 6%, transparent);
 }

 .fo-field.is-selected::after {
  outline-color: var(--sd-brand);
 }

 .fo-field:focus-visible {
  outline: none;
 }

 .fo-field:focus-visible::after {
  outline: 3px solid var(--sd-brand);
 }

 .fo-field.is-fresh {
  animation: fo-arrive 0.6s var(--sd-ease);
 }

 @keyframes fo-arrive {
  from {
   opacity: 0.3;
   translate: 0 -6px;
  }
  to {
   opacity: 1;
   translate: 0 0;
  }
 }

 .fo-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--s-heading);
 }

 .fo-label.is-empty {
  font-style: italic;
  font-weight: 400;
  color: color-mix(in srgb, var(--s-text) 70%, transparent);
 }

 .fo-star {
  margin-left: 3px;
  color: var(--s-brand);
 }

 .fo-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 42px;
  border: 1px solid color-mix(in srgb, var(--s-heading) 22%, var(--s-paper));
  border-radius: calc(var(--s-corners) * 0.6);
  padding: 0 12px;
  background: #fff;
  color: color-mix(in srgb, var(--s-text) 75%, #fff);
 }

 .fo-box--tall {
  height: 96px;
 }

 .fo-box__hint {
  font-size: 14px;
 }

 .fo-choices {
  display: grid;
  gap: 8px;
 }

 .fo-choice {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--s-text);
 }

 .fo-dot,
 .fo-tick {
  flex: none;
  width: 18px;
  height: 18px;
  border: 1.5px solid color-mix(in srgb, var(--s-heading) 40%, var(--s-paper));
  background: #fff;
 }

 .fo-dot {
  border-radius: 50%;
 }

 .fo-tick {
  border-radius: 4px;
 }

 .fo-note {
  font-size: 12.5px;
  color: color-mix(in srgb, var(--s-text) 85%, var(--s-paper));
 }

 .fo .fo-empty {
  margin-top: 20px;
  border: 1px dashed color-mix(in srgb, var(--s-heading) 25%, var(--s-paper));
  border-radius: 6px;
  padding: 28px 16px;
  font-size: 14px;
  text-align: center;
 }

 .fo-send {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 18px;
 }

 .fo-form .ss-lead {
  margin-top: 10px;
 }

 .fo-send .ss-button {
  margin: 0;
 }

 /* Field settings */
 .fo-inspector {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  min-height: 0;
  border-left: 1px solid var(--sd-rule);
  background: var(--sd-raised);
 }

 .fo-inspector__bar {
  display: flex;
  align-items: center;
  height: 40px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 16px;
 }

 .fo-head {
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 14px 10px 14px 16px;
 }

 .fo-head__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--sd-soft);
  color: var(--sd-strong);
 }

 .fo-head__name {
  flex: 1;
  min-width: 0;
 }

 .fo-head__title {
  overflow: hidden;
  font: 700 17px/1.15 var(--sd-display);
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--sd-strong);
 }

 .fo-head__kind {
  font: 400 13px/1.4 var(--sd-body);
  color: var(--sd-muted);
 }

 .fo-sec {
  border-bottom: 1px solid var(--sd-rule);
  padding: 16px;
 }

 .fo .fo-error {
  margin-top: 6px;
  font-size: 12px;
  color: var(--sd-danger);
 }

 .fo-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 48px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 16px;
 }

 .fo-line__name {
  display: grid;
  gap: 2px;
  font-size: 14px;
  font-weight: 600;
  color: var(--sd-strong);
 }

 .fo-line__help {
  font-size: 12px;
  font-weight: 400;
  color: var(--sd-muted);
 }

 .fo-width {
  width: 140px;
 }

 .fo-width button {
  min-height: 30px;
 }

 .fo-options {
  display: grid;
  gap: 6px;
 }

 .fo-options li {
  display: flex;
  align-items: center;
  gap: 4px;
 }

 .fo-wide {
  width: 100%;
  margin-top: 12px;
 }

 .fo-moves {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  border-top: 1px solid var(--sd-rule);
  padding: 12px 16px;
 }

 .fo-nothing {
  padding: 24px 16px;
  font-size: 13.5px;
  color: var(--sd-muted);
 }

 .fo-nothing p + p {
  margin-top: 6px;
 }

 /* Answers */
 .fo-answers {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  min-height: 0;
 }

 .fo-list {
  border-right: 1px solid var(--sd-rule);
  background: var(--sd-raised);
 }

 .fo-list__head {
  display: flex;
  align-items: center;
  height: 40px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 16px;
 }

 .fo-answer {
  display: grid;
  gap: 4px;
  width: 100%;
  border: 0;
  border-bottom: 1px solid var(--sd-rule);
  padding: 14px 16px;
  background: none;
  text-align: left;
  cursor: pointer;
 }

 .fo-answer:hover {
  background: var(--sd-field);
 }

 .fo-answer:focus-visible {
  outline-offset: -2px;
 }

 .fo-answer[aria-pressed='true'] {
  background: var(--sd-soft);
 }

 .fo-answer__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
 }

 .fo-answer__top b {
  font-size: 14px;
  font-weight: 500;
  color: var(--sd-strong);
 }

 .fo-answer.is-new .fo-answer__top b {
  font-weight: 700;
 }

 .fo-answer__line {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--sd-ink);
 }

 .fo-answer__when {
  font: 400 12.5px/1.4 var(--sd-body);
  color: var(--sd-muted);
 }

 .fo-detail {
  padding: 24px 28px 32px;
 }

 .fo-detail__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
 }

 .fo .fo-detail__when {
  margin-top: 6px;
  font-size: 13px;
  color: var(--sd-muted);
 }

 .fo-detail__acts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
 }

 .fo .fo-values {
  max-width: 640px;
  margin-top: 24px;
  border-top: 1px solid var(--sd-rule);
 }

 .fo-values > div {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 16px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 13px 0;
 }

 .fo-values dt {
  font-size: 13px;
  color: var(--sd-muted);
 }

 .fo-values dd {
  font-size: 14px;
  color: var(--sd-strong);
  overflow-wrap: anywhere;
 }

 .fo-values dd.is-empty {
  color: var(--sd-faint);
 }

 /* Notifications */
 .fo-notify {
  display: block;
  padding: 28px 32px 40px;
 }

 .fo-notify__col {
  display: grid;
  gap: 36px;
  max-width: 640px;
 }

 .fo-h {
  font: 700 17px/1.2 var(--sd-display);
  color: var(--sd-strong);
 }

 .fo .fo-sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--sd-muted);
 }

 .fo .fo-people {
  margin-top: 14px;
  border-top: 1px solid var(--sd-rule);
 }

 .fo-people li {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 8px 0;
 }

 .fo-people__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--sd-soft);
  color: var(--sd-strong);
 }

 .fo-people__name {
  display: grid;
  flex: 1;
  min-width: 0;
 }

 .fo-people__name b {
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--sd-strong);
 }

 .fo-people__name span {
  font-size: 12.5px;
  color: var(--sd-muted);
 }

 .fo-people .fo-people__none {
  font-size: 13px;
  color: var(--sd-muted);
 }

 .fo .fo-adder {
  margin-top: 18px;
 }

 .fo-adder__row {
  display: flex;
  gap: 8px;
 }

 .fo-adder__row .sd-input {
  flex: 1;
  min-width: 0;
 }

 .fo-adder__row .sd-btn {
  height: 34px;
 }

 .fo-line--flush {
  margin-top: 10px;
  border-top: 1px solid var(--sd-rule);
  padding: 8px 0;
 }

 /* Between a laptop and a phone: narrower side panes. */
 @container sd (max-width: 1060px) {
  .fo-build {
   grid-template-columns: 188px minmax(0, 1fr) 272px;
  }

  .fo-answers {
   grid-template-columns: 280px minmax(0, 1fr);
  }

  .fo-canvas {
   padding: 16px;
  }

  .fo-form {
   padding: 28px 26px 32px;
  }

  .fo-status {
   display: none;
  }
 }

 /* A phone: one pane at a time. */
 @container sd (max-width: 760px) {
  .fo-view {
   grid-template-rows: auto minmax(0, 1fr);
  }

  .fo-notify {
   padding: 20px 16px 32px;
  }

  .fo-bar {
   gap: 8px;
   padding: 0 12px;
  }

  .fo-tabs {
   display: none;
  }

  .fo .fo-pick {
   display: block;
   flex: 0 1 auto;
   width: auto;
   min-width: 0;
   min-height: 32px;
   margin-right: auto;
   padding-top: 0;
   padding-bottom: 0;
  }

  .fo .fo-panes {
   display: flex;
   flex: none;
  }

  .fo-panes button {
   white-space: nowrap;
  }

  .fo-build,
  .fo-answers {
   grid-template-columns: minmax(0, 1fr);
  }

  .fo-kinds,
  .fo-inspector,
  .fo[data-build='fields'] .fo-canvas,
  .fo[data-build='settings'] .fo-canvas {
   display: none;
  }

  .fo[data-build='fields'] .fo-kinds,
  .fo[data-build='settings'] .fo-inspector {
   display: grid;
   border: 0;
  }

  .fo-detail,
  .fo[data-answers='answer'] .fo-list {
   display: none;
  }

  .fo[data-answers='answer'] .fo-detail {
   display: block;
  }

  .fo-list {
   border-right: 0;
  }

  .fo-canvas {
   padding: 12px;
  }

  .fo-detail {
   padding: 20px 16px 28px;
  }

  .fo-values > div {
   grid-template-columns: minmax(0, 1fr);
   gap: 2px;
  }

  .fo-title {
   display: none;
  }

  .fo-tabs {
   gap: 16px;
   margin-left: 0;
  }
 }

 /* The form itself at a phone's width: one column. */
 @container ss (max-width: 520px) {
  .fo-form {
   padding: 24px 18px 28px;
  }

  .fo-field.is-half {
   grid-column: span 2;
  }
 }

 @media (prefers-reduced-motion: reduce) {
  .fo-field.is-fresh {
   animation: none;
  }
 }
</style>
