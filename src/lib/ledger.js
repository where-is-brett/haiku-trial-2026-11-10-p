// src/lib/ledger.js
import { DatabaseSync } from 'node:sqlite';

// Opens the ledger database (a file path, or ':memory:') and makes sure the
// transactions table exists. Safe to call more than once on the same file.
export function openLedger(file) {
  const db = new DatabaseSync(file);
  db.exec(
    'CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY, date TEXT, description TEXT, cents INTEGER)',
  );
  return db;
}
