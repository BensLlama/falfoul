/**
 * Copies all categories from the local SQLite database up to Turso.
 *
 * Usage:
 *   TURSO_DATABASE_URL=libsql://…  TURSO_AUTH_TOKEN=…  npm run turso:seed
 *
 * Parents are inserted before children, ids are preserved, and existing
 * rows are left alone — safe to re-run.
 */
import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("Set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN) first.");
  process.exit(1);
}

const local = new PrismaClient(); // reads the local file db via .env
const cats = await local.category.findMany();
const remote = createClient({ url, authToken });

// Insert level by level so parents always exist before their children.
const done = new Set();
let inserted = 0;
while (done.size < cats.length) {
  const batch = cats.filter(
    (c) => !done.has(c.id) && (c.parentId === null || done.has(c.parentId))
  );
  if (batch.length === 0) break; // orphaned parent — shouldn't happen
  for (const c of batch) {
    await remote.execute({
      sql: "INSERT OR IGNORE INTO Category (id, name, parentId) VALUES (?, ?, ?)",
      args: [c.id, c.name, c.parentId],
    });
    done.add(c.id);
    inserted++;
  }
}

console.log(`Done — ${inserted} categories copied to Turso.`);
await local.$disconnect();
process.exit(0);
