import { PrismaClient } from "@prisma/client";

/**
 * Garante que DATABASE_URL tem os parâmetros corretos para Neon + PgBouncer.
 *
 * O Prisma binary engine lê a URL do processo na criação do cliente.
 * Sem `pgbouncer=true`, ele emite BEGIN → DEALLOCATE ALL → query → COMMIT
 * por cada chamada (4 round-trips → ~400ms de overhead extra no Neon).
 * Com `pgbouncer=true` cada query é 1 round-trip.
 */
function getNeonUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL não configurada.");

  try {
    const url = new URL(raw);
    // Ativa modo PgBouncer (sem prepared statements — elimina DEALLOCATE ALL)
    if (!url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    // Limita pool a 1 conexão por instância serverless (Neon recomenda)
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
    }
    // Aumenta timeout do pool para evitar P2024 sob carga
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "30");
    }
    return url.toString();
  } catch {
    return raw; // fallback se a URL tiver formato não-padrão
  }
}

// Injeta antes de o PrismaClient ler process.env
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = getNeonUrl();
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]   // removido "query" — reduz ruído nos logs dev
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
