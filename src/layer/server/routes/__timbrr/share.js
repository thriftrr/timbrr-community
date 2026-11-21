import { defineEventHandler, getQuery, setResponseHeaders, setResponseStatus } from 'h3';
import { fetchPublished } from '../../utils/studio.js';
import { SHARE_SLUG } from '../../utils/share.js';

// /__timbrr/share?slug=cake-order: the form with that share address,
// { site, form } as the studio's public read sends it (the site as its header
// and footer draw it, the form's live copy as a visitor gets it), kept a minute
// at the edge like a page. The share page (pages/f/[slug].vue) asks for it. A
// link that's off, one that never was and a form that isn't live are all a 404,
// which the page shows as "This form is closed"; the studio failing is a 502.
// On a dev or staging address it's the form's working copy, never cached.
export default defineEventHandler(async (event) => {
 const slug = String(getQuery(event).slug ?? '').toLowerCase();
 const answer = SHARE_SLUG.test(slug) ? await fetchPublished(event, `share/${encodeURIComponent(slug)}`) : { status: 404 };
 const found = answer.status === 200 && Array.isArray(answer.data.form?.fields);
 const status = found ? 200 : answer.status === 404 || answer.status === 401 ? answer.status : 502;
 setResponseHeaders(event, {
  'Cache-Control': status === 502 || event.context.timbrrPreview ? 'no-store' : 'public, max-age=60',
  'X-Robots-Tag': 'noindex',
 });
 if (found) return answer.data;
 setResponseStatus(event, status);
 if (status === 401) return { statusCode: 401, message: 'Sign in to see this site.' };
 return status === 404 ? { statusCode: 404, message: 'This form is closed.' } : { statusCode: 502, message: "Couldn't get this form from the studio. Try again in a minute." };
});
