// node scripts/check-report.mjs — "Report this site" and paused payments
// (the studio's docs/payments-safety.md): every footer links the report
// page, even with the footer turned off; the relay posts only to the
// studio's report route, stays off on dev and staging and caps the body;
// the form has the hidden bot box and shows visitors' text only as text;
// the pay page says payments are paused. Reads the files; no Nuxt.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

const { REPORT_PATH } = await import('../app/utils/report.js');
assert.equal(REPORT_PATH, '/report-this-site');
const footer = read('app/components/TbSiteFooter.vue');
assert.match(footer, /<footer v-if="footer"[\s\S]*Report this site[\s\S]*<\/footer>\n <p v-else class="tb-site-report"><NuxtLink :to="report" rel="nofollow">Report this site<\/NuxtLink><\/p>/, 'in the footer, and alone when the footer is off');
const relay = read('server/routes/__timbrr/report.post.js');
assert.match(relay, /\/api\/public\/sites\/\$\{encodeURIComponent\(site\)\}\/report`/);
assert.match(relay, /event\.context\.timbrrPreview \|\| !site/, 'off on dev and staging');
assert.match(relay, /body\.length > 8192/);
const page = read('app/pages/report-this-site.vue');
assert.match(page, /\$fetch\('\/__timbrr\/report'/);
assert.match(page, /v-model="hp" tabindex="-1"/);
assert.ok(!/v-html/.test(page));
assert.match(page, /content: 'noindex'/);
assert.match(read('app/pages/pay/[token].vue'), /v-else-if="pay\.paused[^"]*"[^>]*>Payments are paused for this site\./);
console.log('check-report: ok');
