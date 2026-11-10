// tests/categories.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categories, categoryOf } from '../src/lib/categories.js';

const shops = [
  ['Greenbarrow Fresh', 'groceries'],
  ['Pennywhistle Market', 'groceries'],
  ['Lowtide Grocers', 'groceries'],
  ['Harvest Lane Foods', 'groceries'],
  ['Pasta, Pizza & Co', 'dining'],
  ['Kestrel Coffee Bar', 'dining'],
  ['Saltbush Noodle House', 'dining'],
  ['Ember Grill', 'dining'],
  ['Waverly Fuel Stop', 'transport'],
  ['Tramline Fares', 'transport'],
  ['Lantern Rideshare', 'transport'],
  ['Northgate Parking', 'transport'],
  ['Brightfield Power', 'bills'],
  ['Clearwater Utilities', 'bills'],
  ['Skyline Broadband', 'bills'],
  ['Hollis Insurance', 'bills'],
  ['Marlowe Homewares', 'shopping'],
  ['Quillon Books', 'shopping'],
  ['Fernhill Outfitters', 'shopping'],
  ['Pixel Parade Tech', 'shopping'],
  ['Larkspur Pharmacy', 'health'],
  ['Elmgrove Physio', 'health'],
  ['Cobalt Dental', 'health'],
  ['Sunnyvale Optical', 'health'],
  ['Brightwave Payroll', 'income'],
  ['Tidepool Interest', 'income'],
  ['Oakridge Dividends', 'income'],
];

test('the category keys and labels are listed in spec order', () => {
  assert.deepEqual(categories, [
    { key: 'groceries', label: 'Groceries' },
    { key: 'dining', label: 'Eating out' },
    { key: 'transport', label: 'Transport' },
    { key: 'bills', label: 'Bills' },
    { key: 'shopping', label: 'Shopping' },
    { key: 'health', label: 'Health' },
    { key: 'income', label: 'Income' },
    { key: 'other', label: 'Other' },
  ]);
});

test('each shop name gives its category in upper, lower and mixed case', () => {
  for (const [name, key] of shops) {
    assert.equal(categoryOf(name.toUpperCase()), key, `upper: ${name}`);
    assert.equal(categoryOf(name.toLowerCase()), key, `lower: ${name}`);
    assert.equal(categoryOf(name), key, `mixed: ${name}`);
  }
});

test('a description with no shop name is other', () => {
  assert.equal(categoryOf('ATM WITHDRAWAL 0042'), 'other');
});

test('null, undefined and non-string descriptions are other', () => {
  assert.equal(categoryOf(null), 'other');
  assert.equal(categoryOf(undefined), 'other');
  assert.equal(categoryOf(12345), 'other');
});

test('an empty or whitespace-only description is other', () => {
  assert.equal(categoryOf(''), 'other');
  assert.equal(categoryOf('   '), 'other');
});

test('when two shops match, the one earlier in the table decides', () => {
  // 'Ember Grill' (dining) is listed before 'Brightfield Power' (bills)
  assert.equal(categoryOf('Brightfield Power and Ember Grill'), 'dining');
});

test('a shop name inside longer bank text still matches', () => {
  assert.equal(categoryOf('CARD 1234 KESTREL COFFEE BAR SYDNEY'), 'dining');
});

test('a fragment of a shop name is other', () => {
  assert.equal(categoryOf('Pennywhistle'), 'other');
});
