import { createError, defineEventHandler, getQuery, getRequestURL, sendRedirect, setCookie } from 'h3';
import { PREVIEW_COOKIE, exchangeCode, gateUrl } from '../../utils/preview.js';

// Where the studio's gate sends someone it let through: /__timbrr/enter
// ?code=…&next=/about. The code is swapped, server to server, for the token
// kept in a cookie on this address, which only this Worker can read. A code
// that's been spent or has run out goes back to the gate. Only a path on
// this address is a place to land.
const LOCAL = /^(?:localhost|127\.0\.0\.1|\[::1\])$|\.localhost$/;

export default defineEventHandler(async (event) => {
 const target = event.context.timbrrPreview;
 if (!target) throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
 const { code, next } = getQuery(event);
 const path = typeof next === 'string' && /^\/(?![/\\])/.test(next) && !/[\s\\]/.test(next) ? next : '/';
 const pass = typeof code === 'string' && code ? await exchangeCode(event, target.slug, code) : null;
 if (!pass) return sendRedirect(event, gateUrl(event, target, path), 302);
 setCookie(event, PREVIEW_COOKIE, pass.token, {
  httpOnly: true,
  secure: !LOCAL.test(getRequestURL(event).hostname),
  sameSite: 'lax',
  path: '/',
  maxAge: pass.maxAge,
 });
 return sendRedirect(event, path, 302);
});
