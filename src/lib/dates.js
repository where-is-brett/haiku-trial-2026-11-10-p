// src/lib/dates.js

// '31/08/2026' becomes '2026-08-31'.
export function parseDate(text) {
  const [day, month, year] = String(text).trim().split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// '31/08/2026' becomes '2026-08'.
export function monthOf(text) {
  return parseDate(text).slice(0, 7);
}

// True only for DD/MM/YYYY that names a real calendar day.
export function isValidDate(text) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
