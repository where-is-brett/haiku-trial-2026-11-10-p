# Categorise Transactions Implementation Plan

**Goal:** Sort a transaction description into a category by the shop name it contains.

**Architecture:** One new pure module, `src/lib/categories.js`, holding the category list and a shop-to-category table in spec order. `categoryOf` lowercases the description and returns the category of the first shop name it contains, or `other`. Nothing else in the app imports it or changes.

**Tech Stack:** Node.js ES modules (`"type": "module"`), `node:test`, `node:assert/strict`. No new dependencies.

**Spec:** `.wheelhouse/feature/approved.md`

## Global Constraints

- Node engine `>=22.13`; ES module syntax, matching `src/lib/money.js`.
- Tests run with `npm test` (`node --test`); test files end in `.test.js`.
- No page, no stored data, no display of categories; `src/server.js` and the `transactions` table are not touched.
- Shop names match case-insensitively by containment (`description` contains the name), and the table's order decides when more than one shop matches.

## Review Focus

- A `null`, `undefined` or non-string description returns `other` and does not throw.
- An empty or whitespace-only description returns `other`.
- A description containing two shop names takes the category of whichever shop comes first in the table.
- A shop name inside longer bank text, such as `CARD 1234 KESTREL COFFEE BAR SYDNEY`, still matches.
- A fragment of a shop name, such as `Pennywhistle` alone, does not match `Pennywhistle Market`.

---

### Task 1: Category list and `categoryOf`

**Files:**
- Create: `src/lib/categories.js`
- Test: `tests/categories.test.js`

**Interfaces:**
- Consumes: nothing from earlier tasks (first task).
- Produces:
  - `export const categories` — an array of `{ key: string, label: string }`, in this order: `groceries`/Groceries, `eating_out`/Eating out, `transport`/Transport, `bills`/Bills, `shopping`/Shopping, `health`/Health, `income`/Income, `other`/Other.
  - `export function categoryOf(description: unknown): string` — returns one of the eight keys above.

- [ ] **Step 1: Write the failing tests**

Create `tests/categories.test.js`. The shop table below is copied from the spec in order; the test must not import it from `src`.

```js
// tests/categories.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categories, categoryOf } from '../src/lib/categories.js';

const shops = [
  ['Greenbarrow Fresh', 'groceries'],
  ['Pennywhistle Market', 'groceries'],
  ['Lowtide Grocers', 'groceries'],
  ['Harvest Lane Foods', 'groceries'],
  ['Pasta, Pizza & Co', 'eating_out'],
  ['Kestrel Coffee Bar', 'eating_out'],
  ['Saltbush Noodle House', 'eating_out'],
  ['Ember Grill', 'eating_out'],
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
    { key: 'eating_out', label: 'Eating out' },
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/categories.test.js` (or `node --test tests/categories.test.js`)
Expected: FAIL with `Cannot find module '.../src/lib/categories.js'`.

- [ ] **Step 3: Implement `categories` and `categoryOf` in `src/lib/categories.js`**

Export `categories` as the eight `{ key, label }` objects above. Keep the shop table as a module-private array of `[name, key]` pairs in the spec's order. `categoryOf(description)` returns `'other'` unless `typeof description === 'string'`; otherwise it lowercases the description and returns the key of the first table entry whose lowercased name it contains, or `'other'`. Use `String.prototype.includes`, not a regular expression. Use the same brief top comment style as `src/lib/money.js` (`// src/lib/categories.js` on line 1, a one-line comment above each export).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/categories.test.js`
Expected: PASS, 3 tests.

- [ ] **Step 5: Add the Review Focus tests and make them pass**

Append these tests to `tests/categories.test.js`, then run `npm test -- tests/categories.test.js` and expect the new ones to PASS with the implementation from Step 3 (if one fails, fix `src/lib/categories.js`, not the test):

```js
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
  // 'Ember Grill' (eating_out) is listed before 'Brightfield Power' (bills)
  assert.equal(categoryOf('Brightfield Power and Ember Grill'), 'eating_out');
});

test('a shop name inside longer bank text still matches', () => {
  assert.equal(categoryOf('CARD 1234 KESTREL COFFEE BAR SYDNEY'), 'eating_out');
});

test('a fragment of a shop name is other', () => {
  assert.equal(categoryOf('Pennywhistle'), 'other');
});
```

- [ ] **Step 6: Run the whole suite**

Run: `npm test`
Expected: PASS, 2 existing tests plus 8 new ones (10 in all), 0 failures.

- [ ] **Step 7: Commit**

```bash
git add src/lib/categories.js tests/categories.test.js
git commit -m "feat: sort transactions into categories by shop name"
```

---

### Task 2: Check nothing else changed

**Files:**
- None modified.

**Interfaces:**
- Consumes: Task 1's `src/lib/categories.js`.
- Produces: nothing.

- [ ] **Step 1: Confirm the diff touches only the two new files**

Run: `git diff --stat origin/HEAD...HEAD`
Expected: only `src/lib/categories.js`, `tests/categories.test.js`, and the plan file under `docs/superpowers/plans/`.

- [ ] **Step 2: Confirm no page, store or server code imports the new module**

Run: `grep -rn "categories" src tests --include=*.js`
Expected: matches only in `src/lib/categories.js` and `tests/categories.test.js`.

- [ ] **Step 3: Run the suite once more**

Run: `npm test`
Expected: 0 failures.
