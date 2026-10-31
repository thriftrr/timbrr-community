<script setup>
 // A form from the site's Forms (TbForm draws it), under its heading on this
 // page when the block gives one. In the studio's canvas it's a picture of the
 // form: nothing takes a click but the block itself, and a block with no form
 // says so. A block that holds no form and still has its old button words is one
 // from before forms were their own thing (TbFormLegacy).
 const props = defineProps({ data: { type: Object, required: true } });

 const canvas = useCanvas();
 const forms = useTimbrrForms();
 const form = computed(() => forms.value[props.data.form] ?? null);
 const legacy = computed(() => !props.data.form && Boolean(props.data.submit_label?.trim()));
 const empty = computed(() => (props.data.form ? "This form isn't published yet." : 'Pick a form in the panel.'));
</script>

<template>
 <TbFormLegacy v-if="legacy" :data="data" />
 <section v-else-if="form || canvas" class="tb-section tb-form">
  <div class="tb-wrap tb-form__inner">
   <TbForm v-if="form" :form="form" :heading="data.headline" :locked="Boolean(canvas)" />
   <p v-else class="tb-form__empty">{{ empty }}</p>
  </div>
 </section>
</template>

<style>
 .tb-form__empty {
  margin: 0;
  border: 1px dashed var(--site-border);
  border-radius: 10px;
  padding: 28px 20px;
  text-align: center;
  color: var(--site-muted);
 }
</style>
