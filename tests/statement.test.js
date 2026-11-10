// tests/statement.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readStatement, importStatement, NotAStatement } from '../src/lib/statement.js';
import { openLedger } from '../src/lib/ledger.js';

test('a header-only file is a valid statement with no rows', () => {
  assert.deepEqual(readStatement('Date,Description,Amount\r\n'), []);
});

test('a file with a BOM, CRLF and a quoted comma reads correctly', () => {
  const text = '﻿Date,Description,Amount\r\n06/08/2026,"Pasta, Pizza & Co REF 3946",102.29\r\n';
  assert.deepEqual(readStatement(text), [
    { date: '2026-08-06', description: 'Pasta, Pizza & Co REF 3946', cents: 10229 },
  ]);
});

test('amount forms: currency, thousands commas and a leading minus read correctly', () => {
  const text = 'Date,Description,Amount\n01/08/2026,A,"$1,234.50"\n02/08/2026,B,"-2,112.90"\n';
  assert.deepEqual(readStatement(text).map((r) => r.cents), [123450, -211290]);
});

test('an unquoted thousands amount makes the file a non-statement', () => {
  assert.throws(
    () => readStatement('Date,Description,Amount\n01/08/2026,A,$1,234.50\n'),
    NotAStatement,
  );
});

test('a date that is not a real calendar day makes the file a non-statement', () => {
  assert.throws(
    () => readStatement('Date,Description,Amount\n31/02/2026,A,1.00\n'),
    NotAStatement,
  );
});

test('an amount such as 1.2.3 or 12abc makes the file a non-statement', () => {
  for (const amount of ['1.2.3', '12abc', '', 'abc', '1.234']) {
    assert.throws(
      () => readStatement(`Date,Description,Amount\n01/08/2026,A,${amount}\n`),
      NotAStatement,
    );
  }
});

test('brackets read as negative and a plain amount reads as cents', () => {
  const text = 'Date,Description,Amount\n01/08/2026,A,"($1,234.50)"\n02/08/2026,B,12.5\n';
  assert.deepEqual(readStatement(text).map((r) => r.cents), [-123450, 1250]);
});

test('a row whose field count differs from the header makes the file a non-statement', () => {
  for (const row of ['01/08/2026,A', '01/08/2026,A,1.00,50.00']) {
    assert.throws(
      () => readStatement(`Date,Description,Amount\n${row}\n`),
      NotAStatement,
    );
  }
});

test('a header without an amount column makes the file a non-statement', () => {
  assert.throws(
    () => readStatement('Date,Description,Total\n01/08/2026,A,1.00\n'),
    NotAStatement,
  );
});

test('an unterminated quote makes the file a non-statement', () => {
  assert.throws(
    () => readStatement('Date,Description,Amount\n01/08/2026,"A,1.00\n'),
    NotAStatement,
  );
});

test('a split thousands amount that keeps the field count makes the file a non-statement', () => {
  for (const row of ['01/08/2026,Pasta,$1,234.50', '01/08/2026,Pasta,$1,234.50,100.00']) {
    assert.throws(
      () => readStatement(`Date,Description,Amount,Balance\n${row}\n`),
      NotAStatement,
    );
  }
});

test('an unquoted decimal comma that keeps the field count makes the file a non-statement', () => {
  for (const row of ['02/08/2026,Coffee,12,50', '02/08/2026,Coffee,12,5']) {
    assert.throws(
      () => readStatement(`Date,Description,Amount,Note\n${row}\n`),
      NotAStatement,
    );
  }
});

test('a two-digit description before the amount does not make the file a non-statement', () => {
  const text = 'Date,Description,Amount\n02/08/2026,42,123.45\n';
  assert.deepEqual(readStatement(text), [
    { date: '2026-08-02', description: '42', cents: 12345 },
  ]);
});

test('a quoted thousands amount in a four-column statement reads as cents', () => {
  const text = 'Date,Description,Amount,Balance\n01/08/2026,Pasta,"$1,234.50",100.00\n';
  assert.deepEqual(readStatement(text).map((r) => r.cents), [123450]);
});

test('blank lines are skipped and extra columns are ignored', () => {
  const text = 'Date,Description,Amount,Balance\r\n\r\n01/08/2026,A,1.00,50.00\r\n\r\n';
  assert.deepEqual(readStatement(text), [
    { date: '2026-08-01', description: 'A', cents: 100 },
  ]);
});

test('statement import keeps identical lines within one file', () => {
  const db = openLedger(':memory:');
  const text = 'Date,Description,Amount\n02/08/2026,Pennywhistle Market,101.52\n02/08/2026,Pennywhistle Market,101.52\n';
  assert.deepEqual(importStatement(db, text), { added: 2, skipped: 0 });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM transactions').get().n, 2);
  db.close();
});

test('importing the same statement twice adds nothing', () => {
  const db = openLedger(':memory:');
  const text = 'Date,Description,Amount\n02/08/2026,Pennywhistle Market,101.52\n03/08/2026,Hollis Insurance,123.50\n';
  importStatement(db, text);
  assert.deepEqual(importStatement(db, text), { added: 0, skipped: 2 });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM transactions').get().n, 2);
  db.close();
});

test('a later file that overlaps a stored one adds only its new line', () => {
  const db = openLedger(':memory:');
  importStatement(db, 'Date,Description,Amount\n02/08/2026,A,1.00\n');
  const text = 'Date,Description,Amount\n02/08/2026,A,1.00\n03/08/2026,B,2.00\n';
  assert.deepEqual(importStatement(db, text), { added: 1, skipped: 1 });
  db.close();
});

test('a file that is not a statement adds nothing', () => {
  const db = openLedger(':memory:');
  const text = 'Date,Description,Amount\n02/08/2026,A,1.00\n03/08/2026,B,12abc\n';
  assert.throws(() => importStatement(db, text), NotAStatement);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM transactions').get().n, 0);
  db.close();
});
