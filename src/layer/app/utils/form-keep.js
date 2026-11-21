// A multi-step form's answers kept in the visitor's own browser, so a phone
// that went to sleep half way through doesn't lose them (TbForm; the studio's
// docs/forms.md, "Saved progress"). Nothing goes to the studio or the site:
// localStorage, under a key made from the host, the form and a fingerprint of
// its fields, so a form that changed starts clean. Never a file. A copy goes
// after seven days, when the form is sent, or on Start again.

export const KEEP_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;
const PREFIX = 'tb-form:';
const SKIPPED = ['page', 'calc', 'file', 'hidden'];

// A short hash of what a visitor can fill in, so a changed form doesn't take an old copy.
export function keepFingerprint(form) {
 const text = JSON.stringify((form.fields ?? []).map((field) => [field.id, field.type, field.label, (field.options ?? []).map((option) => option.l)]));
 let hash = 5381;
 for (let at = 0; at < text.length; at++) hash = ((hash * 33) ^ text.charCodeAt(at)) >>> 0;
 return hash.toString(36);
}

export const keepKey = (host, form) => `${PREFIX}${host}:${form.id}:${keepFingerprint(form)}`;

// What may be kept of the answers: text, ticks and lists of choices. Never a
// file, and nothing a link filled in behind the visitor's back (hidden).
export function keepable(form, values) {
 const out = {};
 for (const field of form.fields ?? []) {
  if (SKIPPED.includes(field.type)) continue;
  const value = restorable(field, values[field.id]);
  if (value !== undefined) out[field.id] = value;
 }
 return out;
}

// The answer as this field can take it back, or undefined for one it can't.
function restorable(field, value) {
 if (SKIPPED.includes(field.type) || value === undefined || value === null || value === '') return undefined;
 // A number box holds a number once typed in (v-model's own cast).
 if (field.type === 'number') return Number.isFinite(value) || (typeof value === 'string' && value.length <= 40) ? value : undefined;
 const choices = (field.options ?? []).map((option) => option.l);
 if (field.type === 'consent') return value === true ? true : undefined;
 if (field.type === 'radio' || field.type === 'select') return typeof value === 'string' && choices.includes(value) ? value : undefined;
 if (field.type === 'checkbox') {
  const picked = Array.isArray(value) ? value.filter((entry) => choices.includes(entry)) : [];
  return picked.length ? picked : undefined;
 }
 return typeof value === 'string' ? value.slice(0, 5000) : undefined;
}

// What was stored, if it is still good: { at, step, values } with the step
// inside the form and only answers its fields can take, or null.
export function readKept(raw, form, stepCount, now = Date.now()) {
 let kept;
 try {
  kept = JSON.parse(raw);
 } catch {
  return null;
 }
 if (!kept || typeof kept !== 'object' || !Number.isFinite(kept.at) || now - kept.at > KEEP_DAYS * DAY || kept.at > now + DAY) return null;
 const values = {};
 for (const field of form.fields ?? []) {
  const value = restorable(field, kept.values?.[field.id]);
  if (value !== undefined) values[field.id] = value;
 }
 if (!Object.keys(values).length) return null;
 const step = Number.isInteger(kept.step) ? Math.min(Math.max(kept.step, 0), stepCount - 1) : 0;
 return { at: kept.at, step, values };
}

// "earlier today", "yesterday", "3 days ago", by the visitor's own calendar days.
export function keptWhen(at, now = Date.now()) {
 const day = (time) => new Date(time).setHours(0, 0, 0, 0);
 const days = Math.round((day(now) - day(at)) / DAY);
 return days <= 0 ? 'earlier today' : days === 1 ? 'yesterday' : `${days} days ago`;
}

// Copies past their week, of any form: the ones nobody came back to.
export function sweepKept(storage, now = Date.now()) {
 for (const key of Object.keys(storage)) {
  if (!key.startsWith(PREFIX)) continue;
  try {
   const at = JSON.parse(storage.getItem(key))?.at;
   if (!Number.isFinite(at) || now - at > KEEP_DAYS * DAY) storage.removeItem(key);
  } catch {
   storage.removeItem(key);
  }
 }
}
