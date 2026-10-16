import { defineConfig } from "drizzle-kit";

// Carrega automaticamente .env.local no ambiente CLI do Drizzle Kit
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // .env.local não encontrado ou variáveis já carregadas
  }
}

export default defineConfig({
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/ofertapronta",
  },
});
