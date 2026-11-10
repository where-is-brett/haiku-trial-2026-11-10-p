// tests/home.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openLedger } from '../src/lib/ledger.js';
import { createApp } from '../src/app.js';

test('the home page lists months newest first with month links', async () => {
  const db = openLedger(':memory:');
  db.exec(
    "INSERT INTO transactions (date, description, cents) VALUES ('2026-08-02','A',1200),('2026-09-05','B',-400)",
  );
  const server = createApp(db, { bankImport: true }).listen(0);
  try {
    const res = await fetch(`http://localhost:${server.address().port}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    const september = html.indexOf('<a href="/month?m=2026-09">2026-09</a>');
    const august = html.indexOf('<a href="/month?m=2026-08">2026-08</a>');
    assert.notEqual(september, -1);
    assert.notEqual(august, -1);
    assert.ok(september < august, 'September is listed before August');
  } finally {
    server.close();
    db.close();
  }
});

test('the home page with the switch off is unchanged', async () => {
  const db = openLedger(':memory:');
  db.exec(
    "INSERT INTO transactions (date, description, cents) VALUES ('2026-08-02','A',1200),('2026-09-05','B',-400)",
  );
  const server = createApp(db, { bankImport: false }).listen(0);
  try {
    const res = await fetch(`http://localhost:${server.address().port}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /2 transactions imported/);
    assert.doesNotMatch(html, /\/month\?m=/);
  } finally {
    server.close();
    db.close();
  }
});
