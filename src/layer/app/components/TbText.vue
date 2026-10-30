<script setup>
 // Text a block draws from its data. On the site it's plain text; in the
 // studio's canvas the same element is editable in place (plain text only),
 // and each keystroke goes to the studio, which owns the page. The studio's
 // copy comes back as the block re-renders; while someone is typing here,
 // it's left alone so the caret doesn't jump. With the caret here, the
 // studio's format bar names the field and offers no tools. Typing stops at
 // the most the field holds (its block's schema says), as it does in the
 // studio's inspector, so the studio never gets text it can't save.
 import { textLimit } from '#timbrr/manifest';

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
 const limit = computed(() => (scope?.def ? textLimit(scope.def.schema, props.field) : null) ?? Infinity);
 const el = ref(null);

 // Someone is typing here: this window has the keyboard, and it's in here.
 // (With the caret out in the studio, the studio's copy is the latest.)
 const typing = () => document.hasFocus() && document.activeElement === el.value;

 // What's typed here. Not innerText: that's the text as it's drawn, so a
 // field styled in capitals (a tagline, a label) would save in capitals. A
 // lone <br> is the browser holding an emptied line open.
 function typed() {
  const nodes = el.value.childNodes;
  if (nodes.length === 1 && nodes[0].nodeName === 'BR') return '';
  return read(el.value).replace(/ /g, ' ');
 }

 function read(node) {
  let out = '';
  for (const child of node.childNodes) {
   if (child.nodeType === Node.TEXT_NODE) out += child.nodeValue;
   else if (child.nodeName === 'BR') out += '\n';
   else out += read(child);
  }
  return out;
 }

 const oneLine = (text) => (props.multiline ? text : text.replace(/\n/g, ' '));

 function sync() {
  if (!el.value || typing()) return;
  if (typed() !== value.value) el.value.innerText = value.value;
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

 // Typing stops at the limit. Whatever is being typed over doesn't count,
 // since it's about to go.
 function onBeforeInput(event) {
  if (limit.value === Infinity || !event.inputType.startsWith('insert') || event.isComposing) return;
  const adding = event.data ?? event.dataTransfer?.getData('text/plain') ?? '\n';
  if (typed().length - replaced(event) + adding.length > limit.value) event.preventDefault();
 }

 function replaced(event) {
  return event.getTargetRanges().reduce((sum, target) => {
   const range = document.createRange();
   range.setStart(target.startContainer, target.startOffset);
   range.setEnd(target.endContainer, target.endOffset);
   return sum + range.toString().length;
  }, 0);
 }

 // Anything that got past the limit anyway (an input method, which can't
 // be stopped while it composes) is cut back to it when it lands.
 function onInput(event) {
  const text = oneLine(typed());
  if (text.length > limit.value && !event.isComposing) {
   el.value.innerText = text.slice(0, limit.value);
   caretToEnd();
  }
  canvas.edit(scope.id, props.field, text.slice(0, limit.value));
 }

 function caretToEnd() {
  const range = document.createRange();
  range.selectNodeContents(el.value);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
 }

 function onKeydown(event) {
  if (event.key === 'Enter' && !props.multiline) {
   event.preventDefault();
   el.value.blur();
  }
  if (event.key === 'Escape') el.value.blur();
 }

 // Paste as plain text, whatever was copied, as much of it as fits (what's
 // selected is pasted over).
 function onPaste(event) {
  event.preventDefault();
  const text = event.clipboardData.getData('text/plain');
  const selection = window.getSelection();
  const selected = selection.rangeCount ? selection.getRangeAt(0).toString().length : 0;
  const room = limit.value - (typed().length - selected);
  const pasting = (props.multiline ? text : text.replace(/\s*\n\s*/g, ' ')).slice(0, Math.max(0, room));
  if (pasting) document.execCommand('insertText', false, pasting);
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
  @beforeinput="onBeforeInput"
  @input="onInput"
  @compositionend="onInput"
  @keydown="onKeydown"
  @paste="onPaste"
 />
</template>
