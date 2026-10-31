<script setup>
 // One photo, video or player with an optional caption: in the page's
 // column (Normal), or from edge to edge (Wide). A video with nowhere to play
 // from falls back on the photo, as does an embed link no player takes, which
 // then shows as a plain link. On the canvas a player can't take the pointer,
 // or a click on it would never reach the studio.
 const props = defineProps({ data: { type: Object, required: true } });
 // Empty fields aren't drawn, but one being typed into on the canvas stays.
 const shows = useFieldShown();

 const canvas = useCanvas();
 const video = computed(() => (props.data.kind === 'video' ? safeSrc(props.data.video_url) : undefined));
 const player = computed(() => (props.data.kind === 'embed' ? embedSrc(props.data.embed_url) : undefined));
 const outLink = computed(() => (props.data.kind === 'embed' && !player.value ? safeHref(props.data.embed_url) : undefined));
</script>

<template>
 <section class="tb-section tb-media" :class="`tb-media--${data.width}`">
  <figure class="tb-media__figure" :class="{ 'tb-wrap': data.width !== 'wide' }">
   <div v-if="video || player" class="tb-media__stage" :class="{ 'tb-media__stage--still': canvas }">
    <video v-if="video" :src="video" :poster="safeSrc(data.image.src)" controls playsinline preload="metadata" class="tb-media__player"></video>
    <iframe
     v-else
     :src="player"
     :title="data.caption || 'Video'"
     loading="lazy"
     allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
     referrerpolicy="strict-origin-when-cross-origin"
     class="tb-media__player"
    ></iframe>
   </div>
   <TbImage v-else :image="data.image" ratio="16 / 9" class="tb-media__image" />
   <p v-if="outLink" class="tb-media__out" :class="{ 'tb-wrap': data.width === 'wide' }">
    <a :href="outLink" rel="noopener">Watch the video</a>
   </p>
   <TbText
    v-if="shows('caption', data.caption)"
    :data="data"
    field="caption"
    tag="figcaption"
    class="tb-media__caption"
    :class="{ 'tb-wrap': data.width === 'wide' }"
   />
  </figure>
 </section>
</template>

<style>
 /* A photo sits a little tighter in the page than a section of text. */
 .tb-section.tb-media {
  padding-block: calc(var(--site-space) * 0.75);
 }

 .tb-media__figure {
  margin-block: 0;
 }

 /* Wide runs edge to edge: square corners, and a height that follows the
    screen instead of the 16:9 shape, so it never fills a big monitor. */
 .tb-media--wide .tb-media__figure {
  margin-inline: 0;
 }

 .tb-media--wide .tb-media__image {
  height: clamp(240px, 50vw, 720px);
  border-radius: 0;
 }

 /* A video or a player: the photo's 16:9 box, filled edge to edge. */
 .tb-media__stage {
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border-radius: var(--site-radius);
  background: var(--site-dark);
 }

 .tb-media__stage--still {
  pointer-events: none;
 }

 .tb-media__player {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  object-fit: contain;
 }

 .tb-media--wide .tb-media__stage {
  aspect-ratio: auto;
  height: clamp(240px, 50vw, 720px);
  border-radius: 0;
 }

 .tb-media__out {
  margin: 12px 0 0;
  font-size: 15px;
  font-weight: 700;
  text-align: center;
 }

 .tb-media__out a {
  color: var(--site-accent);
 }

 .tb-media__caption {
  margin-top: 12px;
  font-size: 15px;
  font-style: italic;
  line-height: 1.5;
  color: var(--site-muted);
  text-align: center;
 }
</style>
