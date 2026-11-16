// When a field applies: the `when` a block's definition puts on a field, a
// list row's field, or one option of a choice (timbrr-community,
// docs/manifest.md § Conditional fields). The studio's inspector and the
// site's own code ask the same question with the same code: this file is
// kept identical in timbrr (src/app/shared/utils/when.js) and
// timbrr-community (src/layer/app/utils/when.js). scripts/check-when.mjs in
// the studio fails when the two differ.
//
//   when  := { key: cond, …, any?: [when, …] }   every key must hold; `any`
//                                                 holds when one of its whens does
//   cond  := value | [value, …]                   equals; one of
//          | { not: cond }                        the opposite
//          | { filled: true | false }             has something in it, or nothing
//   key   := 'layout'                             in a list row or a group: the row's own key
//                                                 if it has one, else the block's
//          | '^layout'                            the block's, always
//
// Values compare as text, so a stepper's 3 matches '3' and a switch's true
// matches 'true'. A key that holds a list (checks, tags) equals a value when
// the list has it. A field that doesn't apply isn't shown and isn't drawn;
// its data stays as it is.
//
// A `when` this code doesn't understand (a newer site's operator) applies:
// better a field too many than one nobody can reach. `whenProblem` is for
// whoever checks a manifest, and says what's wrong instead.

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isPlain = (value) => ['string', 'number', 'boolean'].includes(typeof value);

// Rich text counts by its words, a picture by its address, a list by its rows.
export function isFilled(value) {
 if (typeof value === 'string') return value.trim() !== '';
 if (Array.isArray(value)) return value.length > 0;
 if (isObject(value)) {
  if ('src' in value) return isFilled(value.src);
  // A rich-text node: its words, or its children's.
  if (typeof value.type === 'string') return typeof value.text === 'string' ? value.text.trim() !== '' : (value.content ?? []).some(isFilled);
  return Object.values(value).some(isFilled);
 }
 return value !== undefined && value !== null && value !== false;
}

function condProblem(cond) {
 if (isPlain(cond)) return '';
 if (Array.isArray(cond)) return cond.length && cond.every(isPlain) ? '' : 'a list of values must hold text, numbers or true/false, and at least one';
 if (!isObject(cond)) return 'a condition must be a value, a list of values, { not } or { filled }';
 const keys = Object.keys(cond);
 if (keys.length !== 1) return 'a condition holds one of not or filled';
 if (keys[0] === 'not') return condProblem(cond.not);
 if (keys[0] === 'filled') return typeof cond.filled === 'boolean' ? '' : 'filled is true or false';
 return `unknown operator "${keys[0]}"`;
}

// '' when `when` is well formed, or what's wrong with it.
export function whenProblem(when) {
 if (!isObject(when)) return 'when must be an object of key: condition';
 if (!Object.keys(when).length) return 'when names no key';
 for (const [key, cond] of Object.entries(when)) {
  if (key === 'any') {
   if (!Array.isArray(cond) || !cond.length) return 'any is a list of whens, and at least one';
   const inner = cond.map(whenProblem).find(Boolean);
   if (inner) return inner;
  } else {
   const problem = condProblem(cond);
   if (problem) return `${key}: ${problem}`;
  }
 }
 return '';
}

// Every key a well-formed `when` reads, with the values it compares it to:
// [{ key: '^layout', values: ['split'] }]. For checking them against a
// block's fields.
export function whenTerms(when) {
 const values = (cond) => (isObject(cond) ? ('not' in cond ? values(cond.not) : []) : [].concat(cond));
 return Object.entries(when).flatMap(([key, cond]) => (key === 'any' ? cond.flatMap(whenTerms) : [{ key, values: values(cond) }]));
}

function holds(cond, value) {
 if (!isObject(cond)) return [].concat(cond).some((want) => [].concat(value).map(String).includes(String(want)));
 return 'not' in cond ? !holds(cond.not, value) : isFilled(value) === cond.filled;
}

function read(key, data, root) {
 if (key.startsWith('^')) return root?.[key.slice(1)];
 return isObject(data) && Object.hasOwn(data, key) ? data[key] : root?.[key];
}

function applies(when, data, root) {
 return Object.entries(when).every(([key, cond]) => (key === 'any' ? cond.some((one) => applies(one, data, root)) : holds(cond, read(key, data, root))));
}

// Whether a field (or an option) with this `when` applies. `data` is what
// its keys read: the block's data, or a row's inside a list. `root` is the
// block's data, which is `data` itself at the top.
export function fieldApplies(when, data, root = data) {
 if (when === undefined || when === null || whenProblem(when)) return true;
 return applies(when, data, root);
}

// The fields of `fields` that apply, each choice with only the options that
// do. An option that's the field's value now always stays, so what's
// chosen is never missing from its own list.
export function fieldsThatApply(fields, data, root = data) {
 return (fields ?? [])
  .filter((field) => fieldApplies(field.when, data, root))
  .map((field) => {
   if (!field.options?.some((option) => option.when)) return field;
   return { ...field, options: field.options.filter((option) => option.value === data?.[field.key] || fieldApplies(option.when, data, root)) };
  });
}
