// tests/smoke.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount } from '../src/lib/money.js';
import { parseDate, monthOf, isValidDate } from '../src/lib/dates.js';

test('a plain amount is read as cents', () => {
  assert.equal(parseAmount('12.50'), 1250);
});

test('parseAmount reads brackets as negative', () => {
  assert.equal(parseAmount('(40.00)'), -4000);
  assert.equal(parseAmount('($1,234.50)'), -123450);
  assert.equal(parseAmount('12.50'), 1250);
  assert.equal(parseAmount('-2112.90'), -211290);
});

test('a date is read as day, month, year', () => {
  assert.equal(parseDate('05/09/2026'), '2026-09-05');
  assert.equal(monthOf('05/09/2026'), '2026-09');
});

test('isValidDate accepts only real calendar days', () => {
  assert.equal(isValidDate('31/02/2026'), false);
  assert.equal(isValidDate('29/02/2028'), true);
  assert.equal(isValidDate('05/09/2026'), true);
});
