// tests/multipart.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readStatementPart } from '../src/lib/multipart.js';

test('the statement part is returned as text', () => {
  const body = Buffer.from(
    '--XX\r\nContent-Disposition: form-data; name="statement"; filename="a.csv"\r\n' +
    'Content-Type: text/csv\r\n\r\nDate,Description,Amount\r\n01/08/2026,A,1.00\r\n--XX--\r\n',
  );
  assert.equal(
    readStatementPart('multipart/form-data; boundary=XX', body),
    'Date,Description,Amount\r\n01/08/2026,A,1.00',
  );
});

test('a body with no statement part, or no boundary, gives null', () => {
  const other = Buffer.from('--XX\r\nContent-Disposition: form-data; name="note"\r\n\r\nhi\r\n--XX--\r\n');
  assert.equal(readStatementPart('multipart/form-data; boundary=XX', other), null);
  assert.equal(readStatementPart('text/plain', other), null);
});

test('a BOM and CRLF line endings come back unchanged, apart from the delimiter CRLF', () => {
  const body = Buffer.concat([
    Buffer.from('--XX\r\nContent-Disposition: form-data; name="statement"; filename="a.csv"\r\n\r\n'),
    Buffer.from([0xef, 0xbb, 0xbf]),
    Buffer.from('Date,Description,Amount\r\n01/08/2026,A,1.00\r\n--XX--\r\n'),
  ]);
  assert.equal(
    readStatementPart('multipart/form-data; boundary=XX', body),
    '﻿Date,Description,Amount\r\n01/08/2026,A,1.00',
  );
});

test('a malformed body gives null and never throws', () => {
  const type = 'multipart/form-data; boundary=XX';
  const malformed = [
    Buffer.alloc(0),
    Buffer.from('not a multipart body at all'),
    Buffer.from('--XX\r\nContent-Disposition: form-data; name="statement"\r\n'),
    Buffer.from('--XX\r\nno headers here\r\n--XX--\r\n'),
    Buffer.from('--XX\r\nContent-Disposition: form-data; name="statement"\r\n\r\nDate,A\r\n'),
  ];
  for (const body of malformed) {
    assert.doesNotThrow(() => assert.equal(readStatementPart(type, body), null));
  }
  assert.doesNotThrow(() => assert.equal(readStatementPart(undefined, Buffer.alloc(0)), null));
  assert.doesNotThrow(() => assert.equal(readStatementPart(type, 'not a buffer'), null));
});
