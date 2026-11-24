<script setup>
 // The frame of the members pages (/members, /join, /account; the studio's
 // docs/members.md): the site's own header and footer around one narrow column.
 defineProps({ site: { type: Object, required: true }, pageStyle: { type: Object, default: () => ({}) } });
</script>

<template>
 <div class="tb-page tb-members" :style="pageStyle">
  <a href="#main" class="tb-skip">Skip to main content</a>
  <TbSiteHeader v-if="site.name || site.domain" :site="site" />
  <main id="main" tabindex="-1" class="tb-page__main tb-members__main">
   <div class="tb-wrap tb-members__inner"><slot /></div>
  </main>
  <TbSiteFooter v-if="site.name || site.domain" :site="site" />
 </div>
</template>

<style>
 .tb-members__main {
  padding-block: clamp(32px, 6vw, 72px);
 }

 .tb-members__inner {
  max-width: 520px;
 }

 .tb-members__title {
  margin: 0 0 8px;
  font-size: clamp(28px, 4vw, 38px);
  line-height: 1.15;
 }

 .tb-members__lede {
  margin: 0 0 24px;
  color: var(--site-body);
 }

 .tb-members__form {
  display: grid;
  gap: 12px;
  margin: 0 0 16px;
 }

 .tb-members__rows {
  margin: 0 0 24px;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--site-border);
 }

 .tb-members__row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--site-border);
 }

 .tb-members__row h2 {
  margin: 0;
  font-size: 20px;
 }

 .tb-members__row p {
  margin: 4px 0 0;
  color: var(--site-body);
 }

 .tb-members__price {
  font-weight: 700;
  white-space: nowrap;
 }

 .tb-members__switch {
  display: flex;
  gap: 8px;
  margin: 0 0 8px;
 }

 .tb-members__done {
  margin: 0 0 20px;
  padding: 12px 14px;
  border-left: 3px solid var(--site-accent);
  background: color-mix(in srgb, var(--site-accent) 8%, transparent);
 }

 .tb-members__problem {
  margin: 0 0 16px;
  color: #b42318;
 }

 .tb-members__link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--site-accent);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
 }

 /* The join box under a locked page or entry. */
 .tb-members-gate {
  padding-block: clamp(32px, 6vw, 64px);
 }

 .tb-members-gate__box {
  max-width: 560px;
  margin-inline: auto;
  padding: 28px 24px;
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius, 8px);
  text-align: center;
 }

 .tb-members-gate__box h2 {
  margin: 0 0 6px;
 }

 .tb-members-gate__box p {
  margin: 0 0 16px;
  color: var(--site-body);
 }

 .tb-members-gate__box .tb-buttons {
  justify-content: center;
 }
</style>
