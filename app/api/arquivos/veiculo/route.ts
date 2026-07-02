import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { uploadArquivo, DOCS_BUCKET } from "@/lib/storage/supabase";

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf":  "pdf",
  "image/jpeg":       "jpg",
  "image/png":        "png",
  "image/webp":       "webp",
};
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const file      = formData.get("file")      as File | null;
  const veiculoId = formData.get("veiculoId") as string | null;
  const tipo      = (formData.get("tipo") as string) || "OUTRO";

  if (!file || !veiculoId) {
    return NextResponse.json({ error: "file e veiculoId são obrigatórios." }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Formato não suportado. Use PDF, JPG, PNG ou WEBP." },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande (máx 20 MB)." }, { status: 400 });
  }

  const tenantId = session.user.tenantId!;

  const veiculo = await prisma.veiculo.findFirst({
    where: { id: veiculoId, tenantId },
    select: { id: true },
  });
  if (!veiculo) {
    return NextResponse.json({ error: "Veículo não encontrado." }, { status: 404 });
  }

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const storagePath = `${tenantId}/${veiculoId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  try {
    await uploadArquivo(DOCS_BUCKET, storagePath, buffer, file.type);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  // Bucket privado: não há URL pública. O storagePath é usado para gerar
  // Signed URLs on-demand via /api/arquivos/veiculo/[documentoId]/url
  const documento = await prisma.documentoVeiculo.create({
    data: {
      veiculoId,
      nome:        file.name,
      url:         storagePath, // referência interna — signed URL gerada sob demanda
      storagePath,
      mimeType:    file.type,
      tamanhoBytes: file.size,
      tipo:        tipo as any,
    },
  });

  return NextResponse.json({ documento }, { status: 201 });
}
