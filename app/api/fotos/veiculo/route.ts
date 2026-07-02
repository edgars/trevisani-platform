import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { uploadFoto, getPublicUrl, FOTOS_BUCKET } from "@/lib/storage/supabase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

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

  const file = formData.get("file") as File | null;
  const veiculoId = formData.get("veiculoId") as string | null;
  const status = (formData.get("status") as string) || "PRONTO_VENDA";
  const legenda = (formData.get("legenda") as string) || undefined;

  if (!file || !veiculoId) {
    return NextResponse.json({ error: "file e veiculoId são obrigatórios." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Formato inválido. Use JPG, PNG ou WEBP." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande (máx 10 MB)." }, { status: 400 });
  }

  // Garante que o veículo pertence ao tenant do usuário (proteção IDOR)
  const tenantId = session.user.tenantId!;
  const veiculo = await prisma.veiculo.findFirst({
    where: { id: veiculoId, tenantId },
    select: { id: true },
  });
  if (!veiculo) {
    return NextResponse.json({ error: "Veículo não encontrado." }, { status: 404 });
  }

  // Upload para Supabase
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";

  let storagePath: string;
  try {
    storagePath = await uploadFoto(tenantId, veiculoId, buffer, file.type, ext);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  const url = getPublicUrl(FOTOS_BUCKET, storagePath);

  // Conta fotos existentes para definir ordem
  const totalFotos = await prisma.fotoVeiculo.count({ where: { veiculoId } });

  const foto = await prisma.fotoVeiculo.create({
    data: {
      veiculoId,
      url,
      storagePath,
      legenda: legenda || null,
      status: status as any,
      destaque: totalFotos === 0, // primeira foto vira destaque automaticamente
      ordem: totalFotos,
    },
  });

  return NextResponse.json({ foto }, { status: 201 });
}
