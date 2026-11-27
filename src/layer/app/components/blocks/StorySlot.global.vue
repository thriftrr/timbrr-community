<script setup>
 // Where each entry's own story goes in a collection's page design
 // (blocks/story_slot.js). Served, the studio has already put the entry's
 // blocks in this block's place, so on the live site it is only ever drawn
 // when a story was handed to it (`story`), and then as the site draws any
 // blocks. On the canvas it's the design's story area: a dashed frame with
 // its name, the previewed entry's story inside it, drawn as the site will
 // (nothing in it is selected or typed into: each entry's story is edited
 // from the entry), or with no story yet, what goes here.
 const props = defineProps({ data: { type: Object, required: true } });
 const canvas = useCanvas();
 const story = computed(() => (Array.isArray(props.data.story) ? props.data.story.filter((block) => block && typeof block === 'object' && typeof block.type === 'string') : []));
 // The story is the entry's, not the design's: inside the frame the canvas is the site's own.
 provide(CANVAS_KEY, null);
 const names = computed(() => story.value.length);
 const rules = computed(() => {
  const out = [];
  if (props.data.allow === 'only' && props.data.only?.length) out.push(`${props.data.only.length} kinds of block`);
  else out.push('any block');
  if (props.data.max) out.push(`up to ${props.data.max}`);
  if (props.data.empty === false) out.push("can't be empty");
  return out.join(' · ');
 });
</script>

<template>
 <TbBlocks v-if="!canvas && story.length" :blocks="story" />
 <section v-else-if="canvas" class="tb-section tb-story-slot">
  <div class="tb-wrap">
   <div class="tb-story-slot__frame">
    <span class="tb-story-slot__tag">Story · each entry's own</span>
    <template v-if="story.length">
     <p class="tb-story-slot__note">This entry's story · {{ names }} {{ names === 1 ? 'block' : 'blocks' }}. Each entry shows its own here.</p>
     <div class="tb-story-slot__story">
      <TbBlocks :blocks="story" />
     </div>
    </template>
    <template v-else>
     <p class="tb-story-slot__title">Each entry's story goes here</p>
     <p class="tb-story-slot__note">Its own blocks, added from the entry in the page builder · {{ rules }}</p>
    </template>
   </div>
  </div>
 </section>
</template>

<style>
 .tb-story-slot__frame {
  position: relative;
  border: 2px dashed color-mix(in srgb, var(--site-accent, #2f6b4f) 70%, transparent);
  border-radius: var(--site-radius, 12px);
  padding: 28px 20px 20px;
  background: color-mix(in srgb, var(--site-accent, #2f6b4f) 6%, transparent);
  text-align: center;
 }

 .tb-story-slot__tag {
  position: absolute;
  top: -12px;
  left: 16px;
  border-radius: 999px;
  padding: 3px 10px;
  background: var(--site-accent, #2f6b4f);
  font: 700 11px/1.4 var(--site-font-body, system-ui), system-ui, sans-serif;
  color: var(--site-accent-ink, #fff);
 }

 .tb-story-slot__title {
  margin: 0 0 4px;
  font-family: var(--site-font-display, inherit);
  font-size: 1.1rem;
  color: var(--site-heading);
 }

 .tb-story-slot__note {
  margin: 0;
  font-size: 13px;
  color: var(--site-muted);
 }

 .tb-story-slot__story {
  margin-top: 16px;
  text-align: initial;
 }
</style>
