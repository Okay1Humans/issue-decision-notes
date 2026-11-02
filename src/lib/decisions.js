export const MAX_DECISIONS = 50;
export const DEFAULT_MAX_LENGTH = 500;
export const MIN_ALLOWED_LENGTH = 200;
export const MAX_ALLOWED_LENGTH = 2000;

export const issueRecordKey = (issueKey) => `decisions:${issueKey}`;

export class UserError extends Error {}

const clean = (value) => (typeof value === 'string' ? value.trim() : '');

export function validateInput({ decision, reason }, maxLength) {
  const cleanDecision = clean(decision);
  const cleanReason = clean(reason);
  if (!cleanDecision) throw new UserError('Enter the decision.');
  if (!cleanReason) throw new UserError('Enter the reason.');
  if (cleanDecision.length > maxLength) {
    throw new UserError(`Keep the decision under ${maxLength} characters.`);
  }
  if (cleanReason.length > maxLength) {
    throw new UserError(`Keep the reason under ${maxLength} characters.`);
  }
  return { decision: cleanDecision, reason: cleanReason };
}

export function addDecision(list, input, maxLength, id, now) {
  if (list.length >= MAX_DECISIONS) {
    throw new UserError(`This issue already has ${MAX_DECISIONS} decisions. Delete one to add another.`);
  }
  const valid = validateInput(input, maxLength);
  return [{ id, ...valid, createdAt: now, updatedAt: now }, ...list];
}

export function updateDecision(list, id, input, maxLength, now) {
  if (!list.some((item) => item.id === id)) {
    throw new UserError('That decision no longer exists. Refresh and try again.');
  }
  const valid = validateInput(input, maxLength);
  return list.map((item) => (item.id === id ? { ...item, ...valid, updatedAt: now } : item));
}

export function deleteDecision(list, id) {
  if (!list.some((item) => item.id === id)) {
    throw new UserError('That decision no longer exists. Refresh and try again.');
  }
  return list.filter((item) => item.id !== id);
}

export function validateMaxLength(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < MIN_ALLOWED_LENGTH || number > MAX_ALLOWED_LENGTH) {
    throw new UserError(`Enter a whole number from ${MIN_ALLOWED_LENGTH} to ${MAX_ALLOWED_LENGTH}.`);
  }
  return number;
}
