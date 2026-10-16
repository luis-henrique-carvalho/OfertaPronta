import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import { serverEnv } from "../../config/server-env";
import * as schema from "./schema";

const { Pool } = pg;

export type AppDatabase = NodePgDatabase<typeof schema>;

/**
 * Factory for creating a Drizzle database client backed by a PostgreSQL pool or connection string.
 * Allows passing a mock or custom pool in tests without connecting to a live database.
 */
export function createDbClient(
  poolOrConnectionString: pg.Pool | string,
): AppDatabase {
  if (typeof poolOrConnectionString === "string") {
    const clientPool = new Pool({
      connectionString: poolOrConnectionString,
    });
    return drizzle(clientPool, { schema });
  }

  return drizzle(poolOrConnectionString, { schema });
}

/**
 * Singleton database connection pool for server runtime.
 */
export const pool = new Pool({
  connectionString: serverEnv.DATABASE_URL,
});

/**
 * Default database client singleton using the configured PostgreSQL connection pool.
 */
export const db = drizzle(pool, { schema });
