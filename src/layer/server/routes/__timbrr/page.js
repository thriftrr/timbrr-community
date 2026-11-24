import { defineEventHandler, getQuery, setResponseHeaders, setResponseStatus } from 'h3';
import { fetchPublished, normalizePagePath } from '../../utils/studio.js';
import { askMembers, giftToken, isMemberToken, memberToken, setGiftCookie } from '../../utils/members.js';

// /__timbrr/page?path=/about: this site's published page at that address,
// exactly as the studio's public read API sends it, { site, page }
// (docs/manifest.md § 6), kept a minute at the edge. The site's page
// (pages/[...slug].vue) asks for it, on the server for a first visit and
// from the browser as a visitor moves between pages. No page there, or no
// site set up here, is a 404; the studio failing is a 502. Either way the
// answer is { statusCode, message }, and for an old address of an entry's
// `data.redirect: { to, status }` too. On a dev or staging address it's the
// draft instead, never cached, and a 401 once the visitor's access has gone.
//
// Members (the studio's docs/members.md): the published answer only ever
// holds a locked page's teaser. When it says something is locked
// (`page.access.locked`, or `page.membersSections`) and the visitor holds a
// member cookie or a gift, the page is read again for them from the studio's
// uncached members read, and that answer is never kept. `gift` (a gift
// link's ?gift=) is spent once, then kept in a cookie for a day. `as` (Preview
// as) passes through on a dev or staging address only.
export default defineEventHandler(async (event) => {
 const query = getQuery(event);
 const path = normalizePagePath(query.path);
 const preview = Boolean(event.context.timbrrPreview);
 const as = preview && /^[A-Za-z0-9_-]{1,64}$/.test(String(query.as ?? '')) ? `&as=${encodeURIComponent(query.as)}` : '';
 let answer = path ? await fetchPublished(event, `page?path=${encodeURIComponent(path)}${as}`) : { status: 404 };
 let found = answer.status === 200 && Boolean(answer.data.page) && typeof answer.data.page === 'object';
 const page = found ? answer.data.page : null;
 const gated = Boolean(page?.access || page?.membersSections);
 let personal = false;
 if (found && gated && !preview) {
  let gift = giftToken(event);
  const asked = String(query.gift ?? '');
  if (page.access?.locked && isMemberToken(asked) && asked !== gift) {
   const spent = await askMembers(event, 'gift', { method: 'POST', body: { token: asked }, token: '' });
   if (spent.status === 200) {
    gift = asked;
    setGiftCookie(event, gift);
   }
  }
  const token = memberToken(event);
  if (token || gift) {
   const mine = await askMembers(event, `page?path=${encodeURIComponent(path)}`, { token, gift });
   if (mine.status === 200 && mine.data?.page) {
    answer = { status: 200, data: mine.data };
    personal = true;
   }
  }
 }
 found = answer.status === 200 && Boolean(answer.data.page) && typeof answer.data.page === 'object';
 const status = found ? 200 : answer.status === 404 || answer.status === 401 ? answer.status : 502;
 setResponseHeaders(event, {
  // A page with anything members-only is never kept by the browser, so
  // signing in shows the whole page at once.
  'Cache-Control': status === 502 || preview || personal || gated ? 'private, no-store' : 'public, max-age=60',
  'X-Robots-Tag': 'noindex',
 });
 if (found) return answer.data;
 setResponseStatus(event, status);
 if (status === 401) return { statusCode: 401, message: 'Sign in to see this site.' };
 // An old address of an entry's: the page says where it lives now, and the site's page sends the visitor there.
 return status === 404
  ? { statusCode: 404, message: "That page doesn't exist.", ...(answer.redirect ? { data: { redirect: answer.redirect } } : {}) }
  : { statusCode: 502, message: "Couldn't get this page from the studio. Try again in a minute." };
});
