// Applies supabase/schema.sql before `next build` (see package.json), so the
// schema ships with the code that needs it and nobody applies SQL by hand.
//
// On Vercel the Supabase integration provides POSTGRES_URL_NON_POOLING; the
// build fails loudly if the schema can't be applied. Anywhere else — CI, a
// laptop — the variable is unset and the step is skipped. The file is written
// to be re-run (if not exists / or replace), so a preview build re-applying it
// against the one database changes nothing.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const url = process.env.POSTGRES_URL_NON_POOLING;
if (!url) {
  console.log("[db] POSTGRES_URL_NON_POOLING is not set — schema not applied (expected outside Vercel)");
  process.exit(0);
}

const { default: pg } = await import("pg");
const here = path.dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(path.join(here, "..", "supabase", "schema.sql"), "utf8");

// The pooler's certificate is not signed by a CA in the build image's store;
// the connection is still TLS. The credential in the URL never leaves the build.
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false }, statement_timeout: 60_000 });

try {
  await client.connect();
  await client.query("begin");
  await client.query(sql);
  await client.query("commit");
  console.log("[db] schema applied");
} catch (err) {
  await client.query("rollback").catch(() => {});
  console.error("[db] schema NOT applied:", err.message);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
