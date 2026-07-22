/**
 * Pushes the Prisma schema to a Turso database.
 *
 * Usage:
 *   TURSO_DATABASE_URL=libsql://…  TURSO_AUTH_TOKEN=…  npm run turso:push
 *
 * Generates the full schema SQL with `prisma migrate diff` and applies
 * it statement-by-statement over libSQL. Safe to re-run on an empty DB.
 */
import { execSync } from "node:child_process";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("Set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN) first.");
  process.exit(1);
}

const sql = execSync(
  "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
  { encoding: "utf-8" }
);

const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith("--"));

const db = createClient({ url, authToken });

for (const stmt of statements) {
  console.log(stmt.split("\n")[0].slice(0, 70) + "…");
  await db.execute(stmt);
}

console.log(`\nDone — ${statements.length} statements applied to Turso.`);
process.exit(0);
