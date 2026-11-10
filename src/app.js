// src/app.js
import http from 'node:http';
import { readStatementPart } from './lib/multipart.js';
import { importStatement, NotAStatement } from './lib/statement.js';
import { listMonths } from './lib/months.js';
import { formatCents } from './lib/money.js';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const NOT_A_STATEMENT = 'Not a bank statement';
const IMPORT_FORM =
  '<form method="post" enctype="multipart/form-data">\n' +
  '<input type="file" name="statement">\n' +
  '<button type="submit">Import</button>\n' +
  '</form>';

function page(body) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Spending tracker</title></head>
<body>
<main>
<h1>Spending tracker</h1>
${body}
</main>
</body>
</html>
`;
}

function sendPage(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'text/html; charset=utf-8', ...headers });
  res.end(page(body));
}

// Escapes text for HTML so that stored values show as text, not markup.
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Renders the months that have rows, newest first, each linked to its month page.
function monthList(months) {
  const items = months.map(
    ({ month, count, total }) =>
      `<li><a href="/month?m=${escapeHtml(month)}">${escapeHtml(month)}</a> ` +
      `${escapeHtml(`${count} transactions, ${formatCents(total)}`)}</li>`,
  );
  return `<ul>\n${items.join('\n')}\n</ul>`;
}

// Collects the request body up to the upload limit. Resolves null as soon as the
// body passes the limit (stopping the read) or the request closes early.
function readUpload(req) {
  return new Promise((resolve) => {
    const chunks = [];
    let total = 0;
    const onData = (chunk) => {
      total += chunk.length;
      if (total > MAX_UPLOAD_BYTES) {
        req.off('data', onData);
        req.pause();
        resolve(null);
        return;
      }
      chunks.push(chunk);
    };
    req.on('data', onData);
    req.on('end', () => resolve(Buffer.concat(chunks, total)));
    req.on('close', () => resolve(null));
    req.on('error', () => resolve(null));
  });
}

// Stores an uploaded statement. Answers 400 with the plain error when the body is
// too large, has no statement part, or is not a bank statement; nothing is stored then.
async function importUpload(req, res, db) {
  const body = await readUpload(req);
  if (body === null) {
    // The rest of an oversize body is not read; closing the connection drops it.
    sendPage(res, 400, `<p>${NOT_A_STATEMENT}</p>`, { connection: 'close' });
    return;
  }
  const text = readStatementPart(req.headers['content-type'] ?? '', body);
  if (text === null) {
    sendPage(res, 400, `<p>${NOT_A_STATEMENT}</p>`);
    return;
  }
  try {
    const { added, skipped } = importStatement(db, text);
    sendPage(res, 200, `<p>Added ${added}, skipped ${skipped}</p>`);
  } catch (error) {
    if (!(error instanceof NotAStatement)) throw error;
    sendPage(res, 400, `<p>${NOT_A_STATEMENT}</p>`);
  }
}

// Builds the HTTP server for the ledger. The caller decides when to listen.
export function createApp(db, options) {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/') {
      if (options.bankImport) {
        const months = listMonths(db);
        sendPage(res, 200, months.length === 0 ? '<p>Nothing imported yet</p>' : monthList(months));
        return;
      }
      const { n } = db.prepare('SELECT COUNT(*) AS n FROM transactions').get();
      const body = n === 0 ? '<p>Nothing imported yet</p>' : `<p>${n} transactions imported</p>`;
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(page(body));
      return;
    }
    if (url.pathname === '/import' && options.bankImport) {
      if (req.method === 'GET') {
        sendPage(res, 200, IMPORT_FORM);
        return;
      }
      if (req.method === 'POST') {
        importUpload(req, res, db).catch(() => {
          if (!res.headersSent) {
            res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
          }
          res.end('Server error');
        });
        return;
      }
    }
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  });
}
