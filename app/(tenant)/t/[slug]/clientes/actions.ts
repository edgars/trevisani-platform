"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { validarCpf, limparCpf } from "@/lib/utils/cpf";
import { validarCnpj, consultarCnpj, type CnpjDados } from "@/lib/integrations/cnpj";
import { GERAIS_BUCKET, getPublicUrl, uploadArquivo } from "@/lib/storage/supabase";
import { registrarEvento, atualizarStorageTenant } from "@/lib/tracking/eventos";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function resolveTenantId(slug: string): Promise<string> {
  const session = await requireSession();
  if (session.user.escopo !== "STAFF" && session.user.escopo !== "PLATAFORMA") {
    throw new Error("Sem permissão.");
  }
  return session.user.escopo === "PLATAFORMA"
    ? (await requireTenantPorSlug(slug)).id
    : session.user.tenantId!;
}

// ─── Schema de validação ─────────────────────────────────────────────────────

const clienteSchema = z.object({
  tipoPessoa: z.enum(["PF", "PJ"]).default("PF"),
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  documento: z.string().min(11, "CPF/CNPJ obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  aniversarioDia: z.coerce.number().int().min(1).max(31).nullable().optional(),
  aniversarioMes: z.coerce.number().int().min(1).max(12).nullable().optional(),
  tags: z.string().optional(), // JSON string: string[]
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  observacoes: z.string().optional(),
  consenteLgpd: z.coerce.boolean().default(false),
});

// ─── Lookup: CPF ou CNPJ → redireciona ou retorna dados ─────────────────────

export type LookupResult =
  | { type: "found"; clienteId: string }
  | { type: "novo_pf"; cpf: string }
  | { type: "novo_pj"; cnpj: string; dados: CnpjDados }
  | { type: "cnpj_nao_encontrado"; cnpj: string }
  | { type: "error"; message: string };

export async function lookupClienteAction(
  tenantSlug: string,
  identificador: string,
): Promise<LookupResult> {
  const tenantId = await resolveTenantId(tenantSlug).catch((e) => {
    throw new Error(e.message);
  });
  const limpo = identificador.replace(/\D/g, "");

  // ─ CPF ──────────────────────────────────────────────────────────────────
  if (limpo.length === 11) {
    if (!validarCpf(limpo)) return { type: "error", message: "CPF inválido." };

    const existente = await prisma.clienteFinal.findUnique({
      where: { tenantId_documento: { tenantId, documento: limpo } },
      select: { id: true },
    });
    if (existente) return { type: "found", clienteId: existente.id };
    return { type: "novo_pf", cpf: limpo };
  }

  // ─ CNPJ ─────────────────────────────────────────────────────────────────
  if (limpo.length === 14) {
    if (!validarCnpj(limpo)) return { type: "error", message: "CNPJ inválido." };

    const existente = await prisma.clienteFinal.findUnique({
      where: { tenantId_documento: { tenantId, documento: limpo } },
      select: { id: true },
    });
    if (existente) return { type: "found", clienteId: existente.id };

    const dados = await consultarCnpj(limpo);
    if (!dados) return { type: "cnpj_nao_encontrado", cnpj: limpo };
    // Track CNPJ lookup (fire-and-forget)
    registrarEvento(tenantId, "consulta_cnpj", { cnpj: limpo });
    return { type: "novo_pj", cnpj: limpo, dados };
  }

  return { type: "error", message: "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido." };
}

// ─── Autocomplete de clientes por nome ───────────────────────────────────────

export interface ClienteSugestao {
  id: string;
  nome: string;
  documento: string;
  tipoPessoa: "PF" | "PJ";
  cidade: string | null;
}

export async function buscarClientesAction(
  tenantSlug: string,
  q: string,
): Promise<ClienteSugestao[]> {
  if (q.trim().length < 2) return [];
  const tenantId = await resolveTenantId(tenantSlug).catch(() => null);
  if (!tenantId) return [];

  return prisma.clienteFinal.findMany({
    where: {
      tenantId,
      ativo: true,
      nome: { contains: q.trim(), mode: "insensitive" },
    },
    take: 8,
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, documento: true, tipoPessoa: true, cidade: true },
  }) as Promise<ClienteSugestao[]>;
}

// ─── Criar cliente ───────────────────────────────────────────────────────────

function parseTags(raw: string | null): string[] {
  try { return raw ? (JSON.parse(raw) as string[]) : []; }
  catch { return []; }
}

export async function criarClienteAction(
  tenantSlug: string,
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const tenantId = await resolveTenantId(tenantSlug).catch((e) => {
    throw new Error(e.message);
  });

  const raw = extractFormData(formData);
  const parsed = clienteSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Dados inválidos." };

  const { documento, tipoPessoa } = parsed.data;
  const docLimpo = limparCpf(documento);

  // Validações de documento
  if (tipoPessoa === "PF" && !validarCpf(docLimpo)) return { error: "CPF inválido." };
  if (tipoPessoa === "PJ" && !validarCnpj(docLimpo)) return { error: "CNPJ inválido." };

  const existe = await prisma.clienteFinal.findUnique({
    where: { tenantId_documento: { tenantId, documento: docLimpo } },
  });
  if (existe) return { error: `Já existe um cliente com este ${tipoPessoa === "PJ" ? "CNPJ" : "CPF"}.` };

  const { id } = await prisma.clienteFinal.create({
    data: {
      tenantId,
      tipoPessoa: parsed.data.tipoPessoa,
      nome: parsed.data.nome,
      documento: docLimpo,
      email: parsed.data.email || null,
      telefone: parsed.data.telefone || null,
      aniversarioDia: parsed.data.aniversarioDia ?? null,
      aniversarioMes: parsed.data.aniversarioMes ?? null,
      tags: parseTags(formData.get("tags") as string | null),
      cep: parsed.data.cep || null,
      logradouro: parsed.data.logradouro || null,
      numero: parsed.data.numero || null,
      complemento: parsed.data.complemento || null,
      bairro: parsed.data.bairro || null,
      cidade: parsed.data.cidade || null,
      uf: parsed.data.uf || null,
      observacoes: parsed.data.observacoes || null,
      consenteLgpd: parsed.data.consenteLgpd,
    },
    select: { id: true },
  });

  revalidatePath(`/t/${tenantSlug}/clientes`);
  redirect(`/t/${tenantSlug}/clientes/${id}/editar`);
}

// ─── Atualizar cliente ────────────────────────────────────────────────────────

export async function atualizarClienteAction(
  tenantSlug: string,
  clienteId: string,
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const tenantId = await resolveTenantId(tenantSlug).catch((e) => {
    throw new Error(e.message);
  });

  const cliente = await prisma.clienteFinal.findFirst({ where: { id: clienteId, tenantId } });
  if (!cliente) return { error: "Cliente não encontrado." };

  const raw = extractFormData(formData);
  const parsed = clienteSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Dados inválidos." };

  const docLimpo = limparCpf(parsed.data.documento);

  if (parsed.data.tipoPessoa === "PF" && !validarCpf(docLimpo))
    return { error: "CPF inválido." };
  if (parsed.data.tipoPessoa === "PJ" && !validarCnpj(docLimpo))
    return { error: "CNPJ inválido." };

  // Verifica duplicata (excluindo o próprio)
  if (docLimpo !== cliente.documento) {
    const existe = await prisma.clienteFinal.findUnique({
      where: { tenantId_documento: { tenantId, documento: docLimpo } },
    });
    if (existe) return { error: `Já existe um cliente com este ${parsed.data.tipoPessoa === "PJ" ? "CNPJ" : "CPF"}.` };
  }

  await prisma.clienteFinal.update({
    where: { id: clienteId },
    data: {
      tipoPessoa: parsed.data.tipoPessoa,
      nome: parsed.data.nome,
      documento: docLimpo,
      email: parsed.data.email || null,
      telefone: parsed.data.telefone || null,
      aniversarioDia: parsed.data.aniversarioDia ?? null,
      aniversarioMes: parsed.data.aniversarioMes ?? null,
      tags: parseTags(formData.get("tags") as string | null),
      cep: parsed.data.cep || null,
      logradouro: parsed.data.logradouro || null,
      numero: parsed.data.numero || null,
      complemento: parsed.data.complemento || null,
      bairro: parsed.data.bairro || null,
      cidade: parsed.data.cidade || null,
      uf: parsed.data.uf || null,
      observacoes: parsed.data.observacoes || null,
      consenteLgpd: parsed.data.consenteLgpd,
    },
  });

  revalidatePath(`/t/${tenantSlug}/clientes`);
  revalidatePath(`/t/${tenantSlug}/clientes/${clienteId}/editar`);
  return {};
}

// ─── Excluir cliente ──────────────────────────────────────────────────────────

export async function excluirClienteAction(
  tenantSlug: string,
  clienteId: string,
): Promise<{ error?: string }> {
  const tenantId = await resolveTenantId(tenantSlug).catch((e) => {
    throw new Error(e.message);
  });

  const cliente = await prisma.clienteFinal.findFirst({ where: { id: clienteId, tenantId } });
  if (!cliente) return { error: "Cliente não encontrado." };

  await prisma.clienteFinal.delete({ where: { id: clienteId } });
  revalidatePath(`/t/${tenantSlug}/clientes`);
  return {};
}

// ─── Upload de documento ─────────────────────────────────────────────────────

export async function uploadDocumentoClienteAction(
  tenantSlug: string,
  clienteId: string,
  formData: FormData,
): Promise<{ error?: string; doc?: { id: string; nome: string; url: string } }> {
  try {
    const tenantId = await resolveTenantId(tenantSlug);
    const cliente = await prisma.clienteFinal.findFirst({ where: { id: clienteId, tenantId } });
    if (!cliente) return { error: "Cliente não encontrado." };

    const file = formData.get("arquivo") as File | null;
    const descricao = String(formData.get("descricao") ?? "");
    if (!file) return { error: "Arquivo não enviado." };
    if (file.size > 10 * 1024 * 1024) return { error: "Arquivo muito grande (máx 10 MB)." };

    const extMap: Record<string, string> = {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    };
    const ext = extMap[file.type] ?? "bin";
    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `clientes/${clienteId}/docs/${Date.now()}.${ext}`;
    await uploadArquivo(GERAIS_BUCKET, storagePath, buffer, file.type);
    atualizarStorageTenant(tenantId, buffer.length);
    const url = getPublicUrl(GERAIS_BUCKET, storagePath);

    const doc = await prisma.documentoCliente.create({
      data: { clienteId, nome: file.name, url, storagePath, mimeType: file.type, tamanhoBytes: file.size, descricao: descricao || null },
      select: { id: true, nome: true, url: true },
    });

    revalidatePath(`/t/${tenantSlug}/clientes/${clienteId}/editar`);
    return { doc };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

// ─── Excluir documento ────────────────────────────────────────────────────────

export async function excluirDocumentoClienteAction(
  tenantSlug: string,
  docId: string,
): Promise<{ error?: string }> {
  try {
    const tenantId = await resolveTenantId(tenantSlug);
    const doc = await prisma.documentoCliente.findFirst({
      where: { id: docId },
      include: { cliente: { select: { tenantId: true } } },
    });
    if (!doc || doc.cliente.tenantId !== tenantId) return { error: "Documento não encontrado." };
    await prisma.documentoCliente.delete({ where: { id: docId } });
    revalidatePath(`/t/${tenantSlug}/clientes`);
    return {};
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

// ─── Helper interno ───────────────────────────────────────────────────────────

function extractFormData(formData: FormData) {
  return {
    tipoPessoa:     formData.get("tipoPessoa") || "PF",
    nome:           formData.get("nome"),
    documento:      String(formData.get("documento") ?? ""),
    email:          formData.get("email") || undefined,
    telefone:       String(formData.get("telefone") ?? "").replace(/\D/g, "") || undefined,
    aniversarioDia: formData.get("aniversarioDia") || undefined,
    aniversarioMes: formData.get("aniversarioMes") || undefined,
    cep:            String(formData.get("cep") ?? "").replace(/\D/g, "") || undefined,
    logradouro:     formData.get("logradouro") || undefined,
    numero:         formData.get("numero") || undefined,
    complemento:    formData.get("complemento") || undefined,
    bairro:         formData.get("bairro") || undefined,
    cidade:         formData.get("cidade") || undefined,
    uf:             formData.get("uf") || undefined,
    observacoes:    formData.get("observacoes") || undefined,
    consenteLgpd:   formData.get("consenteLgpd") === "true",
  };
}
