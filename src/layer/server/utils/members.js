import { deleteCookie, getCookie, getRequestURL, setCookie } from 'h3';
import { useRuntimeConfig } from '#imports';
import { studioApi } from './preview.js';
import { visitorAddress } from './visitor.js';

// Members (the studio's docs/members.md): a visitor's sign-in lives in this
// site's own httpOnly cookie (tb_member), set here from the token the studio
// answers a sign-in with, and passed back to the studio as x-timbrr-member.
// The browser never sees it. A gift link's token rides in tb_gift for a day,
// so reloading a gifted entry isn't a second use.
export const MEMBER_COOKIE = 'tb_member';
export const GIFT_COOKIE = 'tb_gift';
const TOKEN = /^[A-Za-z0-9_-]{16,128}$/;
const LOCAL = /^(?:localhost|127\.0\.0\.1|\[::1\])$/;
const WAIT = 15000;

const cookieOptions = (event, maxAge) => ({ httpOnly: true, secure: !LOCAL.test(getRequestURL(event).hostname), sameSite: 'lax', path: '/', maxAge });

export const memberToken = (event) => {
 const value = getCookie(event, MEMBER_COOKIE) ?? '';
 return TOKEN.test(value) ? value : '';
};
export const giftToken = (event) => {
 const value = getCookie(event, GIFT_COOKIE) ?? '';
 return TOKEN.test(value) ? value : '';
};
export const isMemberToken = (value) => TOKEN.test(String(value ?? ''));
export const setMemberCookie = (event, token, days) => setCookie(event, MEMBER_COOKIE, token, cookieOptions(event, Math.max(1, Math.min(30, Number(days) || 30)) * 86_400));
export const clearMemberCookie = (event) => deleteCookie(event, MEMBER_COOKIE, cookieOptions(event, 0));
export const setGiftCookie = (event, token) => setCookie(event, GIFT_COOKIE, token, cookieOptions(event, 86_400));

// One call to the studio's members routes for this site, as { status, data }
// ({ status: 502 } when it can't be reached). Never cached.
export async function askMembers(event, path, { method = 'GET', body, token = memberToken(event), gift = '' } = {}) {
 const config = useRuntimeConfig(event);
 const site = String(config.public.site ?? '').trim();
 const api = studioApi(event);
 if (!site || !/^https?:\/\/[^/]/.test(api)) return { status: 404, data: { statusCode: 404, message: "That page doesn't exist." } };
 const headers = {
  accept: 'application/json',
  ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
  'x-timbrr-visitor': visitorAddress(event),
  ...(config.timbrr?.relaySecret ? { 'x-timbrr-relay': config.timbrr.relaySecret } : {}),
  ...(token ? { 'x-timbrr-member': token } : {}),
  ...(gift ? { 'x-timbrr-gift': gift } : {}),
 };
 try {
  const res = await fetch(`${api}/api/public/sites/${encodeURIComponent(site)}/members/${path}`, { method, headers, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body), signal: AbortSignal.timeout(WAIT) });
  const text = await res.text();
  let data = null;
  try {
   data = JSON.parse(text);
  } catch {
   data = { statusCode: res.status, message: 'The studio sent something unexpected.' };
  }
  return { status: res.status, data };
 } catch (error) {
  console.error(`[timbrr] Couldn't reach the studio for members/${path} on ${site}: ${error.message}`);
  return { status: 502, data: { statusCode: 502, message: "Couldn't reach the sign-in service. Try again in a minute." } };
 }
}
