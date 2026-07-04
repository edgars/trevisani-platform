import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getUsoCompleto } from "@/lib/plano/limites";
import { sendPlatformEmail } from "@/lib/integrations/email/send-platform";
import { alerteLimitePlanoEmail } from "@/lib/integrations/email/templates/onboarding";

// Vercel Cron — runs once a day: "0 9 * * *" (9h UTC = 6h BRT)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://volante7.com.br";

  const tenants = await prisma.tenant.findMany({
    where: { status: "ATIVO", planoId: { not: null } },
    select: { id: true, nome: true, slug: true },
  });

  let notificados = 0;

  for (const tenant of tenants) {
    try {
      const uso = await getUsoCompleto(tenant.id);
      if (uso.alertas.length === 0) continue;

      // Find the primary responsible user
      const responsavel = await prisma.usuario.findFirst({
        where: { tenantId: tenant.id, escopo: "STAFF", ativo: true },
        orderBy: { createdAt: "asc" },
        select: { nome: true, email: true },
      });
      if (!responsavel) continue;

      // Build alert list
      const LABELS: Record<string, string> = {
        veiculos: "Veículos",
        usuarios: "Usuários",
        placas:   "Consultas de placa/mês",
        cnpjs:    "Consultas de CNPJ/mês",
        storage:  "Storage",
      };

      const itens = uso.alertas.map(r => {
        const info = uso[r];
        const limite = info.recurso === "storage"
          ? `${Math.round(info.limite / 1024 / 1024)} MB`
          : String(info.limite);
        const usado = info.recurso === "storage"
          ? `${Math.round(info.usado / 1024 / 1024)} MB`
          : String(info.usado);
        return { recurso: LABELS[r] ?? r, pct: info.pct, usado, limite };
      });

      const linkPlano = `${baseUrl}/t/${tenant.slug}/configuracoes/plano`;
      const emailData = alerteLimitePlanoEmail(responsavel.nome, tenant.nome, itens, linkPlano);

      await sendPlatformEmail({
        para: responsavel.email,
        assunto: emailData.assunto,
        html: emailData.html,
        texto: emailData.texto,
      });

      notificados++;
    } catch {
      // Never crash the cron — continue to next tenant
    }
  }

  return NextResponse.json({ ok: true, tenants: tenants.length, notificados, checkedAt: new Date().toISOString() });
}
