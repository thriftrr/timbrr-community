import { getHeader, getRequestIP } from 'h3';

// The address a visitor's limits count, the way the studio's rate.js counts
// one. IPv4 stays whole. An IPv6 visitor gets a whole /64 (every VPS and home
// line has one), so rotating through it doesn't buy a fresh limit per request:
// "::" is expanded and only the first four groups are kept.
export function addressOf(raw) {
 const ip = String(raw ?? 'unknown').toLowerCase().split('%')[0];
 if (!ip.includes(':')) return ip;
 const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(ip);
 if (mapped) return mapped[1];
 const [head, tail] = ip.split('::');
 const left = head ? head.split(':') : [];
 const right = tail ? tail.split(':') : [];
 const groups = tail === undefined ? left : [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right];
 return `${groups.slice(0, 4).map((group) => group.replace(/^0+(?=.)/, '')).join(':')}::/64`;
}

export function visitorAddress(event) {
 return addressOf(getHeader(event, 'cf-connecting-ip') ?? getRequestIP(event) ?? '');
}
