// tests/app.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openLedger } from '../src/lib/ledger.js';
import { createApp } from '../src/app.js';

test('GET / on an empty ledger says nothing is imported yet', async () => {
  const db = openLedger(':memory:');
  const server = createApp(db, { bankImport: false }).listen(0);
  const base = `http://localhost:${server.address().port}`;
  const res = await fetch(`${base}/`);
  assert.match(await res.text(), /Nothing imported yet/);
  server.close();
  db.close();
});

test('an unknown path answers 404 Not found', async () => {
  const db = openLedger(':memory:');
  const server = createApp(db, { bankImport: false }).listen(0);
  const res = await fetch(`http://localhost:${server.address().port}/nope`);
  assert.equal(res.status, 404);
  assert.equal(await res.text(), 'Not found');
  server.close();
  db.close();
});
