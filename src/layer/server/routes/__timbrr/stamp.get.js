import { defineEventHandler, getQuery, setResponseHeaders, setResponseStatus } from 'h3';
import { fetchStamp, normalizePagePath } from '../../utils/studio.js';

// /__timbrr/stamp?path=/about, on a dev or staging address only: { stamp },
// a short string that changes when the draft of that page does. The page
// asks every two seconds (useTimbrrPage) and reads the page again only when
// it's different. The studio checks the visitor's token each time; anywhere
// else this is a 404. Never cached.
export default defineEventHandler(async (event) => {
 setResponseHeaders(event, { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
 const path = normalizePagePath(getQuery(event).path);
 const answer = path ? await fetchStamp(event, path) : { status: 404 };
 if (answer.status === 200) return { stamp: answer.stamp };
 setResponseStatus(event, answer.status);
 return { statusCode: answer.status };
});
