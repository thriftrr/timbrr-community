<script setup>
 // People & access: who can work on the site, and what each role lets them
 // do. Invite someone, change a role, remove someone. Nothing leaves the
 // browser: sending and removing say what they'd do on a real site.
 import { INVITES, PEOPLE, ROLES } from '../../utils/studio-demo/sample.js';

 const demo = inject('studioDemo');
 const copy = (value) => JSON.parse(JSON.stringify(value));

 const people = ref(copy(PEOPLE));
 const invites = ref(copy(INVITES));
 // Nobody can be invited as the owner; a site has one, and it's you.
 const GIVEN = ROLES.filter((role) => role.key !== 'owner');
 const roleOf = (key) => ROLES.find((role) => role.key === key);
 const initials = (name) =>
  name
   .split(' ')
   .map((part) => part[0])
   .join('')
   .slice(0, 2);
 const first = (name) => name.split(' ')[0];

 // What each role can do, area by area. Opening a role shows its list, so
 // picking one in the invite isn't a guess.
 const AREAS = [
  ['Comment on and approve pages', ['owner', 'admin', 'editor', 'reviewer']],
  ['Edit and publish pages', ['owner', 'admin', 'editor']],
  ['Collections, Media and Forms', ['owner', 'admin', 'editor']],
  ['Branding and site settings', ['owner', 'admin']],
  ['Invite people and change roles', ['owner', 'admin']],
  ['Billing, and taking the site down', ['owner']],
 ];
 const shown = ref('editor');

 const summary = computed(() => {
  const count = people.value.length;
  const waiting = invites.value.length;
  const who = `${count} ${count === 1 ? 'person' : 'people'}`;
  return waiting ? `${who} · ${waiting} invite${waiting === 1 ? '' : 's'} waiting` : who;
 });

 // At a phone's width one pane shows at a time.
 const pane = ref('people');

 // The invite: a band at the top of the list, not a pop-up.
 let uid = 0;
 const inviting = ref(false);
 const email = ref('');
 const role = ref('editor');
 const error = ref('');
 const field = ref(null);
 const opener = ref(null);
 function openInvite() {
  inviting.value = true;
  pane.value = 'people';
  demo.crumb.value = ['People & access', 'Invite'];
  nextTick(() => field.value?.focus());
 }
 function closeInvite() {
  inviting.value = false;
  email.value = '';
  error.value = '';
  role.value = 'editor';
  demo.crumb.value = null;
  nextTick(() => opener.value?.focus());
 }
 function check(address) {
  if (!address) return 'Type the email address of the person you’re inviting.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(address)) return 'That doesn’t look like an email address. Check it for a typo.';
  const member = people.value.find((person) => person.email.toLowerCase() === address);
  if (member) return `${member.name} already has access, as ${roleOf(member.role).name}.`;
  if (invites.value.some((invite) => invite.email.toLowerCase() === address)) return 'An invite to that address is already waiting. You can resend it below.';
  return '';
 }
 function send() {
  const address = email.value.trim().toLowerCase();
  error.value = check(address);
  if (error.value) return field.value?.focus();
  invites.value.unshift({ id: `n${++uid}`, email: address, role: role.value, sent: 'just now', fresh: true });
  closeInvite();
  demo.toast('Sending is off in the demo. On your own site, they get an email with a sign-in link and no password to set.', { link: true });
 }

 function changeRole(person, next) {
  person.role = next;
  const name = roleOf(next).name;
  demo.toast(`${first(person.name)} is now ${/^[AEIOU]/.test(name) ? 'an' : 'a'} ${name}. It takes effect the next time they open the studio.`);
 }

 // The … menu on a row: one action, Remove.
 const menu = ref(null);
 function toggleMenu(id) {
  menu.value = menu.value === id ? null : id;
  if (menu.value) nextTick(() => document.getElementById(`pe-menu-${id}`)?.querySelector('button')?.focus());
 }
 function leaveMenu(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) menu.value = null;
 }
 function escMenu(event, id) {
  menu.value = null;
  event.currentTarget.querySelector(`[aria-controls="pe-menu-${id}"]`)?.focus();
 }
 function remove(person) {
  people.value = people.value.filter((entry) => entry.id !== person.id);
  menu.value = null;
  demo.toast(`${person.name} removed. On your site they lose access straight away. Start over brings them back.`);
  nextTick(() => opener.value?.focus());
 }

 function resend(invite) {
  invite.sent = 'just now';
  demo.toast(`Sending is off in the demo. On your site ${invite.email} gets a fresh sign-in link.`);
 }
 function cancel(invite) {
  invites.value = invites.value.filter((entry) => entry.id !== invite.id);
  demo.toast(`Invite to ${invite.email} canceled. The link in their email stops working.`);
 }

 onBeforeUnmount(() => (demo.crumb.value = null));
</script>

<template>
 <div class="pe" :data-pane="pane">
  <div class="pe-bar">
   <h2 id="pe-title" class="sd-title pe-title">People &amp; access</h2>
   <div class="sd-seg pe-panes" aria-label="Show">
    <button type="button" :aria-pressed="pane === 'people'" @click="pane = 'people'">List</button>
    <button type="button" :aria-pressed="pane === 'roles'" @click="pane = 'roles'">Roles</button>
   </div>
   <span class="pe-status" role="status">{{ summary }}</span>
   <button v-if="!inviting" ref="opener" type="button" class="sd-btn sd-btn--primary" @click="openInvite"><StudioDemoIcon name="user-plus" :size="15" />Invite</button>
  </div>

  <div class="pe-main">
   <main class="pe-list sd-pane" aria-labelledby="pe-title">
    <form v-if="inviting" class="pe-invite" aria-label="Invite someone" novalidate @submit.prevent="send" @keydown.esc="closeInvite">
     <p class="pe-invite__title">Invite someone</p>
     <div class="pe-invite__fields">
      <div class="sd-field">
       <label class="sd-label" for="pe-email">Email</label>
       <input
        id="pe-email"
        ref="field"
        v-model="email"
        class="sd-input"
        type="email"
        autocomplete="off"
        placeholder="name@example.com"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? 'pe-error' : undefined"
        @input="error = ''"
       />
       <p v-if="error" id="pe-error" class="pe-error" role="alert"><StudioDemoIcon name="alert-triangle" :size="14" />{{ error }}</p>
      </div>
      <div class="sd-field">
       <label class="sd-label" for="pe-role">Role</label>
       <select id="pe-role" v-model="role" class="sd-input" aria-describedby="pe-role-help">
        <option v-for="entry in GIVEN" :key="entry.key" :value="entry.key">{{ entry.name }}</option>
       </select>
       <p id="pe-role-help" class="sd-help">{{ roleOf(role).can }}.</p>
      </div>
     </div>
     <div class="pe-invite__go">
      <button type="submit" class="sd-btn sd-btn--primary"><StudioDemoIcon name="mail" :size="15" />Send invite</button>
      <button type="button" class="sd-btn sd-btn--ghost" @click="closeInvite">Cancel</button>
      <p class="pe-invite__note">They sign in with a link in their email.</p>
     </div>
    </form>

    <table class="pe-table">
     <caption class="sd-sr">People who can work on the site</caption>
     <thead>
      <tr>
       <th scope="col">Name</th>
       <th scope="col">Email</th>
       <th scope="col">Role</th>
       <th scope="col">Last active</th>
       <th scope="col"><span class="sd-sr">More</span></th>
      </tr>
     </thead>
     <tbody>
      <tr v-for="person in people" :key="person.id" class="pe-row">
       <td class="pe-who">
        <span class="pe-avatar" :class="{ 'is-you': person.you }" aria-hidden="true">{{ initials(person.name) }}</span>
        <span class="pe-name">{{ person.name }}<span v-if="person.you" class="pe-you">you</span></span>
       </td>
       <td class="pe-email">{{ person.email }}</td>
       <td class="pe-role">
        <span v-if="person.role === 'owner'" class="pe-fixed" title="A site has one owner"><StudioDemoIcon name="lock" :size="14" />Owner<span class="sd-sr"> (can't change)</span></span>
        <select v-else class="sd-input pe-select" :value="person.role" :aria-label="`Role for ${person.name}`" @change="changeRole(person, $event.target.value)">
         <option v-for="entry in GIVEN" :key="entry.key" :value="entry.key">{{ entry.name }}</option>
        </select>
       </td>
       <td class="pe-when">{{ person.active }}</td>
       <td class="pe-act">
        <div v-if="person.role !== 'owner'" class="pe-more" @focusout="leaveMenu" @keydown.esc.stop="escMenu($event, person.id)">
         <button
          type="button"
          class="sd-btn sd-btn--ghost sd-btn--icon"
          :aria-label="`More for ${person.name}`"
          aria-haspopup="true"
          :aria-expanded="menu === person.id"
          :aria-controls="`pe-menu-${person.id}`"
          @click="toggleMenu(person.id)"
         >
          <StudioDemoIcon name="ellipsis" :size="16" />
         </button>
         <div v-if="menu === person.id" :id="`pe-menu-${person.id}`" class="pe-menu">
          <button type="button" class="pe-menu__item" @click="remove(person)"><StudioDemoIcon name="trash" :size="14" />Remove from site</button>
         </div>
        </div>
       </td>
      </tr>
     </tbody>
    </table>

    <section class="pe-waiting" aria-labelledby="pe-waiting">
     <h4 id="pe-waiting" class="pe-sub">Invites waiting <span>{{ invites.length }}</span></h4>
     <ul v-if="invites.length">
      <li v-for="invite in invites" :key="invite.id" class="pe-invited" :class="{ 'is-fresh': invite.fresh }" @animationend="invite.fresh = false">
       <span class="pe-avatar pe-avatar--mail" aria-hidden="true"><StudioDemoIcon name="mail" :size="15" /></span>
       <span class="pe-invited__email">{{ invite.email }}</span>
       <span class="pe-invited__role">{{ roleOf(invite.role).name }}</span>
       <span class="pe-when pe-invited__when">Sent {{ invite.sent }}</span>
       <span class="pe-invited__go">
        <button type="button" class="sd-btn sd-btn--ghost" :aria-label="`Resend invite to ${invite.email}`" @click="resend(invite)">Resend</button>
        <button type="button" class="sd-btn sd-btn--ghost sd-btn--danger" :aria-label="`Cancel invite to ${invite.email}`" @click="cancel(invite)">Cancel</button>
       </span>
      </li>
     </ul>
     <p v-else class="pe-none">No invites waiting. Everyone you invited has signed in.</p>
    </section>
   </main>

   <aside class="pe-roles" aria-labelledby="pe-roles">
    <p id="pe-roles" class="pe-roles__bar sd-caps">{{ ROLES.length }} roles</p>
    <ul class="sd-pane pe-roles__list">
     <li v-for="entry in ROLES" :key="entry.key" class="pe-def" :class="{ 'is-open': shown === entry.key }">
      <button type="button" class="pe-def__head" :aria-expanded="shown === entry.key" :aria-controls="`pe-can-${entry.key}`" @click="shown = shown === entry.key ? null : entry.key">
       <span class="pe-def__name">{{ entry.name }}</span>
       <span class="pe-def__can">{{ entry.can }}.</span>
       <StudioDemoIcon :name="shown === entry.key ? 'chevron-up' : 'chevron-down'" :size="16" />
      </button>
      <ul v-if="shown === entry.key" :id="`pe-can-${entry.key}`" class="pe-can" :aria-label="`What ${entry.name.toLowerCase()}s can do`">
       <li v-for="[area, who] in AREAS" :key="area" :class="{ 'is-no': !who.includes(entry.key) }">
        <StudioDemoIcon :name="who.includes(entry.key) ? 'check' : 'minus'" :size="14" />
        <span>{{ area }}</span>
        <span class="sd-sr">{{ who.includes(entry.key) ? 'Yes' : 'No' }}</span>
       </li>
      </ul>
     </li>
    </ul>
    <p class="pe-roles__note">A site has one owner. Everyone else gets the role you pick, and you can change it any time.</p>
   </aside>
  </div>
 </div>
</template>

<style>
 .pe {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
 }

 .pe-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  border-bottom: 1px solid var(--sd-border);
  padding: 0 12px 0 16px;
  background: var(--sd-raised);
 }

 .pe-title {
  white-space: nowrap;
 }

 .pe .pe-panes {
  display: none;
 }

 /* Status, then the main action, always on the right. */
 .pe-status {
  margin-left: auto;
  font: 500 12.5px/1 var(--sd-body);
  color: var(--sd-muted);
  white-space: nowrap;
 }

 .pe-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 296px;
  min-height: 0;
 }

 .pe-list {
  padding-bottom: 32px;
 }

 /* Invite: a soft band across the list, the two fields side by side. */
 .pe-invite {
  border-bottom: 1px solid var(--sd-border);
  padding: 16px 24px 18px;
  background: var(--sd-soft);
  animation: pe-open 0.28s var(--sd-ease);
 }

 @keyframes pe-open {
  from {
   opacity: 0;
   translate: 0 -6px;
  }
 }

 .pe-invite__title {
  margin-bottom: 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--sd-strong);
 }

 .pe-invite__fields {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
 }

 .pe-invite__fields .sd-field + .sd-field {
  margin-top: 0;
 }

 .pe-invite .sd-input {
  background-color: var(--sd-raised);
 }

 .pe-error {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--sd-danger);
 }

 .pe-error .sd-icon {
  margin-top: 1px;
 }

 .pe-invite__go {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
 }

 .pe-invite__note {
  margin-left: auto;
  font-size: 12px;
  color: var(--sd-muted);
 }

 /* Members */
 .pe-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
 }

 .pe-table th {
  height: 36px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 12px;
  font: 500 12.5px/1 var(--sd-body);
  text-align: left;
  color: var(--sd-muted);
 }

 .pe-table :is(th, td):first-child {
  padding-left: 24px;
 }

 .pe-table :is(th, td):last-child {
  width: 56px;
  padding-right: 16px;
 }

 .pe-table td {
  height: 48px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 12px;
  vertical-align: middle;
 }

 .pe-row {
  transition: background-color 0.16s var(--sd-ease);
 }

 .pe-row:is(:hover, :focus-within) {
  background: var(--sd-raised);
 }

 .pe-who {
  white-space: nowrap;
 }

 .pe-name,
 .pe-invited__email {
  font-weight: 600;
  color: var(--sd-strong);
 }

 .pe-avatar {
  display: inline-grid;
  place-items: center;
  flex: none;
  width: 30px;
  height: 30px;
  margin-right: 10px;
  border-radius: 50%;
  background: var(--sd-sunken);
  font: 600 11.5px/1 var(--sd-body);
  color: var(--sd-strong);
  vertical-align: middle;
 }

 .pe-avatar.is-you {
  background: var(--sd-tint);
 }

 .pe-avatar--mail {
  border: 1px dashed color-mix(in srgb, var(--sd-muted) 50%, transparent);
  background: none;
  color: var(--sd-muted);
 }

 .pe-you {
  margin-left: 8px;
  font: 500 12.5px/1 var(--sd-body);
  color: var(--sd-muted);
 }

 .pe-email {
  color: var(--sd-muted);
  overflow-wrap: anywhere;
 }

 .pe-role {
  width: 148px;
 }

 /* Beats .sd-input's full width. */
 .pe .pe-select {
  width: 128px;
  min-height: 32px;
  padding-block: 5px;
 }

 /* A lock, not a select's indent: the owner's role is fixed, so it shouldn't look like a control. */
 .pe-fixed {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--sd-muted);
 }

 .pe-when {
  font-size: 12.5px;
  color: var(--sd-muted);
  white-space: nowrap;
 }

 .pe-act {
  text-align: right;
 }

 .pe-more {
  position: relative;
  display: inline-block;
 }

 .pe-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 4;
  min-width: 180px;
  border: 1px solid var(--sd-border);
  border-radius: 8px;
  padding: 4px;
  background: var(--sd-raised);
  box-shadow: 0 10px 24px -12px rgb(20 40 28 / 0.4);
 }

 .pe-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  border: 0;
  border-radius: 6px;
  padding: 0 10px;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--sd-danger);
  white-space: nowrap;
  cursor: pointer;
 }

 .pe-menu__item:is(:hover, :focus-visible) {
  background: color-mix(in srgb, var(--sd-danger) 9%, transparent);
 }

 /* Invites waiting */
 .pe-waiting {
  margin-top: 28px;
 }

 .pe-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 24px 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--sd-strong);
 }

 .pe-sub span {
  font: 500 12.5px/1 var(--sd-body);
  color: var(--sd-muted);
 }

 .pe-invited {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 100px 120px auto;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 16px 0 24px;
  font-size: 13.5px;
 }

 .pe-invited.is-fresh {
  animation: pe-arrive 1.6s var(--sd-ease);
 }

 @keyframes pe-arrive {
  from {
   background: var(--sd-gold);
  }
 }

 .pe-invited .pe-avatar {
  margin-right: 0;
 }

 .pe-invited__email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
 }

 .pe-invited__go {
  display: flex;
  gap: 2px;
 }

 .pe-none {
  padding: 16px 24px;
  font-size: 13px;
  color: var(--sd-muted);
 }

 /* Roles */
 .pe-roles {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 0;
  border-left: 1px solid var(--sd-rule);
  background: var(--sd-raised);
 }

 .pe-roles__bar {
  display: flex;
  align-items: center;
  height: 40px;
  border-bottom: 1px solid var(--sd-rule);
  padding: 0 16px;
 }

 .pe-roles__list {
  margin: 0;
  padding: 0;
  list-style: none;
 }

 .pe-def {
  border-bottom: 1px solid var(--sd-rule);
 }

 /* An open role is a soft band, its list inside the same band. */
 .pe-def.is-open {
  background: var(--sd-soft);
 }

 .pe-def__head {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  border: 0;
  padding: 10px 16px;
  background: none;
  font: inherit;
  text-align: left;
  color: inherit;
  cursor: pointer;
 }

 .pe-def__head:hover {
  background: var(--sd-sunken);
 }

 /* Inside the pane, so the ring sits inside the row and isn't cut off. */
 .pe-def__head:focus-visible {
  outline-offset: -2px;
 }

 .pe-def__head .sd-icon {
  color: var(--sd-muted);
 }

 .pe-def__name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--sd-strong);
 }

 .pe-def__can {
  font-size: 13px;
  color: var(--sd-muted);
 }

 .pe-can {
  margin: 0;
  padding: 0 16px 12px;
  list-style: none;
 }

 .pe-can li {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 30px;
  font-size: 13px;
  color: var(--sd-strong);
 }

 .pe-can .sd-icon {
  flex: none;
  color: var(--sd-brand);
 }

 .pe-can .is-no {
  color: var(--sd-muted);
 }

 .pe-can .is-no .sd-icon {
  color: var(--sd-faint);
 }

 .pe-roles__note {
  border-top: 1px solid var(--sd-rule);
  padding: 12px 16px;
  font-size: 12px;
  color: var(--sd-muted);
 }

 /* Narrower: the quieter columns go first. */
 @container sd (max-width: 1060px) {
  .pe-main {
   grid-template-columns: minmax(0, 1fr) 248px;
  }

  .pe-table :is(th, td):nth-child(4),
  .pe-invited__when {
   display: none;
  }

  .pe-invited {
   grid-template-columns: auto minmax(0, 1fr) 84px auto;
  }
 }

 /* A phone: one pane at a time, and each person a stacked row. */
 @container sd (max-width: 760px) {
  /* The crumbs already name the room, so the panes take the left. */
  .pe-title {
   display: none;
  }

  .pe .pe-panes {
   display: flex;
  }

  .pe-status {
   display: none;
  }

  .pe-bar .sd-btn--primary {
   margin-left: auto;
  }

  .pe-main {
   grid-template-columns: minmax(0, 1fr);
  }

  .pe[data-pane='people'] .pe-roles,
  .pe[data-pane='roles'] .pe-list {
   display: none;
  }

  .pe-roles {
   border-left: 0;
  }

  .pe-invite {
   padding: 14px 16px 16px;
  }

  .pe-invite__fields {
   grid-template-columns: minmax(0, 1fr);
   gap: 12px;
  }

  .pe-invite__note {
   width: 100%;
   margin-left: 0;
  }

  .pe-table thead {
   display: none;
  }

  .pe-table,
  .pe-table tbody {
   display: block;
  }

  .pe-row {
   display: grid;
   grid-template-columns: auto minmax(0, 1fr) auto;
   grid-template-areas:
    'avatar name act'
    'avatar email act'
    'avatar role act';
   column-gap: 12px;
   row-gap: 2px;
   border-bottom: 1px solid var(--sd-rule);
   padding: 12px 8px 12px 16px;
  }

  .pe-table td {
   display: block;
   height: auto;
   border: 0;
  }

  .pe-table td:is(*, :first-child, :last-child) {
   width: auto;
   padding: 0;
  }

  /* The avatar takes its own column beside the stacked lines. */
  .pe-table td.pe-who {
   display: contents;
  }

  .pe-who .pe-avatar {
   grid-area: avatar;
   margin: 0;
  }

  .pe-name {
   grid-area: name;
   align-self: center;
  }

  .pe-email {
   grid-area: email;
   font-size: 12.5px;
  }

  .pe-role {
   grid-area: role;
   margin-top: 8px;
  }

  .pe .pe-select {
   width: min(100%, 200px);
  }

  .pe-fixed {
   font-size: 12.5px;
   color: var(--sd-muted);
  }

  .pe-act {
   grid-area: act;
   align-self: start;
  }

  .pe-sub {
   padding-inline: 16px;
  }

  .pe-invited {
   grid-template-columns: auto minmax(0, 1fr) auto;
   grid-template-areas:
    'avatar email go'
    'avatar role go';
   row-gap: 2px;
   padding: 12px 8px 12px 16px;
  }

  .pe-invited .pe-avatar {
   grid-area: avatar;
  }

  .pe-invited__email {
   grid-area: email;
  }

  .pe-invited__role {
   grid-area: role;
   font-size: 12.5px;
   color: var(--sd-muted);
  }

  .pe-invited__go {
   grid-area: go;
  }

  .pe-none {
   padding-inline: 16px;
  }
 }
</style>
