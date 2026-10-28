<script setup>
 // A band across the page with a small label in the middle: on paper,
 // white or a pale wash of the brand color, with tight, normal or roomy
 // room above and below. Pages are a flat list of blocks, so the band
 // can't hold blocks of its own; it marks where a new part of the page
 // starts. On the studio's canvas a white band with no label gets faint
 // dashed lines along its top and bottom (drawn over it, never on the
 // site), so it doesn't vanish into the page.
 const props = defineProps({ data: { type: Object, required: true } });

 const canvas = useCanvas();
 const scope = useBlockScope();
 const editing = computed(() => Boolean(canvas) && canvas.editable?.value !== false);

 // No label, no label line: except on the canvas while it's being typed
 // into, so clearing it to start over doesn't lose the caret.
 const labelled = computed(() => {
  if (String(props.data.tagline ?? '').trim()) return true;
  const active = canvas?.active.value;
  return Boolean(active && active.id === scope?.id && active.field === 'tagline');
 });
</script>

<template>
 <section class="tb-section tb-section-block" :class="[`tb-section-block--${data.bg}`, `tb-section-block--${data.padding}`]">
  <div v-if="labelled" class="tb-wrap">
   <TbText :data="data" field="tagline" tag="p" class="tb-eyebrow tb-section-block__label" />
  </div>
  <span v-if="editing && !labelled && data.bg === 'white'" class="tb-section-block__guides" aria-hidden="true" />
 </section>
</template>

<style>
 /* tb-section-block, not tb-section: that name is every block's shared
    section. Its padding is a share of the site's section spacing: on a
    wide screen about 22, 48 or 88px; on a phone 12, 26 or 48px. */
 .tb-section-block {
  position: relative;
  background: var(--site-surface);
  text-align: center;
 }

 .tb-section.tb-section-block {
  padding-block: calc(var(--site-space) * 0.55);
 }

 .tb-section.tb-section-block--tight {
  padding-block: calc(var(--site-space) / 4);
 }

 .tb-section.tb-section-block--roomy {
  padding-block: var(--site-space);
 }

 .tb-section-block--white {
  background: var(--site-bg);
 }

 .tb-section-block--pine {
  background: color-mix(in srgb, var(--site-accent) 10%, var(--site-bg));
 }

 .tb-section-block .tb-section-block__label {
  margin: 0;
  overflow-wrap: break-word;
 }

 /* On the brand-color wash, the label takes a deep shade of the brand
    color: it reads better there than the eyebrow color does. */
 .tb-section-block--pine .tb-section-block__label {
  color: color-mix(in srgb, var(--site-accent) 60%, var(--site-heading));
 }

 /* Canvas only: lines along the band's top and bottom, as wide as the
    page's content. */
 .tb-section-block__guides {
  position: absolute;
  inset-block: 0;
  inset-inline: max(var(--site-gutter), (100% - var(--site-max)) / 2);
  border-block: calc(1px * var(--tb-ui, 1)) dashed #e3d9c2;
  opacity: 0.7;
  pointer-events: none;
 }
</style>
