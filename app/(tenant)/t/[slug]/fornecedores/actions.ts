"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";
import { consultarCnpj, CnpjError } from "@/lib/consultas/cnpj";
import { consultarCep, CepError } from "@/lib/consultas/cep";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Remove tudo que não for dígito */
function apenasDigitos(v: string) {
  return v.replace(/\D/g, "");
}

async function resolverTenantId(slug: string, session: Awaited<ReturnType<typeof requireSession>>) {
  if (session.user.escopo === "PLATAFORMA") {
    return (await requireTenantPorSlug(slug)).id;
  }
  return session.user.tenantId!;
}

// ─── Schema de validação ──────────────────────────────────────────────────────

const cnaeSchema = z.object({
  codigo:    z.string().min(1),
  descricao: z.string().min(1),
  principal: z.boolean(),
});

const fornecedorSchema = z
  .object({
    tipoPessoa:  z.enum(["PF", "PJ"]),
    nome:        z.string().min(2, "Nome obrigatório"),
    razaoSocial: z.string().optional(),
    documento:   z.string().min(11, "CPF ou CNPJ inválido"),
    email:       z.string().email("E-mail inválido").optional().or(z.literal("")),
    telefone:    z.string().optional(),
    cep:         z.string().optional(),
    logradouro:  z.string().optional(),
    numero:      z.string().optional(),
    complemento: z.string().optional(),
    bairro:      z.string().optional(),
    cidade:      z.string().optional(),
    estado:      z.string().max(2).optional(),
    observacoes: z.string().optional(),
    // Dados da Receita (apenas PJ, preenchidos pela consulta CNPJ)
    situacaoCadastral:   z.string().optional(),
    naturezaJuridica:    z.string().optional(),
    porteEmpresa:        z.string().optional(),
    dataInicioAtividade: z.string().optional(),
    cnaesJson:           z.string().optional(),
    dadosCnpjJson:       z.string().optional(),
  })
  .transform((d) => ({
    ...d,
    documento:   apenasDigitos(d.documento),
    cep:         d.cep ? apenasDigitos(d.cep) : undefined,
    telefone:    d.telefone ? apenasDigitos(d.telefone) : undefined,
    email:       d.email || undefined,
    razaoSocial: d.tipoPessoa === "PJ" ? d.razaoSocial : undefined,
  }));

/** Extrai e valida os dados de Receita/CNAEs do submit (somente PJ). */
function extrairDadosReceita(d: z.infer<typeof fornecedorSchema>) {
  if (d.tipoPessoa !== "PJ") {
    return { cnaes: [] as z.infer<typeof cnaeSchema>[], receita: {} };
  }

  let cnaes: z.infer<typeof cnaeSchema>[] = [];
  if (d.cnaesJson) {
    try {
      const parsed = z.array(cnaeSchema).safeParse(JSON.parse(d.cnaesJson));
      if (parsed.success) cnaes = parsed.data;
    } catch {
      // JSON inválido: ignora silenciosamente, cadastro segue sem CNAEs
    }
  }

  let dadosCnpjJson: unknown;
  if (d.dadosCnpjJson) {
    try {
      dadosCnpjJson = JSON.parse(d.dadosCnpjJson);
    } catch {
      dadosCnpjJson = undefined;
    }
  }

  const inicioAtividade = d.dataInicioAtividade
    ? new Date(d.dataInicioAtividade)
    : undefined;

  return {
    cnaes,
    receita: {
      situacaoCadastral:   d.situacaoCadastral || null,
      naturezaJuridica:    d.naturezaJuridica || null,
      porteEmpresa:        d.porteEmpresa || null,
      dataInicioAtividade:
        inicioAtividade && !isNaN(inicioAtividade.getTime()) ? inicioAtividade : null,
      ...(dadosCnpjJson !== undefined ? { dadosCnpjJson: dadosCnpjJson as any } : {}),
    },
  };
}

// ─── Consulta CNPJ (OpenCNPJ) ─────────────────────────────────────────────────

export interface ConsultaCnpjResult {
  error?: string;
  data?: {
    razaoSocial: string;
    nomeFantasia: string;
    situacaoCadastral: string;
    naturezaJuridica: string;
    porteEmpresa: string;
    dataInicioAtividade: string;
    email: string;
    telefone: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    cnaes: { codigo: string; descricao: string; principal: boolean }[];
    raw: unknown;
  };
}

export async function consultarCnpjAction(cnpj: string): Promise<ConsultaCnpjResult> {
  const session = await requireSession();
  if (session.user.escopo !== "STAFF" && session.user.escopo !== "PLATAFORMA") {
    return { error: "Sem permissão." };
  }

  const digitos = apenasDigitos(cnpj);
  if (digitos.length !== 14) {
    return { error: "CNPJ deve ter 14 dígitos." };
  }

  let json: any;
  try {
    // Cache compartilhado da plataforma: só chama a OpenCNPJ em miss/stale
    const consulta = await consultarCnpj(digitos);
    json = consulta.payload;
  } catch (err) {
    if (err instanceof CnpjError) return { error: err.message };
    return { error: "Não foi possível consultar o CNPJ. Tente novamente." };
  }

  const telefone = json.telefones?.[0]
    ? `${json.telefones[0].ddd ?? ""}${json.telefones[0].numero ?? ""}`
    : "";

  const cnaes: NonNullable<ConsultaCnpjResult["data"]>["cnaes"] = Array.isArray(json.cnaes)
    ? json.cnaes.map((c: any) => ({
        codigo: String(c.codigo ?? ""),
        descricao: String(c.descricao ?? ""),
        principal: Boolean(c.is_principal),
      }))
    : [];

  return {
    data: {
      razaoSocial:         json.razao_social ?? "",
      nomeFantasia:        json.nome_fantasia || json.razao_social || "",
      situacaoCadastral:   json.situacao_cadastral ?? "",
      naturezaJuridica:    json.natureza_juridica ?? "",
      porteEmpresa:        json.porte_empresa ?? "",
      dataInicioAtividade: json.data_inicio_atividade ?? "",
      email:               (json.email ?? "").toLowerCase(),
      telefone,
      cep:                 apenasDigitos(json.cep ?? ""),
      logradouro:          [json.tipo_logradouro, json.logradouro].filter(Boolean).join(" "),
      numero:              json.numero ?? "",
      complemento:         (json.complemento ?? "").replace(/\s+/g, " ").trim(),
      bairro:              json.bairro ?? "",
      cidade:              json.municipio ?? "",
      estado:              json.uf ?? "",
      cnaes,
      raw: json,
    },
  };
}

// ─── Consulta CEP (ViaCEP com cache da plataforma) ────────────────────────────

export interface ConsultaCepResult {
  error?: string;
  data?: {
    logradouro: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
}

export async function consultarCepAction(cep: string): Promise<ConsultaCepResult> {
  const session = await requireSession();
  if (session.user.escopo !== "STAFF" && session.user.escopo !== "PLATAFORMA") {
    return { error: "Sem permissão." };
  }

  const digitos = apenasDigitos(cep);
  if (digitos.length !== 8) {
    return { error: "CEP deve ter 8 dígitos." };
  }

  try {
    const { logradouro, bairro, cidade, uf } = await consultarCep(digitos);
    return { data: { logradouro, bairro, cidade, uf } };
  } catch (err) {
    if (err instanceof CepError) return { error: err.message };
    return { error: "Erro ao consultar o CEP. Tente novamente." };
  }
}

// ─── Criar ────────────────────────────────────────────────────────────────────

export async function criarFornecedorAction(
  slug: string,
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireSession();
  const tenantId = await resolverTenantId(slug, session);

  const raw = Object.fromEntries(formData.entries());
  const parsed = fornecedorSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  // Verifica duplicidade de documento dentro do tenant
  const existe = await prisma.fornecedor.findFirst({
    where: { tenantId, documento: d.documento },
    select: { id: true },
  });
  if (existe) return { error: "Já existe um fornecedor com esse CPF/CNPJ." };

  const { cnaes, receita } = extrairDadosReceita(d);

  await prisma.fornecedor.create({
    data: {
      tenantId,
      tipoPessoa:  d.tipoPessoa as any,
      nome:        d.nome,
      razaoSocial: d.razaoSocial,
      documento:   d.documento,
      email:       d.email,
      telefone:    d.telefone,
      cep:         d.cep,
      logradouro:  d.logradouro,
      numero:      d.numero,
      complemento: d.complemento,
      bairro:      d.bairro,
      cidade:      d.cidade,
      estado:      d.estado,
      observacoes: d.observacoes,
      ...receita,
      ...(cnaes.length > 0 ? { cnaes: { createMany: { data: cnaes } } } : {}),
    },
  });

  revalidatePath(`/t/${slug}/fornecedores`);
  redirect(`/t/${slug}/fornecedores`);
}

// ─── Atualizar ────────────────────────────────────────────────────────────────

export async function atualizarFornecedorAction(
  slug: string,
  fornecedorId: string,
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireSession();
  const tenantId = await resolverTenantId(slug, session);

  const raw = Object.fromEntries(formData.entries());
  const parsed = fornecedorSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  // Verifica duplicidade de documento excluindo o próprio registro
  const existe = await prisma.fornecedor.findFirst({
    where: { tenantId, documento: d.documento, NOT: { id: fornecedorId } },
    select: { id: true },
  });
  if (existe) return { error: "Já existe outro fornecedor com esse CPF/CNPJ." };

  // Garante que o fornecedor pertence ao tenant (IDOR protection)
  const alvo = await prisma.fornecedor.findFirst({
    where: { id: fornecedorId, tenantId },
    select: { id: true },
  });
  if (!alvo) return { error: "Fornecedor não encontrado." };

  const { cnaes, receita } = extrairDadosReceita(d);

  await prisma.$transaction([
    prisma.fornecedor.update({
      where: { id: fornecedorId },
      data: {
        tipoPessoa:  d.tipoPessoa as any,
        nome:        d.nome,
        razaoSocial: d.razaoSocial,
        documento:   d.documento,
        email:       d.email,
        telefone:    d.telefone,
        cep:         d.cep,
        logradouro:  d.logradouro,
        numero:      d.numero,
        complemento: d.complemento,
        bairro:      d.bairro,
        cidade:      d.cidade,
        estado:      d.estado,
        observacoes: d.observacoes,
        ...receita,
      },
    }),
    // Substitui os CNAEs somente quando o submit trouxe uma nova lista
    // (nova consulta CNPJ) ou quando o fornecedor virou PF.
    ...(d.tipoPessoa !== "PJ" || cnaes.length > 0
      ? [prisma.fornecedorCnae.deleteMany({ where: { fornecedorId } })]
      : []),
    ...(cnaes.length > 0
      ? [
          prisma.fornecedorCnae.createMany({
            data: cnaes.map((c) => ({ ...c, fornecedorId })),
          }),
        ]
      : []),
  ]);

  revalidatePath(`/t/${slug}/fornecedores`);
  redirect(`/t/${slug}/fornecedores`);
}

// ─── Toggle ativo ─────────────────────────────────────────────────────────────

export async function toggleAtivoFornecedorAction(
  slug: string,
  fornecedorId: string,
  ativo: boolean,
): Promise<{ error?: string }> {
  const session = await requireSession();
  const tenantId = await resolverTenantId(slug, session);

  const f = await prisma.fornecedor.findFirst({
    where: { id: fornecedorId, tenantId },
    select: { id: true },
  });
  if (!f) return { error: "Fornecedor não encontrado." };

  await prisma.fornecedor.update({ where: { id: fornecedorId }, data: { ativo } });

  revalidatePath(`/t/${slug}/fornecedores`);
  return {};
}

// ─── Excluir ──────────────────────────────────────────────────────────────────

export async function excluirFornecedorAction(
  slug: string,
  fornecedorId: string,
): Promise<{ error?: string }> {
  const session = await requireSession();
  const tenantId = await resolverTenantId(slug, session);

  const f = await prisma.fornecedor.findFirst({
    where: { id: fornecedorId, tenantId },
    select: { id: true, _count: { select: { compras: true } } },
  });
  if (!f) return { error: "Fornecedor não encontrado." };
  if (f._count.compras > 0) {
    return { error: "Fornecedor possui compras vinculadas. Inative-o em vez de excluir." };
  }

  await prisma.fornecedor.delete({ where: { id: fornecedorId } });

  revalidatePath(`/t/${slug}/fornecedores`);
  return {};
}
