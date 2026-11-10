// tests/import-page.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openLedger } from '../src/lib/ledger.js';
import { createApp } from '../src/app.js';

const MULTIPART = 'multipart/form-data; boundary=XX';

// A multipart body whose only part is the `statement` file, with the boundary XX.
function upload(statementText) {
  return (
    '--XX\r\nContent-Disposition: form-data; name="statement"; filename="a.csv"\r\n' +
    'Content-Type: text/csv\r\n\r\n' +
    statementText +
    '\r\n--XX--\r\n'
  );
}

function countRows(db) {
  return db.prepare('SELECT COUNT(*) AS n FROM transactions').get().n;
}

test('the import page has a file field named statement', async () => {
  const db = openLedger(':memory:');
  const server = createApp(db, { bankImport: true }).listen(0);
  try {
    const res = await fetch(`http://localhost:${server.address().port}/import`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /<form method="post" enctype="multipart\/form-data">/);
    assert.match(html, /<input type="file" name="statement">/);
  } finally {
    server.close();
    db.close();
  }
});

test('upload reports Added and skipped counts', async () => {
  const db = openLedger(':memory:');
  const server = createApp(db, { bankImport: true }).listen(0);
  const url = `http://localhost:${server.address().port}/import`;
  const statement = 'Date,Description,Amount\n02/08/2026,A,12.00\n03/08/2026,B,5.00\n';
  try {
    const first = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': MULTIPART },
      body: upload(statement),
    });
    assert.equal(first.status, 200);
    assert.match(await first.text(), /Added 2, skipped 0/);

    const second = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': MULTIPART },
      body: upload(statement),
    });
    assert.equal(second.status, 200);
    assert.match(await second.text(), /Added 0, skipped 2/);
    assert.equal(countRows(db), 2);
  } finally {
    server.close();
    db.close();
  }
});

test('upload of a non-statement shows a plain error and stores nothing', async () => {
  const db = openLedger(':memory:');
  const server = createApp(db, { bankImport: true }).listen(0);
  try {
    const res = await fetch(`http://localhost:${server.address().port}/import`, {
      method: 'POST',
      headers: { 'content-type': MULTIPART },
      body: upload('Date,Description,Amount\n02/08/2026,A,12abc\n'),
    });
    assert.equal(res.status, 400);
    assert.match(await res.text(), /Not a bank statement/);
    assert.equal(countRows(db), 0);
  } finally {
    server.close();
    db.close();
  }
});

test('a POST with no statement part, or a body that is not multipart, shows the plain error', async () => {
  const db = openLedger(':memory:');
  const server = createApp(db, { bankImport: true }).listen(0);
  const url = `http://localhost:${server.address().port}/import`;
  try {
    const otherPart = '--XX\r\nContent-Disposition: form-data; name="note"\r\n\r\nhi\r\n--XX--\r\n';
    const noPart = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': MULTIPART },
      body: otherPart,
    });
    assert.equal(noPart.status, 400);
    assert.match(await noPart.text(), /Not a bank statement/);

    const notMultipart = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: upload('Date,Description,Amount\n02/08/2026,A,1.00\n'),
    });
    assert.equal(notMultipart.status, 400);
    assert.match(await notMultipart.text(), /Not a bank statement/);
    assert.equal(countRows(db), 0);
  } finally {
    server.close();
    db.close();
  }
});

test('an upload over 5 MB is refused with the plain error and stores nothing', async () => {
  const db = openLedger(':memory:');
  const server = createApp(db, { bankImport: true }).listen(0);
  try {
    // A valid statement whose one row carries a description just over 5 MB.
    const bigDescription = 'x'.repeat(5 * 1024 * 1024 + 1024);
    const statement = `Date,Description,Amount\n02/08/2026,${bigDescription},1.00\n`;
    const res = await fetch(`http://localhost:${server.address().port}/import`, {
      method: 'POST',
      headers: { 'content-type': MULTIPART },
      body: upload(statement),
    });
    assert.equal(res.status, 400);
    assert.match(await res.text(), /Not a bank statement/);
    assert.equal(countRows(db), 0);
  } finally {
    server.close();
    db.close();
  }
});

test('with the switch off, /import is a 404', async () => {
  const db = openLedger(':memory:');
  const server = createApp(db, { bankImport: false }).listen(0);
  try {
    const res = await fetch(`http://localhost:${server.address().port}/import`);
    assert.equal(res.status, 404);
    assert.equal(await res.text(), 'Not found');
  } finally {
    server.close();
    db.close();
  }
});
