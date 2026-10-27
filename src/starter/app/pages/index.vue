<script setup>
 // Every block this site has, with its starting content: the community
 // shelf at a glance, and a quick check that they all render.
 import { definitions } from '#timbrr/blocks';

 useHead({ title: 'Timbrr starter — every block' });

 const blocks = definitions.map(({ def }) => ({ id: def.type, type: def.type, data: def.defaults ?? {} }));
</script>

<template>
 <main>
  <TbBlocks :blocks="blocks" />
 </main>
</template>
