// tests/month-page.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openLedger } from '../src/lib/ledger.js';
import { createApp } from '../src/app.js';

test("the month page lists that month's transactions and total", async () => {
  const db = openLedger(':memory:');
  try {
    db.prepare('INSERT INTO transactions (date, description, cents) VALUES (?, ?, ?)').run(
      '2026-08-01',
      'Brightfield Power',
      -4000,
    );
    db.prepare('INSERT INTO transactions (date, description, cents) VALUES (?, ?, ?)').run(
      '2026-08-02',
      'Lowtide Grocers',
      1250,
    );
    const server = createApp(db, { bankImport: true }).listen(0);
    try {
      const res = await fetch(`http://localhost:${server.address().port}/month?m=2026-08`);
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.match(html, /Brightfield Power/);
      assert.match(html, /Lowtide Grocers/);
      assert.match(html, /Total -27\.50/);
    } finally {
      server.close();
    }
  } finally {
    db.close();
  }
});

test('the month page escapes descriptions', async () => {
  const db = openLedger(':memory:');
  try {
    db.prepare('INSERT INTO transactions (date, description, cents) VALUES (?, ?, ?)').run(
      '2026-08-03',
      '<script>x</script> & co',
      -500,
    );
    const server = createApp(db, { bankImport: true }).listen(0);
    try {
      const res = await fetch(`http://localhost:${server.address().port}/month?m=2026-08`);
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.doesNotMatch(html, /<script>x<\/script>/);
      assert.ok(
        html.includes('&lt;script&gt;x&lt;/script&gt; &amp; co'),
        'the description is shown escaped',
      );
    } finally {
      server.close();
    }
  } finally {
    db.close();
  }
});

test('a malformed or missing m is a 404', async () => {
  const db = openLedger(':memory:');
  const server = createApp(db, { bankImport: true }).listen(0);
  try {
    const base = `http://localhost:${server.address().port}`;
    for (const path of ['/month?m=2026-13', '/month?m=2026-8', '/month']) {
      const res = await fetch(`${base}${path}`);
      assert.equal(res.status, 404, `${path} is a 404`);
      assert.equal(await res.text(), 'Not found', `${path} says Not found`);
    }
  } finally {
    server.close();
    db.close();
  }
});

test('a month with no rows is a 200 page with a total of 0.00', async () => {
  const db = openLedger(':memory:');
  const server = createApp(db, { bankImport: true }).listen(0);
  try {
    const res = await fetch(`http://localhost:${server.address().port}/month?m=2026-02`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /Total 0\.00/);
  } finally {
    server.close();
    db.close();
  }
});

test('GET /month with bankImport false is a 404 Not found', async () => {
  const db = openLedger(':memory:');
  db.prepare('INSERT INTO transactions (date, description, cents) VALUES (?, ?, ?)').run(
    '2026-08-01',
    'Brightfield Power',
    -4000,
  );
  const server = createApp(db, { bankImport: false }).listen(0);
  try {
    const res = await fetch(`http://localhost:${server.address().port}/month?m=2026-08`);
    assert.equal(res.status, 404);
    assert.equal(await res.text(), 'Not found');
  } finally {
    server.close();
    db.close();
  }
});
