import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MAX_DECISIONS,
  UserError,
  addDecision,
  deleteDecision,
  updateDecision,
  validateInput,
  validateMaxLength,
} from '../src/lib/decisions.js';

const input = { decision: 'Use Postgres', reason: 'The team knows it' };

test('adds newest decisions first and trims text', () => {
  const one = addDecision([], { decision: ' A ', reason: ' B ' }, 500, '1', 'd1');
  const two = addDecision(one, input, 500, '2', 'd2');
  assert.deepEqual(two.map((item) => item.id), ['2', '1']);
  assert.equal(one[0].decision, 'A');
  assert.equal(one[0].reason, 'B');
});

test('rejects blank decisions and reasons', () => {
  assert.throws(() => validateInput({ decision: ' ', reason: 'x' }, 500), UserError);
  assert.throws(() => validateInput({ decision: 'x', reason: ' ' }, 500), UserError);
  assert.throws(() => validateInput({}, 500), UserError);
});

test('enforces the admin length limit', () => {
  assert.throws(() => validateInput({ decision: 'x'.repeat(201), reason: 'y' }, 200), UserError);
  assert.throws(() => validateInput({ decision: 'y', reason: 'x'.repeat(201) }, 200), UserError);
  assert.doesNotThrow(() => validateInput({ decision: 'x'.repeat(200), reason: 'y' }, 200));
});

test('blocks the 51st decision', () => {
  const full = Array.from({ length: MAX_DECISIONS }, (_, id) => ({ id: String(id) }));
  assert.throws(() => addDecision(full, input, 500, 'new', 'now'), UserError);
});

test('updates only the chosen decision and keeps its created date', () => {
  const list = addDecision([], input, 500, '1', 'old');
  const next = updateDecision(list, '1', { decision: 'New', reason: 'Why' }, 500, 'new');
  assert.equal(next[0].decision, 'New');
  assert.equal(next[0].createdAt, 'old');
  assert.equal(next[0].updatedAt, 'new');
});

test('refuses to change or delete a missing decision', () => {
  assert.throws(() => updateDecision([], 'x', input, 500, 'now'), UserError);
  assert.throws(() => deleteDecision([], 'x'), UserError);
});

test('deletes the chosen decision', () => {
  const list = addDecision([], input, 500, '1', 'now');
  assert.deepEqual(deleteDecision(list, '1'), []);
});

test('validates the admin setting', () => {
  assert.equal(validateMaxLength('200'), 200);
  assert.equal(validateMaxLength(2000), 2000);
  for (const bad of ['199', 2001, '12.5', 'abc', '']) {
    assert.throws(() => validateMaxLength(bad), UserError);
  }
});
