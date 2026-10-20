import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not set; skipping database migrations.");
  process.exit(0);
}

const pool = new pg.Pool({ connectionString });
const db = drizzle(pool);

try {
  console.warn("Applying database migrations from ./drizzle...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.warn("Database migrations applied successfully.");
} catch (error) {
  console.error("Error executing database migrations:", error);
  process.exit(1);
} finally {
  await pool.end();
}
