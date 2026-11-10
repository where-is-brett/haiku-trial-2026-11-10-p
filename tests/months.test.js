// tests/months.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openLedger } from '../src/lib/ledger.js';
import { listMonths, transactionsInMonth } from '../src/lib/months.js';

test('listMonths gives each month with rows, newest first', () => {
  const db = openLedger(':memory:');
  db.exec("INSERT INTO transactions (date, description, cents) VALUES ('2025-12-30','A',100),('2026-01-02','B',-250),('2026-10-01','C',500),('2026-09-30','D',700)");
  assert.deepEqual(listMonths(db), [
    { month: '2026-10', count: 1, total: 500 },
    { month: '2026-09', count: 1, total: 700 },
    { month: '2026-01', count: 1, total: -250 },
    { month: '2025-12', count: 1, total: 100 },
  ]);
  db.close();
});

test('transactionsInMonth gives the rows and the total for one month', () => {
  const db = openLedger(':memory:');
  db.exec("INSERT INTO transactions (date, description, cents) VALUES ('2026-08-02','A',100),('2026-08-01','B',-4000),('2026-09-01','C',9)");
  assert.deepEqual(transactionsInMonth(db, '2026-08'), {
    rows: [
      { date: '2026-08-01', description: 'B', cents: -4000 },
      { date: '2026-08-02', description: 'A', cents: 100 },
    ],
    total: -3900,
  });
  assert.deepEqual(transactionsInMonth(db, '2026-02'), { rows: [], total: 0 });
  db.close();
});
