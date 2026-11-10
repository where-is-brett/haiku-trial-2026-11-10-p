// tests/ledger.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openLedger } from '../src/lib/ledger.js';

test('openLedger creates the transactions table and can be opened twice', () => {
  const db = openLedger(':memory:');
  const columns = db.prepare('PRAGMA table_info(transactions)').all().map((c) => c.name);
  assert.deepEqual(columns, ['id', 'date', 'description', 'cents']);
  db.close();
});

test('openLedger can open the same file twice without throwing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-test-'));
  const file = path.join(dir, 'ledger.db');
  try {
    const first = openLedger(file);
    const second = openLedger(file);
    assert.doesNotThrow(() => {
      first.close();
      second.close();
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
