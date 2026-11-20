<script setup>
 // A form from the site's Forms (TbForm draws it), under the block's heading and
 // intro: the block's own words, empty for none. A block saved before they
 // moved here has no `heading` and still draws the form's own title and intro
 // until scripts/convert-blocks.mjs fills them in. In the studio's canvas it's a
 // picture of the form (one not yet published is drawn from its draft, marked
 // Draft form): nothing takes a click but the block itself, and a block with no
 // form says so. On the site a block whose form isn't live draws nothing. A
 // block that holds no form and still has its old button words is one from
 // before forms were their own thing (TbFormLegacy).
 //
 // The 50/50 layout puts the block's own photo and words beside the form, first
 // on small screens. With neither there's no second half, so it draws full
 // width, except in the studio, where the empty half is how you find it. Like
 // Hero's optional photo, an empty one isn't drawn on the site.
 const props = defineProps({ data: { type: Object, required: true } });

 const canvas = useCanvas();
 const forms = useTimbrrForms();
 const form = computed(() => formNamed(forms.value, props.data.form));
 const legacy = computed(() => !props.data.form && Boolean(props.data.submit_label?.trim()));
 const empty = computed(() => (props.data.form ? "This form isn't here any more. Pick another in the panel." : 'Pick a form in the panel, or make a new one.'));
 const own = computed(() => typeof props.data.heading === 'string');

 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();
 const editing = computed(() => Boolean(canvas?.editable.value));
 const photo = computed(() => Boolean(safeSrc(props.data.image?.src)));
 const heading = computed(() => shows('content_heading', props.data.content_heading));
 const words = computed(() => shows('content_body', props.data.content_body));
 const split = computed(() => props.data.layout === 'split' && (editing.value || photo.value || heading.value || words.value));
</script>

<template>
 <TbFormLegacy v-if="legacy" :data="data" />
 <section v-else-if="form || canvas" class="tb-section tb-form" :class="{ 'tb-form--split': split, 'tb-form--content-right': split && data.content_side === 'right' }">
  <div class="tb-wrap" :class="split ? 'tb-form__split' : 'tb-form__inner'">
   <div v-if="split" class="tb-form__content">
    <TbImage v-if="photo || editing" :image="data.image" field="image" ratio="4 / 3" sizes="(min-width: 720px) 560px, 100vw" />
    <TbText v-if="heading" :data="data" field="content_heading" tag="h2" class="tb-heading" />
    <TbRich v-if="words" :data="data" field="content_body" class="tb-form__content-body" />
   </div>
   <div v-if="form" class="tb-form__stage">
    <p v-if="canvas && form.draft" class="tb-form__draft">Draft form</p>
    <TbForm v-if="own" :form="form" :heading="data.heading" :intro="data.lede ?? ''" :locked="Boolean(canvas)" />
    <TbForm v-else :form="form" :heading="data.headline" :hide-title="data.hide_title" :locked="Boolean(canvas)" />
   </div>
   <p v-else class="tb-form__empty">{{ empty }}</p>
  </div>
 </section>
</template>

<style>
 .tb-form__split {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(28px, 4vw, 48px);
  align-items: start;
  overflow-wrap: break-word;
 }

 .tb-form--content-right .tb-form__content {
  order: 1;
 }

 .tb-form__content {
  display: grid;
  gap: 16px;
  min-width: 0;
 }

 .tb-form__content > * {
  margin-block: 0;
 }

 .tb-form__content-body {
  font-size: clamp(16px, 0.5vw + 14px, 18px);
  line-height: 1.7;
  color: var(--site-ink);
 }

 /* Small screens: the content first, then the form under it. */
 @media (max-width: 720px) {
  .tb-form__split {
   grid-template-columns: minmax(0, 1fr);
  }

  .tb-form--content-right .tb-form__content {
   order: 0;
  }
 }

 .tb-form__stage {
  min-width: 0;
 }

 .tb-form__draft {
  display: inline-block;
  margin: 0 0 12px;
  border: 1px solid var(--site-border);
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--site-muted);
 }

 .tb-form__empty {
  margin: 0;
  border: 1px dashed var(--site-border);
  border-radius: 10px;
  padding: 28px 20px;
  text-align: center;
  color: var(--site-muted);
 }
</style>
