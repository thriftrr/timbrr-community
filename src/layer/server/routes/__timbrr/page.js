import { defineEventHandler, getQuery, setResponseHeaders, setResponseStatus } from 'h3';
import { fetchPublished, normalizePagePath } from '../../utils/studio.js';

// /__timbrr/page?path=/about: this site's published page at that address,
// exactly as the studio's public read API sends it, { site, page }
// (docs/manifest.md § 6), kept a minute at the edge. The site's page
// (pages/[...slug].vue) asks for it, on the server for a first visit and
// from the browser as a visitor moves between pages. No page there, or no
// site set up here, is a 404; the studio failing is a 502. Either way the
// answer is { statusCode, message }. On a dev or staging address it's the
// draft instead, never cached, and a 401 once the visitor's access has gone.
export default defineEventHandler(async (event) => {
 const path = normalizePagePath(getQuery(event).path);
 const answer = path ? await fetchPublished(event, `page?path=${encodeURIComponent(path)}`) : { status: 404 };
 const found = answer.status === 200 && Boolean(answer.data.page) && typeof answer.data.page === 'object';
 const status = found ? 200 : answer.status === 404 || answer.status === 401 ? answer.status : 502;
 setResponseHeaders(event, {
  'Cache-Control': status === 502 || event.context.timbrrPreview ? 'no-store' : 'public, max-age=60',
  'X-Robots-Tag': 'noindex',
 });
 if (found) return answer.data;
 setResponseStatus(event, status);
 if (status === 401) return { statusCode: 401, message: 'Sign in to see this site.' };
 return status === 404
  ? { statusCode: 404, message: "That page doesn't exist." }
  : { statusCode: 502, message: "Couldn't get this page from the studio. Try again in a minute." };
});
