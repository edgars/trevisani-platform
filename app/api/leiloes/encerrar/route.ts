import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

// Vercel Cron Job — runs every minute: "* * * * *"
// Also callable manually (protected by CRON_SECRET)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // 1. Activate scheduled auctions whose start time has passed
  const ativados = await prisma.leilao.updateMany({
    where: { status: "AGENDADO", dataInicio: { lte: now } },
    data:  { status: "ATIVO" },
  });

  // 2. Close active auctions whose end time has passed — pick winner
  const expirados = await prisma.leilao.findMany({
    where: { status: "ATIVO", dataFim: { lte: now } },
    include: {
      lances: { orderBy: { valorCentavos: "desc" }, take: 1 },
    },
  });

  let encerrados = 0;
  for (const l of expirados) {
    const vencedor = l.lances[0] ?? null;
    await prisma.leilao.update({
      where: { id: l.id },
      data: {
        status:      "ENCERRADO",
        vencedorId:  vencedor?.clienteId ?? null,
        valorFinal:  vencedor?.valorCentavos ?? null,
      },
    });
    encerrados++;
  }

  return NextResponse.json({
    ok: true,
    ativados:   ativados.count,
    encerrados,
    checkedAt:  now.toISOString(),
  });
}
