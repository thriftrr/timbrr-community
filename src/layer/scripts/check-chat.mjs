// node scripts/check-chat.mjs — what the site draws for Site chat (the
// studio's docs/site-chat.md): the relay only knows its two routes and stays
// off on dev and staging, the button shows only when the studio says chat is
// on, the dialog always says it's an assistant, and messages are text. Reads
// the files; no Nuxt.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

const relay = read('server/routes/__timbrr/chat/[action].post.js');
assert.match(relay, /const TO = \{ ask: 'chat', handover: 'chat\/handover' \};/, 'two routes, nothing else relayed');
assert.match(relay, /event\.context\.timbrrPreview \|\|/, 'not on dev or staging');
assert.match(relay, /'Cache-Control': 'no-store'/);
assert.match(relay, /body\.length > 4096/, 'body capped');

const page = read('app/composables/page.js');
assert.match(page, /chat: value\.chat && typeof value\.chat\.name === 'string'/, 'an older studio sends no chat: no button');
assert.match(read('app/pages/[...slug].vue'), /<LazyTbSiteChat v-if="site\.chat"/, 'loaded only when on');

const chat = read('app/components/TbSiteChat.vue');
assert.match(chat, /An assistant\. Not a person\. Chats are kept 90 days\./, 'always says it is an assistant');
assert.match(chat, /<dialog /, 'a native modal dialog: focus stays in it, Esc closes');
assert.match(chat, /aria-live="polite"/);
assert.ok(!chat.includes('v-html'), 'messages are drawn as text');
assert.match(chat, /sessionStorage/);
assert.ok(!/document\.cookie|localStorage/.test(chat), 'no cookie, nothing kept past the tab');
console.log('check-chat: ok');
