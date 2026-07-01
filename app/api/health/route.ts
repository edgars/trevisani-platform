import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/**
 * Health-check simples. Verifica que a app está de pé e o banco responde.
 * Ideal para monitor externo (Better Uptime, UptimeRobot) e canary de deploy.
 */
export async function GET() {
  const started = Date.now();
  let dbOk = false;
  let dbLatencyMs: number | null = null;

  try {
    const t = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  return NextResponse.json(
    {
      status: dbOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeMs: Date.now() - started,
      db: { ok: dbOk, latencyMs: dbLatencyMs },
      version: process.env.npm_package_version ?? null,
    },
    { status: dbOk ? 200 : 503 },
  );
}
