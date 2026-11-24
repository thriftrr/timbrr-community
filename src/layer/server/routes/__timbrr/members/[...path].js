import { defineEventHandler, getRouterParam, readRawBody, setResponseHeaders, setResponseStatus } from 'h3';
import { askMembers, clearMemberCookie, isMemberToken, setMemberCookie } from '../../../utils/members.js';

// /__timbrr/members/*: signing in and a member's account on the site (the
// studio's docs/members.md). POST start, verify, signout, join, portal; GET
// me, plans. The browser only talks to the site; this relays to the studio
// with the relay secret, the visitor's address and the member's session from
// this site's own cookie, never cached. verify sets the cookie, signout
// clears it. Members run only on the live site: a dev or staging address
// answers that signing in opens once it's live (owners use Preview as).
const POSTS = ['start', 'verify', 'signout', 'join', 'portal'];
const GETS = ['me', 'plans'];

function answer(event, status, body) {
 setResponseStatus(event, status);
 return body;
}

export default defineEventHandler(async (event) => {
 setResponseHeaders(event, { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
 const path = String(getRouterParam(event, 'path') ?? '');
 if (event.context.timbrrPreview) return answer(event, 404, { statusCode: 404, message: 'Signing in opens once the site is live. Use Preview as in the studio to see what members see.' });
 const post = event.method === 'POST';
 if (!(post ? POSTS.includes(path) : event.method === 'GET' && GETS.includes(path))) return answer(event, 404, { statusCode: 404, message: "That page doesn't exist." });
 const body = post ? ((await readRawBody(event, 'utf8')) ?? '{}') : undefined;
 if (body && body.length > 2048) return answer(event, 413, { statusCode: 413, message: 'That is too much to send.' });
 const { status, data } = await askMembers(event, path, { method: event.method, body });
 if (path === 'verify' && status === 200 && isMemberToken(data?.token)) {
  setMemberCookie(event, data.token, data.days);
  // The token stays here; the browser gets who signed in.
  return { member: data.member ?? null };
 }
 if (path === 'signout' || (status === 401 && path === 'me')) clearMemberCookie(event);
 return answer(event, status, data);
});
