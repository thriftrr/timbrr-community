<script setup>
 // Site settings → Branding: the site's colors, fonts and corners on the
 // left, its home page on the right. Every change goes straight into the
 // shared theme, so the page editor shows it too, as on a real site.
 import { BLOCKS, BRAND_COLORS, BODY_FONTS, HEADING_FONTS, MEDIA, artSrc, startLook } from '../../utils/studio-demo/sample.js';
 import { contrast, inkOn, isHex, themeStyle } from '../../utils/studio-demo/theme.js';

 const demo = inject('studioDemo');
 const theme = demo.theme;
 const logo = MEDIA.find((item) => item.kind === 'Logo');
 const look = computed(() => themeStyle(theme));

 // The home page the preview shows, in the order the site has it.
 const PREVIEW = ['hero', 'cards', 'cta'].map((type) => ({ type, data: BLOCKS[type].data, look: startLook(type) }));
 const device = ref('desktop');
 // At a phone's width one pane shows at a time.
 const pane = ref('settings');

 const COLORS = [
  ['brand', 'Brand color', 'Buttons and the call to action.'],
  ['heading', 'Headings color', ''],
  ['text', 'Text color', ''],
 ];
 // What's typed, kept apart from the theme so a half-typed color doesn't
 // repaint the site; the theme only takes a whole one.
 const typed = reactive(Object.fromEntries(COLORS.map(([key]) => [key, theme[key]])));
 const wrong = reactive({});
 function type(key) {
  let value = typed[key].trim();
  if (/^[0-9a-f]{6}$/i.test(value)) value = `#${value}`;
  wrong[key] = !isHex(value);
  if (!wrong[key]) theme[key] = value.toLowerCase();
 }
 function pick(color) {
  theme.brand = color;
  typed.brand = color;
  wrong.brand = false;
 }

 // Can people read it? WCAG's 4.5 for text, 3 for big headings.
 const checks = computed(() => ({
  brand: [{ label: 'Button words on brand', ratio: contrast(inkOn(theme.brand), theme.brand), need: 4.5 }],
  heading: [{ label: 'Headings on page', ratio: contrast(theme.heading, theme.paper), need: 3 }],
  text: [{ label: 'Text on page', ratio: contrast(theme.text, theme.paper), need: 4.5 }],
 }));


 function save() {
  demo.toast('Saving is off in the demo. On your own site, every page changes to the new look at once.', { link: true });
 }
</script>

<template>
 <div class="br" :data-pane="pane">
  <div class="br-bar">
   <h2 class="sd-title br-title">Branding</h2>
   <div class="sd-seg br-panes" aria-label="Show">
    <button type="button" :aria-pressed="pane === 'settings'" @click="pane = 'settings'">Edit</button>
    <button type="button" :aria-pressed="pane === 'preview'" @click="pane = 'preview'">Preview</button>
   </div>
   <p class="br-bar__note">Changes show on every page at once.</p>
   <button type="button" class="sd-btn sd-btn--primary" @click="save">Save branding</button>
  </div>

  <aside class="br-settings sd-pane" aria-label="Branding settings">
   <section class="br-sec" aria-labelledby="br-logo">
    <h3 id="br-logo" class="br-sec__head">Logo</h3>
    <div class="br-logo">
     <img class="br-logo__img" :src="artSrc(logo.art)" alt="" />
     <div class="br-logo__name">
      <p>{{ logo.name }}</p>
      <p class="sd-help">In the header and footer</p>
     </div>
     <button type="button" class="sd-btn" @click="demo.toast('On a real site, Change opens Media to pick or upload a new logo.')">Change</button>
    </div>
   </section>

   <section class="br-sec" aria-labelledby="br-colors">
    <h3 id="br-colors" class="br-sec__head">Colors</h3>
    <div class="br-sec__body">
     <div v-for="[key, name, help] in COLORS" :key="key" class="sd-field">
      <label class="sd-label" :for="`br-${key}`">{{ name }}</label>
      <div v-if="key === 'brand'" class="br-swatches" role="group" aria-label="Brand colors">
       <button v-for="color in BRAND_COLORS" :key="color" type="button" class="br-swatch" :style="{ background: color }" :aria-pressed="theme.brand === color" :aria-label="color" :title="color" @click="pick(color)" />
      </div>
      <div class="br-hex">
       <span class="br-hex__chip" :style="{ background: theme[key] }" aria-hidden="true" />
       <input :id="`br-${key}`" v-model="typed[key]" class="sd-input" spellcheck="false" autocomplete="off" maxlength="7" :aria-invalid="wrong[key] || undefined" :aria-describedby="`br-${key}-note`" @input="type(key)" />
       <!-- On a phone the preview is a tap away, so the button shows here as you pick. -->
       <span v-if="key === 'brand'" class="br-try" :style="look" aria-hidden="true">{{ BLOCKS.hero.data.button }}</span>
      </div>
      <p v-if="wrong[key]" :id="`br-${key}-note`" class="br-error">Use a # and six letters or numbers, like #bd5326.</p>
      <p v-else-if="help" :id="`br-${key}-note`" class="sd-help">{{ help }}</p>
      <ul class="br-checks">
       <li v-for="check in checks[key]" :key="check.label" :class="{ 'is-low': check.ratio < check.need }">
        <StudioDemoIcon :name="check.ratio < check.need ? 'x' : 'check'" :size="14" />
        <span>{{ check.label }}</span>
        <b>{{ check.ratio.toFixed(1) }}:1</b>
        <span class="br-checks__say">{{ check.ratio < check.need ? `needs ${check.need}` : 'reads well' }}</span>
       </li>
      </ul>
     </div>
    </div>
   </section>

   <section class="br-sec" aria-labelledby="br-fonts">
    <h3 id="br-fonts" class="br-sec__head">Fonts</h3>
    <div class="br-sec__body">
     <div class="sd-field">
      <label class="sd-label" for="br-head-font">Headings</label>
      <select id="br-head-font" v-model="theme.headingFont" class="sd-input" :style="{ fontFamily: look['--s-head-font'] }">
       <option v-for="font in HEADING_FONTS" :key="font">{{ font }}</option>
      </select>
     </div>
     <div class="sd-field">
      <label class="sd-label" for="br-body-font">Text</label>
      <select id="br-body-font" v-model="theme.bodyFont" class="sd-input" :style="{ fontFamily: look['--s-body-font'] }">
       <option v-for="font in BODY_FONTS" :key="font">{{ font }}</option>
      </select>
     </div>
    </div>
   </section>

   <section class="br-sec" aria-labelledby="br-shape">
    <h3 id="br-shape" class="br-sec__head">Shape</h3>
    <div class="br-sec__body">
     <div class="br-range__top">
      <label class="sd-label" for="br-corners">Corners</label>
      <output for="br-corners" class="br-range__value">{{ theme.corners }} px</output>
     </div>
     <input id="br-corners" v-model.number="theme.corners" class="br-range" type="range" min="0" max="20" step="1" />
     <p class="sd-help">Buttons, cards and pictures round off by this much.</p>
    </div>
   </section>

   <p class="br-foot">How {{ demo.site.name }} looks everywhere. The page editor uses these too, so a change here shows on its canvas.</p>
  </aside>

  <main class="br-preview" aria-label="Preview">
   <div class="br-preview__bar">
    <p class="sd-caps">Preview · Home</p>
    <div class="sd-seg br-device" aria-label="Show the page as">
     <button type="button" :aria-pressed="device === 'desktop'" @click="device = 'desktop'"><StudioDemoIcon name="monitor" :size="14" /><span>Computer</span></button>
     <button type="button" :aria-pressed="device === 'phone'" @click="device = 'phone'"><StudioDemoIcon name="smartphone" :size="14" /><span>Phone</span></button>
    </div>
   </div>
   <div class="br-canvas sd-pane">
    <div class="sd-site br-page" :class="{ 'is-phone': device === 'phone' }" :style="look">
     <StudioDemoSite type="header" />
     <StudioDemoSite v-for="block in PREVIEW" :key="block.type" :type="block.type" :data="block.data" :look="block.look" />
     <StudioDemoSite type="footer" />
    </div>
   </div>
  </main>
 </div>
</template>

<style>
 .br {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
 }

 /* Settings */
 .br-settings {
  border-right: 1px solid var(--sd-rule);
  background: var(--sd-raised);
 }

 .br-foot {
  border-top: 1px solid var(--sd-rule);
  padding: 12px 16px;
  font-size: 12.5px;
  color: var(--sd-muted);
 }

 .br-sec {
  border-bottom: 1px solid var(--sd-rule);
 }

 .br-sec__head {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--sd-strong);
 }

 .br-sec__body {
  padding: 0 16px 18px;
 }

 .br-sec__body .sd-field + .sd-field {
  margin-top: 20px;
 }

 .br-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px 16px;
 }

 .br-logo__img {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 8px;
 }

 .br-logo__name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--sd-strong);
 }

 .br-logo__name .sd-help {
  margin-top: 2px;
  font-weight: 400;
 }

 .br-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 2px 0 12px;
  padding-left: 4px;
 }

 .br-swatch {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  padding: 0;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12);
  cursor: pointer;
  transition: box-shadow 0.16s var(--sd-ease);
 }

 .br-swatch:hover {
  box-shadow:
   inset 0 0 0 1px rgb(0 0 0 / 0.12),
   0 0 0 2px var(--sd-raised),
   0 0 0 4px var(--sd-border);
 }

 .br-swatch[aria-pressed='true'] {
  box-shadow:
   inset 0 0 0 1px rgb(0 0 0 / 0.12),
   0 0 0 2px var(--sd-raised),
   0 0 0 4px var(--sd-brand);
 }

 .br-hex {
  position: relative;
  display: flex;
  gap: 8px;
 }

 .br-hex .sd-input {
  flex: 1;
  min-width: 0;
 }

 .br-try {
  display: none;
  flex: none;
  align-items: center;
  border-radius: calc(var(--s-corners) * 0.8);
  padding: 0 14px;
  background: var(--s-brand);
  font: 600 13px/1 var(--s-body-font);
  color: var(--s-brand-ink);
 }

 .br-hex__chip {
  position: absolute;
  top: 50%;
  left: 9px;
  width: 18px;
  height: 18px;
  translate: 0 -50%;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.14);
  pointer-events: none;
 }

 .br-hex .sd-input {
  padding-left: 36px;
  font-family: var(--sd-mono);
  font-size: 12.5px;
 }

 .br .br-error {
  margin-top: 6px;
  font-size: 12px;
  color: var(--sd-danger);
 }

 .br .br-checks {
  margin-top: 8px;
 }

 .br-checks li {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 22px;
  font-size: 12px;
  color: var(--sd-muted);
 }

 .br-checks .sd-icon {
  color: var(--sd-brand);
 }

 .br-checks b {
  margin-left: auto;
  font: 500 11.5px/1 var(--sd-mono);
  color: var(--sd-strong);
 }

 .br-checks__say {
  min-width: 64px;
  text-align: right;
 }

 .br-checks li.is-low :is(.sd-icon, b, .br-checks__say) {
  color: var(--sd-danger);
 }

 .br-range__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
 }

 .br-range__value {
  font: 500 12.5px/1 var(--sd-body);
  color: var(--sd-strong);
 }

 .br-range {
  width: 100%;
  margin: 4px 0 0;
  accent-color: var(--sd-brand);
  cursor: pointer;
 }

 /* Preview */
 .br-preview {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
 }

 .br-preview__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 48px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 12px 0 16px;
  background: var(--sd-raised);
 }

 .br-device button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
 }

 .br-canvas {
  padding: 22px;
  background: var(--sd-sunken);
 }

 .br-page {
  max-width: 860px;
  margin: 0 auto;
  border-radius: 6px;
  transition: max-width 0.4s var(--sd-ease);
 }

 .br-page.is-phone {
  max-width: 390px;
 }

 .br-bar {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  border-bottom: 1px solid var(--sd-border);
  padding: 0 12px 0 16px;
  background: var(--sd-raised);
 }

 .br-title {
  white-space: nowrap;
 }

 /* Status, then the main action, always on the right. */
 .br .br-bar__note {
  margin-left: auto;
  font: 500 12.5px/1 var(--sd-body);
  color: var(--sd-muted);
 }

 .br .br-panes {
  display: none;
 }

 /* A phone: settings or preview, one at a time. */
 @container sd (max-width: 760px) {
  .br {
   grid-template-columns: minmax(0, 1fr);
  }

  .br .br-panes {
   display: flex;
  }

  .br-settings {
   border-right: 0;
  }

  .br-try {
   display: flex;
  }

  .br[data-pane='settings'] .br-preview,
  .br[data-pane='preview'] .br-settings {
   display: none;
  }

  /* The crumbs already name the page, so the panes take the left. */
  .br-title,
  .br-bar__note {
   display: none;
  }

  .br-bar .sd-btn--primary {
   margin-left: auto;
  }

  .br-canvas {
   padding: 12px;
  }

  /* The pane is already a phone's width, and the row above names it. */
  .br .br-preview__bar {
   display: none;
  }

  .br-preview {
   grid-template-rows: minmax(0, 1fr);
  }
 }
</style>
