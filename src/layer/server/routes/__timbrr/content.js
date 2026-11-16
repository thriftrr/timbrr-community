import { defineEventHandler, getQuery, setResponseHeaders, setResponseStatus } from 'h3';
import { fetchPublished } from '../../utils/studio.js';

// /__timbrr/content?type=events&…: a list of this site's published content
// entries, exactly as the studio's public read API sends it (docs/README.md
// § Content), kept a minute at the edge. The Content list block asks for
// it. Only the parameters the studio reads are passed on, each cut to a
// sane length. No such type, or no site set up here, is a 404; the studio
// failing a 502. On a dev or staging address it's every entry's working
// copy, never cached.
const PARAMS = ['type', 'sort', 'dir', 'limit', 'p', 'ff', 'fo', 'fv', 'show', 'tx', 'tm', 'rel'];

export default defineEventHandler(async (event) => {
 const asked = getQuery(event);
 const query = new URLSearchParams();
 for (const key of PARAMS) if (typeof asked[key] === 'string' && asked[key]) query.set(key, asked[key].slice(0, 400));
 const answer = query.get('type') ? await fetchPublished(event, `content?${query}`) : { status: 404 };
 const status = answer.status === 200 ? 200 : answer.status === 404 || answer.status === 401 ? answer.status : 502;
 setResponseHeaders(event, {
  'Cache-Control': status === 502 || event.context.timbrrPreview ? 'no-store' : 'public, max-age=60',
  'X-Robots-Tag': 'noindex',
 });
 if (status === 200) return answer.data;
 setResponseStatus(event, status);
 return status === 404 ? { statusCode: 404, message: "That list doesn't exist." } : { statusCode: status, message: status === 401 ? 'Sign in to see this site.' : "Couldn't get this list from the studio. Try again in a minute." };
});
