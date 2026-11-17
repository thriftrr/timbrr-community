<!-- A site's own grove-aware block (docs/README.md § Groves). An example, not loaded by the layer. -->
<script setup>
 const props = defineProps({ data: { type: Object, required: true } });
 const { saplings, total, pending, more } = await useSaplings(() => props.data.source);
 const photo = (sapling) => sapling.rings.find((ring) => ring.kind === 'image')?.value;
</script>

<template>
 <section class="tb-section">
  <div class="tb-wrap">
   <h2>{{ data.headline }}</h2>
   <ul :aria-busy="pending ? 'true' : undefined">
    <li v-for="sapling in saplings" :key="sapling.id">
     <TbImage v-if="photo(sapling)" :image="photo(sapling)" ratio="1 / 1" :class="{ round: data.round }" />
     <NuxtLink v-if="sapling.path" :to="sapling.path">{{ sapling.title }}</NuxtLink>
    </li>
   </ul>
   <button v-if="saplings.length < total" type="button" @click="more">Load more</button>
  </div>
 </section>
</template>
