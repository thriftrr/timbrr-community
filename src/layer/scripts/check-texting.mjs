// node scripts/check-texting.mjs — what the site draws for texting (the
// studio's docs/texting.md): the Booking and Order blocks show the "Text me"
// box only when the studio says the site can text, never ticked for them,
// send textOk with the rest, and need the phone only once it's ticked. The
// relays pass the body as is, capped. Reads the files; no Nuxt.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

for (const [file, model, source] of [
 ['app/components/blocks/Booking.global.vue', 'guest', 'list'],
 ['app/components/blocks/Order.global.vue', 'who', 'menu'],
]) {
 const view = read(file);
 assert.match(view, new RegExp(`${model} = reactive\\(\\{[^}]*textOk: false`), `${file}: never ticked for them`);
 assert.match(view, new RegExp(`v-if="${source}\\?\\.texting"`), `${file}: only when the site can text`);
 assert.match(view, new RegExp(`v-model="${model}\\.textOk" type="checkbox"`), `${file}: a real checkbox`);
 assert.match(view, new RegExp(`\\{\\{ ${source}\\.texting\\.consent \\}\\}`), `${file}: the studio's consent words, as text`);
 assert.match(view, new RegExp(`:required="${model}\\.textOk"`), `${file}: phone only needed once ticked`);
 assert.match(view, new RegExp(`\\.\\.\\.${model},`), `${file}: textOk goes with the body`);
}
assert.match(read('server/routes/__timbrr/bookings/[...path].js'), /body\.length > 4096/, 'booking relay caps the body');
assert.match(read('server/routes/__timbrr/ordering/[...path].js'), /body\.length > \d+/, 'order relay caps the body');
console.log('Texting checks passed.');
