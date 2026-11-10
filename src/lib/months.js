// src/lib/months.js

// node:sqlite returns rows with a null prototype; copy them into plain objects.
const plain = (row) => ({ ...row });

// Lists each month (YYYY-MM) that has rows, newest first, with its row count
// and the sum of its cents.
export function listMonths(db) {
  return db
    .prepare(
      'SELECT substr(date, 1, 7) AS month, COUNT(*) AS count, SUM(cents) AS total FROM transactions GROUP BY month ORDER BY month DESC',
    )
    .all()
    .map(plain);
}

// Gives the rows of one month (YYYY-MM), ordered by date then id, and their
// total cents (0 when the month has no rows).
export function transactionsInMonth(db, month) {
  const rows = db
    .prepare(
      'SELECT date, description, cents FROM transactions WHERE substr(date, 1, 7) = ? ORDER BY date, id',
    )
    .all(month)
    .map(plain);
  const total = rows.reduce((sum, row) => sum + row.cents, 0);
  return { rows, total };
}
