// src/server.js
import { openLedger } from './lib/ledger.js';
import { createApp } from './app.js';

const BANK_IMPORT = false; // Bank-statement import feature switch; off until the feature ships.
const port = Number(process.env.PORT ?? 3000);
const db = openLedger(process.env.LEDGER_DB ?? 'ledger.db');

const server = createApp(db, { bankImport: BANK_IMPORT });

server.listen(port, () => {
  console.log(`listening on ${server.address().port}`);
});
