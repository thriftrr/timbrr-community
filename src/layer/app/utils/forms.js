// The visitor's half of a form's rules: steps, show/hide rules, totals and what
// to say about an answer. This is a copy of the same functions in the studio's
// shared/utils/forms.js, so a person hears about a mistake without waiting, and
// the studio checks everything again from its own copy when the form arrives.
// Its scripts/check-forms.mjs holds the two to the same answers, so change them
// together.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NO_ANSWER = ['page', 'calc', 'hidden'];
const has = (value) => value !== undefined && value !== null && value !== '';
const list = (value) => (Array.isArray(value) ? value : []);

export const isFormInput = (field) => !NO_ANSWER.includes(field.type);

export function isFormEmail(value) {
 return typeof value === 'string' && value.length <= 254 && EMAIL.test(value) && !/[\r\n]/.test(value);
}

export function formSteps(doc) {
 const steps = [{ title: doc.stepOne || 'Step one', fields: [] }];
 for (const field of doc.fields) {
  if (field.type !== 'page') steps.at(-1).fields.push(field);
  else if (doc.advanced) steps.push({ title: field.label, fields: [] });
 }
 return steps;
}

export function formFieldVisible(doc, field, answers) {
 if (!doc.advanced || !field.rule?.field) return true;
 const { field: other, op, value } = field.rule;
 const answer = answers[other];
 const filled = Array.isArray(answer) ? answer.length > 0 : has(answer) && answer !== false;
 if (op === 'filled') return filled;
 const is = Array.isArray(answer) ? answer.includes(value) : answer === value;
 return op === 'is' ? is : !is;
}

function numberOf(field, answers) {
 const answer = answers[field.id];
 if (field.type === 'number') return parseFloat(answer) || 0;
 if (field.type === 'radio' || field.type === 'select') return Number((field.options ?? []).find((option) => option.l === answer)?.v) || 0;
 if (field.type === 'checkbox') {
  return (field.options ?? []).filter((option) => list(answer).includes(option.l)).reduce((sum, option) => sum + (Number(option.v) || 0), 0);
 }
 return 0;
}

export function formCalcValue(doc, field, answers) {
 let total = 0;
 list(field.terms).forEach((term, index) => {
  const other = doc.fields.find((entry) => entry.id === term.field);
  const value = other && other.type !== 'calc' && formFieldVisible(doc, other, answers) ? numberOf(other, answers) : 0;
  if (index === 0) total = value;
  else if (term.op === '×') total *= value;
  else if (term.op === '−') total -= value;
  else if (term.op === '÷') total = value ? total / value : total;
  else total += value;
 });
 return total;
}

export function formMoney(value) {
 return (Number(value) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

const EMPTY_MESSAGE = {
 name: 'Enter your name.',
 email: 'Enter your email address.',
 phone: 'Enter a phone number we can reach you at.',
 consent: 'Tick this box to continue.',
 radio: 'Pick one to continue.',
 select: 'Pick one to continue.',
 checkbox: 'Pick at least one.',
 file: 'Add a file to continue.',
 date: 'Pick a date.',
};

export function formFieldError(doc, field, answers, today) {
 if (!isFormInput(field)) return '';
 const answer = answers[field.id];
 const empty = !has(answer) || answer === false || (Array.isArray(answer) && !answer.length);
 if (empty) return field.required ? (EMPTY_MESSAGE[field.type] ?? 'Fill this in to continue.') : '';
 if (field.type === 'email' && !isFormEmail(answer)) return 'Enter a full email address, like name@company.com.';
 if (!doc.advanced) return '';
 const valid = field.valid ?? {};
 if (field.type === 'number') {
  const number = parseFloat(answer);
  if (Number.isNaN(number)) return 'Enter a number.';
  if ((has(valid.min) && number < valid.min) || (has(valid.max) && number > valid.max)) return `Enter a number from ${has(valid.min) ? valid.min : 0} to ${has(valid.max) ? valid.max : 'any'}.`;
 }
 if (has(valid.minLen) && String(answer).length < valid.minLen) return `Use at least ${valid.minLen} characters.`;
 if (has(valid.maxLen) && String(answer).length > valid.maxLen) return `Keep it to ${valid.maxLen} characters or fewer.`;
 if (field.type === 'date' && has(valid.minDays)) {
  const soonest = new Date(`${today}T12:00:00Z`);
  soonest.setUTCDate(soonest.getUTCDate() + valid.minDays);
  if (new Date(`${answer}T12:00:00Z`) < soonest) return `Pick a date at least ${valid.minDays} days from today.`;
 }
 if (valid.pattern === 'zip' && !/^\d{5}$/.test(answer)) return 'Enter a 5-digit ZIP code, like 55408.';
 if (valid.pattern === 'digits' && !/^\d+$/.test(answer)) return 'Use numbers only.';
 if (valid.pattern === 'letters' && !/^[A-Za-z\s'’-]+$/.test(answer)) return 'Use letters only.';
 return '';
}
