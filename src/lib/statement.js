// src/lib/statement.js
import { isValidDate, parseDate } from './dates.js';
import { parseAmount } from './money.js';

// Thrown when a file cannot be read as a bank statement. `reason` says what failed.
export class NotAStatement extends Error {
  constructor(reason) {
    super('Not a bank statement');
    this.name = 'NotAStatement';
    this.reason = reason;
  }
}

// Accepted amount forms: 12.50, 12.5, 1,234.50, $12.50, -12.50, -$12.50, (12.50), ($1,234.50).
const NUMBER = String.raw`(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?`;
const AMOUNT = new RegExp(`^(?:-?\\$?${NUMBER}|\\(\\$?${NUMBER}\\))$`);

// Splits CSV text into records of fields, one character at a time.
// A quoted field may hold commas and line breaks; "" inside quotes is one quote.
// CR, LF and CRLF each end a record.
function parseRecords(text) {
  const records = [];
  let record = [];
  let field = '';
  let quoted = false;
  let i = 0;

  const endField = () => {
    record.push(field);
    field = '';
  };
  const endRecord = () => {
    endField();
    records.push(record);
    record = [];
  };

  while (i < text.length) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i += 2;
        continue;
      }
      if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"' && field === '') {
      quoted = true;
    } else if (c === ',') {
      endField();
    } else if (c === '\r' || c === '\n') {
      endRecord();
      if (c === '\r' && text[i + 1] === '\n') i++;
    } else {
      field += c;
    }
    i++;
  }

  if (quoted) throw new NotAStatement('quote: unterminated quoted field');
  if (field !== '' || record.length > 0) endRecord();
  return records;
}

// Finds the one header column with this name (case-insensitive, trimmed).
function columnOf(header, name) {
  const matches = [];
  header.forEach((title, index) => {
    if (title === name) matches.push(index);
  });
  if (matches.length !== 1) {
    const problem = matches.length === 0 ? 'missing' : 'appears more than once';
    throw new NotAStatement(`header: ${name} column ${problem}`);
  }
  return matches[0];
}

// Reads a bank statement CSV into rows, or throws NotAStatement.
// Row numbers count the header as row 1, over the non-blank lines.
export function readStatement(text) {
  const records = parseRecords(String(text).replace(/^﻿/, ''))
    .filter((record) => record.some((field) => field.trim() !== ''));
  if (records.length === 0) throw new NotAStatement('header: no header row');

  const header = records[0].map((title) => title.trim().toLowerCase());
  const dateColumn = columnOf(header, 'date');
  const descriptionColumn = columnOf(header, 'description');
  const amountColumn = columnOf(header, 'amount');

  const rows = [];
  for (let n = 1; n < records.length; n++) {
    const record = records[n];
    const rowNumber = n + 1;
    if (record.length !== header.length) throw new NotAStatement(`row ${rowNumber}: field count`);

    const date = record[dateColumn].trim();
    if (!isValidDate(date)) throw new NotAStatement(`row ${rowNumber}: date`);

    const amount = record[amountColumn].trim();
    if (!AMOUNT.test(amount)) throw new NotAStatement(`row ${rowNumber}: amount`);

    rows.push({
      date: parseDate(date),
      description: record[descriptionColumn].trim(),
      cents: parseAmount(amount),
    });
  }
  return rows;
}
