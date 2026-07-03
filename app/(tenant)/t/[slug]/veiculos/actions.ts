"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";
import { parseCentavos } from "@/lib/utils";

// ─── Schema ──────────────────────────────────────────────────────────────────

const veiculoSchema = z.object({
  tipo: z.enum(["carros", "motos", "caminhoes"]),
  marca: z.string().min(1, "Marca obrigatória"),
  modelo: z.string().min(1, "Modelo obrigatório"),
  versao: z.string().optional(),
  anoFabricacao: z.coerce.number().int().min(1960).max(new Date().getFullYear() + 1),
  anoModelo: z.coerce.number().int().min(1960).max(new Date().getFullYear() + 2),
  cor: z.string().optional(),
  combustivel: z.enum(["GASOLINA", "ETANOL", "FLEX", "DIESEL", "GNV", "HIBRIDO", "ELETRICO"]).optional(),
  cambio: z.enum(["MANUAL", "AUTOMATICO", "AUTOMATIZADO", "CVT"]).optional(),
  kmAtual: z.coerce.number().int().min(0).optional(),
  categoria: z.string().optional(),
  placa: z.string().optional(),
  renavam: z.string().optional(),
  chassi: z.string().optional(),
  situacaoDocumental: z.string().optional(),
  origem: z.enum(["COMPRA", "CONSIGNACAO", "TROCA"]).default("COMPRA"),
  fornecedorId: z.string().optional(),
  precoCustoCentavos: z.coerce.number().int().min(0).default(0),
  precoVendaCentavos: z.coerce.number().int().min(0).default(0),
  observacoes: z.string().optional(),
  // ─ Novos campos técnicos ──────────────────────────────────────────────────
  motor: z.string().optional(),
  portas: z.coerce.number().int().min(1).max(6).optional(),
  ufRegistro: z.string().optional(),
  tipoCrv: z.string().optional(),
  numeroCrv: z.string().optional(),
  chassiRemarcado: z.coerce.boolean().optional().default(false),
  blindado: z.coerce.boolean().optional().default(false),
  leilao: z.coerce.boolean().optional().default(false),
  sinistro: z.coerce.boolean().optional().default(false),
  manualProprietario: z.coerce.boolean().optional().default(false),
  chaveReserva: z.coerce.boolean().optional().default(false),
  proprietarioNome: z.string().optional(),
  proprietarioDoc: z.string().optional(),
});

// ─── Criar ────────────────────────────────────────────────────────────────────

export async function criarVeiculoAction(
  tenantSlug: string,
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  // Sessão já contém tenantId — sem round-trip extra ao banco
  const session = await requireSession();

  if (session.user.escopo !== "STAFF" && session.user.escopo !== "PLATAFORMA") {
    return { error: "Sem permissão para cadastrar veículos." };
  }

  // Para PLATAFORMA (super admin) precisamos resolver o tenant; para STAFF usamos o da sessão
  const tenantId =
    session.user.escopo === "PLATAFORMA"
      ? (await requireTenantPorSlug(tenantSlug)).id
      : session.user.tenantId!;

  const raw = {
    tipo:                 formData.get("tipo"),
    marca:                formData.get("marca"),
    modelo:               formData.get("modelo"),
    versao:               formData.get("versao") || undefined,
    anoFabricacao:        formData.get("anoFabricacao"),
    anoModelo:            formData.get("anoModelo"),
    cor:                  formData.get("cor") || undefined,
    combustivel:          formData.get("combustivel") || undefined,
    cambio:               formData.get("cambio") || undefined,
    kmAtual:              formData.get("kmAtual") || undefined,
    categoria:            formData.get("categoria") || undefined,
    placa:                formData.get("placa") || undefined,
    renavam:              formData.get("renavam") || undefined,
    chassi:               formData.get("chassi") || undefined,
    situacaoDocumental:   formData.get("situacaoDocumental") || undefined,
    origem:               formData.get("origem") || "COMPRA",
    fornecedorId:         formData.get("fornecedorId") || undefined,
    precoCustoCentavos:   parseCentavos(String(formData.get("precoCusto") ?? "0")),
    precoVendaCentavos:   parseCentavos(String(formData.get("precoVenda") ?? "0")),
    observacoes:          formData.get("observacoes") || undefined,
    motor:                formData.get("motor") || undefined,
    portas:               formData.get("portas") || undefined,
    ufRegistro:           formData.get("ufRegistro") || undefined,
    tipoCrv:              formData.get("tipoCrv") || undefined,
    numeroCrv:            formData.get("numeroCrv") || undefined,
    chassiRemarcado:      formData.get("chassiRemarcado") === "true",
    blindado:             formData.get("blindado") === "true",
    leilao:               formData.get("leilao") === "true",
    sinistro:             formData.get("sinistro") === "true",
    manualProprietario:   formData.get("manualProprietario") === "true",
    chaveReserva:         formData.get("chaveReserva") === "true",
    proprietarioNome:     formData.get("proprietarioNome") || undefined,
    proprietarioDoc:      formData.get("proprietarioDoc") || undefined,
  };

  const parsed = veiculoSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { error: `${first.path.join(".")}: ${first.message}` };
  }

  const data = parsed.data;

  await prisma.veiculo.create({
    data: {
      tenantId,
      marca:              data.marca,
      modelo:             data.modelo,
      versao:             data.versao,
      anoFabricacao:      data.anoFabricacao,
      anoModelo:          data.anoModelo,
      cor:                data.cor,
      combustivel:        data.combustivel as any,
      cambio:             data.cambio as any,
      kmAtual:            data.kmAtual,
      categoria:          data.categoria,
      placa:              data.placa?.toUpperCase() || null,
      renavam:            data.renavam || null,
      chassi:             data.chassi?.toUpperCase() || null,
      situacaoDocumental: data.situacaoDocumental,
      origem:             data.origem as any,
      fornecedorId:       data.fornecedorId || null,
      precoCustoCentavos: data.precoCustoCentavos,
      precoVendaCentavos: data.precoVendaCentavos,
      observacoes:        data.observacoes,
      status:             "EM_PREPARACAO",
      motor:              data.motor,
      portas:             data.portas,
      ufRegistro:         data.ufRegistro,
      tipoCrv:            data.tipoCrv,
      numeroCrv:          data.numeroCrv,
      chassiRemarcado:    data.chassiRemarcado ?? false,
      blindado:           data.blindado ?? false,
      leilao:             data.leilao ?? false,
      sinistro:           data.sinistro ?? false,
      manualProprietario: data.manualProprietario ?? false,
      chaveReserva:       data.chaveReserva ?? false,
      proprietarioNome:   data.proprietarioNome,
      proprietarioDoc:    data.proprietarioDoc,
    },
  });

  revalidatePath(`/t/${tenantSlug}/veiculos`);
  redirect(`/t/${tenantSlug}/veiculos`);
}

// ─── Atualizar dados do veículo ───────────────────────────────────────────────

export async function atualizarVeiculoAction(
  tenantSlug: string,
  veiculoId: string,
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireSession();
  if (session.user.escopo !== "STAFF" && session.user.escopo !== "PLATAFORMA") {
    return { error: "Sem permissão." };
  }

  const tenantId =
    session.user.escopo === "PLATAFORMA"
      ? (await requireTenantPorSlug(tenantSlug)).id
      : session.user.tenantId!;

  const veiculo = await prisma.veiculo.findFirst({ where: { id: veiculoId, tenantId } });
  if (!veiculo) return { error: "Veículo não encontrado." };

  const raw = {
    tipo:               formData.get("tipo"),
    marca:              formData.get("marca"),
    modelo:             formData.get("modelo"),
    versao:             formData.get("versao") || undefined,
    anoFabricacao:      formData.get("anoFabricacao"),
    anoModelo:          formData.get("anoModelo"),
    cor:                formData.get("cor") || undefined,
    combustivel:        formData.get("combustivel") || undefined,
    cambio:             formData.get("cambio") || undefined,
    kmAtual:            formData.get("kmAtual") || undefined,
    categoria:          formData.get("categoria") || undefined,
    placa:              formData.get("placa") || undefined,
    renavam:            formData.get("renavam") || undefined,
    chassi:             formData.get("chassi") || undefined,
    situacaoDocumental: formData.get("situacaoDocumental") || undefined,
    origem:             formData.get("origem") || "COMPRA",
    fornecedorId:       formData.get("fornecedorId") || undefined,
    precoCustoCentavos: parseCentavos(String(formData.get("precoCusto") ?? "0")),
    precoVendaCentavos: parseCentavos(String(formData.get("precoVenda") ?? "0")),
    observacoes:        formData.get("observacoes") || undefined,
    motor:              formData.get("motor") || undefined,
    portas:             formData.get("portas") || undefined,
    ufRegistro:         formData.get("ufRegistro") || undefined,
    tipoCrv:            formData.get("tipoCrv") || undefined,
    numeroCrv:          formData.get("numeroCrv") || undefined,
    chassiRemarcado:    formData.get("chassiRemarcado") === "true",
    blindado:           formData.get("blindado") === "true",
    leilao:             formData.get("leilao") === "true",
    sinistro:           formData.get("sinistro") === "true",
    manualProprietario: formData.get("manualProprietario") === "true",
    chaveReserva:       formData.get("chaveReserva") === "true",
    proprietarioNome:   formData.get("proprietarioNome") || undefined,
    proprietarioDoc:    formData.get("proprietarioDoc") || undefined,
  };

  const parsed = veiculoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;

  // Estágio do ciclo de vendas (opcional no form de edição)
  const statusRaw = formData.get("status");
  const statusParsed = statusRaw ? statusVeiculoSchema.safeParse(statusRaw) : null;
  if (statusRaw && !statusParsed?.success) {
    return { error: "Estágio inválido." };
  }

  await prisma.veiculo.update({
    where: { id: veiculoId },
    data: {
      marca:              data.marca,
      modelo:             data.modelo,
      versao:             data.versao,
      anoFabricacao:      data.anoFabricacao,
      anoModelo:          data.anoModelo,
      cor:                data.cor,
      combustivel:        data.combustivel as any,
      cambio:             data.cambio as any,
      kmAtual:            data.kmAtual,
      categoria:          data.categoria,
      placa:              data.placa?.toUpperCase() || null,
      renavam:            data.renavam || null,
      chassi:             data.chassi?.toUpperCase() || null,
      situacaoDocumental: data.situacaoDocumental,
      origem:             data.origem as any,
      fornecedorId:       data.fornecedorId || null,
      precoCustoCentavos: data.precoCustoCentavos,
      precoVendaCentavos: data.precoVendaCentavos,
      observacoes:        data.observacoes,
      motor:              data.motor,
      portas:             data.portas,
      ufRegistro:         data.ufRegistro,
      tipoCrv:            data.tipoCrv,
      numeroCrv:          data.numeroCrv,
      chassiRemarcado:    data.chassiRemarcado ?? false,
      blindado:           data.blindado ?? false,
      leilao:             data.leilao ?? false,
      sinistro:           data.sinistro ?? false,
      manualProprietario: data.manualProprietario ?? false,
      chaveReserva:       data.chaveReserva ?? false,
      proprietarioNome:   data.proprietarioNome,
      proprietarioDoc:    data.proprietarioDoc,
      ...(statusParsed?.success ? { status: statusParsed.data } : {}),
    },
  });

  revalidatePath(`/t/${tenantSlug}/veiculos`);
  redirect(`/t/${tenantSlug}/veiculos`);
}

// ─── Atualizar status ─────────────────────────────────────────────────────────

const statusVeiculoSchema = z.enum([
  "NEGOCIANDO",
  "DISPONIVEL",
  "EM_PREPARACAO",
  "RESERVADO",
  "VENDIDO",
  "BAIXADO",
]);

export async function atualizarStatusVeiculoAction(
  tenantSlug: string,
  veiculoId: string,
  status: z.infer<typeof statusVeiculoSchema>,
): Promise<{ error?: string }> {
  const session = await requireSession();
  if (session.user.escopo !== "STAFF" && session.user.escopo !== "PLATAFORMA") {
    return { error: "Sem permissão." };
  }

  const parsedStatus = statusVeiculoSchema.safeParse(status);
  if (!parsedStatus.success) return { error: "Status inválido." };

  const tenantId =
    session.user.escopo === "PLATAFORMA"
      ? (await requireTenantPorSlug(tenantSlug)).id
      : session.user.tenantId!;

  // findFirst garante que o veículo pertence ao tenant (IDOR protection)
  const veiculo = await prisma.veiculo.findFirst({
    where: { id: veiculoId, tenantId },
    include: {
      checklists: {
        select: { id: true, status: true },
      },
    },
  });
  if (!veiculo) return { error: "Veículo não encontrado." };

  const novoStatus = parsedStatus.data;

  // ─ Regra: RESERVADO exige ao menos 1 checklist (pode ser pendente) ─
  if (novoStatus === "RESERVADO" && veiculo.checklists.length === 0) {
    return {
      error:
        "Não é possível reservar o veículo sem pelo menos 1 checklist de inspeção. Crie um checklist antes.",
    };
  }

  // ─ Regra: VENDIDO exige ao menos 1 checklist CONCLUIDO ─
  if (novoStatus === "VENDIDO") {
    const temConcluido = veiculo.checklists.some((c) => c.status === "CONCLUIDO");
    if (!temConcluido) {
      return {
        error:
          "Não é possível marcar o veículo como vendido sem um checklist de inspeção concluído.",
      };
    }
  }

  const updateData: Record<string, unknown> = { status: novoStatus };

  // ─ Auto-preenche dataChegada quando o veículo fica disponível ─
  if (novoStatus === "DISPONIVEL" && !veiculo.dataChegada) {
    updateData.dataChegada = new Date();
  }

  await prisma.veiculo.update({
    where: { id: veiculoId },
    data: updateData,
  });

  revalidatePath(`/t/${tenantSlug}/veiculos`);
  revalidatePath(`/t/${tenantSlug}/veiculos/${veiculoId}/editar`);
  return {};
}

// ─── Excluir ──────────────────────────────────────────────────────────────────

export async function excluirVeiculoAction(
  tenantSlug: string,
  veiculoId: string,
): Promise<{ error?: string }> {
  const session = await requireSession();
  if (session.user.escopo !== "STAFF" && session.user.escopo !== "PLATAFORMA") {
    return { error: "Sem permissão." };
  }

  const tenantId =
    session.user.escopo === "PLATAFORMA"
      ? (await requireTenantPorSlug(tenantSlug)).id
      : session.user.tenantId!;

  const veiculo = await prisma.veiculo.findFirst({
    where: { id: veiculoId, tenantId },
  });
  if (!veiculo) return { error: "Veículo não encontrado." };
  if (veiculo.status === "VENDIDO") return { error: "Veículo vendido não pode ser excluído." };

  await prisma.veiculo.delete({ where: { id: veiculoId } });

  revalidatePath(`/t/${tenantSlug}/veiculos`);
  return {};
}

// ─── Fornecedores para o formulário ──────────────────────────────────────────

export async function getFornecedoresTenant(tenantSlug: string) {
  const session = await requireSession();

  const tenantId =
    session.user.escopo === "PLATAFORMA"
      ? (await requireTenantPorSlug(tenantSlug)).id
      : session.user.tenantId!;

  return prisma.fornecedor.findMany({
    where: { tenantId, ativo: true },
    select: { id: true, nome: true, documento: true },
    orderBy: { nome: "asc" },
  });
}
