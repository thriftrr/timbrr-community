<!-- A site's own collection-aware block (docs/README.md § Collections). An example, not loaded by the layer. -->
<script setup>
 const props = defineProps({ data: { type: Object, required: true } });
 const { entries, total, pending, more } = await useEntries(() => props.data.source);
 const photo = (entry) => entry.fields.find((field) => field.kind === 'image')?.value;
</script>

<template>
 <section class="tb-section">
  <div class="tb-wrap">
   <h2>{{ data.headline }}</h2>
   <ul :aria-busy="pending ? 'true' : undefined">
    <li v-for="entry in entries" :key="entry.id">
     <TbImage v-if="photo(entry)" :image="photo(entry)" ratio="1 / 1" :class="{ round: data.round }" />
     <NuxtLink v-if="entry.path" :to="entry.path">{{ entry.title }}</NuxtLink>
    </li>
   </ul>
   <button v-if="entries.length < total" type="button" @click="more">Load more</button>
  </div>
 </section>
</template>
