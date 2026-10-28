<script setup>
 // Text a block draws from its data. On the site it's plain text; in the
 // studio's canvas the same element is editable in place (plain text only),
 // and each keystroke goes to the studio, which owns the page. The studio's
 // copy comes back as the block re-renders; while someone is typing here,
 // it's left alone so the caret doesn't jump. With the caret here, the
 // studio's format bar names the field and offers no tools.
 const props = defineProps({
  data: { type: Object, required: true },
  field: { type: String, required: true },
  tag: { type: String, default: 'span' },
  multiline: { type: Boolean, default: false },
 });

 const canvas = useCanvas();
 const scope = useBlockScope();
 const editable = computed(() => Boolean(canvas?.editable.value && scope));
 const value = computed(() => String(valueAt(props.data, props.field) ?? ''));
 const el = ref(null);

 // Someone is typing here: this window has the keyboard, and it's in here.
 // (With the caret out in the studio, the studio's copy is the latest.)
 const typing = () => document.hasFocus() && document.activeElement === el.value;

 function sync() {
  if (!el.value || typing()) return;
  if (el.value.innerText !== value.value) el.value.innerText = value.value;
 }

 watch(el, sync, { flush: 'post' });
 watch(value, sync, { flush: 'post' });

 function onFocus() {
  canvas.activate({ id: scope.id, field: props.field, kind: 'text' });
  canvas.focus({ id: scope.id, field: props.field, kind: 'text', label: canvas.labelFor(scope.def, props.field), tools: [], active: [] });
 }

 function onBlur() {
  canvas.release(scope.id, props.field);
 }

 function onInput() {
  canvas.edit(scope.id, props.field, props.multiline ? el.value.innerText : el.value.innerText.replace(/\n/g, ' '));
 }

 function onKeydown(event) {
  if (event.key === 'Enter' && !props.multiline) {
   event.preventDefault();
   el.value.blur();
  }
  if (event.key === 'Escape') el.value.blur();
 }

 // Paste as plain text, whatever was copied.
 function onPaste(event) {
  event.preventDefault();
  const text = event.clipboardData.getData('text/plain');
  document.execCommand('insertText', false, props.multiline ? text : text.replace(/\s*\n\s*/g, ' '));
 }
</script>

<template>
 <component :is="tag" v-if="!editable">{{ value }}</component>
 <component
  :is="tag"
  v-else
  ref="el"
  class="tb-text"
  contenteditable="plaintext-only"
  :data-field="field"
  @focus="onFocus"
  @blur="onBlur"
  @input="onInput"
  @keydown="onKeydown"
  @paste="onPaste"
 />
</template>
