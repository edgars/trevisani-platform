import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { gerarUrlAssinada, DOCS_BUCKET } from "@/lib/storage/supabase";

/**
 * GET /api/arquivos/veiculo/[documentoId]/url
 *
 * Gera uma Signed URL com validade de 1 hora para um documento privado.
 * Exige sessão ativa — sem sessão, retorna 401.
 * Verifica que o documento pertence ao tenant do usuário (IDOR protection).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ documentoId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { documentoId } = await params;

  // Super admin pode acessar qualquer documento; staff só do próprio tenant
  const where =
    session.user.escopo === "PLATAFORMA"
      ? { id: documentoId }
      : { id: documentoId, veiculo: { tenantId: session.user.tenantId! } };

  const doc = await prisma.documentoVeiculo.findFirst({
    where,
    select: { storagePath: true },
  });

  if (!doc) {
    return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  }

  try {
    const signedUrl = await gerarUrlAssinada(DOCS_BUCKET, doc.storagePath, 3600);
    return NextResponse.json({ url: signedUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
