// Checks which not-found addresses get reported to the studio, and what is
// sent, with no build, server or studio (fetch is a stand-in):
//   node layer/scripts/check-missed.mjs
import { deepEqual, equal } from 'node:assert/strict';

const { missedPath, reportMissed } = await import('../app/utils/missed.js');
const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1';

equal(missedPath({ pathname: '/old-menu', userAgent: ua }), '/old-menu');
equal(missedPath({ pathname: '/a/b/', userAgent: ua }), '/a/b/');
equal(missedPath({ pathname: `/${'x'.repeat(400)}`, userAgent: ua }).length, 300);
for (const pathname of ['/logo.png', '/wp-login.php', '/sitemap.xml', '/_nuxt/x', '/api/x', '/.well-known/x', '/__timbrr/page']) equal(missedPath({ pathname, userAgent: ua }), '', pathname);
for (const agent of ['Googlebot/2.1', 'Mozilla/5.0 (compatible; bingbot)', 'Baiduspider', 'Yahoo! Slurp', 'Slack-ImgProxy link preview', 'SomeCrawler']) equal(missedPath({ pathname: '/old-menu', userAgent: agent }), '', agent);
equal(missedPath({ method: 'POST', pathname: '/old-menu', userAgent: ua }), '');
equal(missedPath({ pathname: '/v1.2/menu', userAgent: ua }), '/v1.2/menu', 'a dot in a folder is not an extension');
for (const pathname of ['/menu.html', '/about/team.HTM']) equal(missedPath({ pathname, userAgent: ua }), pathname, `an old website's page counts: ${pathname}`);
equal(missedPath({ pathname: '/menu.html.bak', userAgent: ua }), '', 'a file that only starts like a page does not');

const calls = [];
const studio = async (url, init) => (calls.push({ url, init }), { ok: true, status: 204 });
equal(await reportMissed({ api: 'http://studio.test', site: 'north wall', path: '/old-menu', fetch: studio }), true);
equal(calls[0].url, 'http://studio.test/api/public/sites/north%20wall/missed');
equal(calls[0].init.method, 'POST');
deepEqual(JSON.parse(calls[0].init.body), { path: '/old-menu' });
equal(await reportMissed({ api: 'http://studio.test', site: 'north', path: '', fetch: studio }), false);
equal(await reportMissed({ api: '', site: 'north', path: '/x', fetch: studio }), false);
equal(await reportMissed({ api: 'http://studio.test', site: '', path: '/x', fetch: studio }), false);
equal(await reportMissed({ api: 'http://studio.test', site: 'north', path: '/x', fetch: async () => { throw new Error('down'); } }), false);
equal(calls.length, 1);
console.log('ok  check-missed');
