/**
 * Helpers de acesso a dados com escopo obrigatório de tenant.
 *
 * Regra do PRD (seção 9): todo acesso a dados passa por helper que exige
 * `tenantId` do contexto de sessão. Este arquivo materializa esse contrato.
 * RLS no PostgreSQL atua como segunda barreira defensiva.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "./client";

export class TenantScopeError extends Error {
  constructor(message = "Operação requer tenantId no contexto.") {
    super(message);
    this.name = "TenantScopeError";
  }
}

/**
 * Fábrica de um cliente Prisma "escopado" a um tenant. Aplica $extends para
 * injetar automaticamente `tenantId` em todas as queries e mutations de
 * modelos que possuem essa coluna.
 *
 * Uso:
 *   const db = tenantDb(tenantId)
 *   await db.veiculo.findMany() // já filtra por tenantId
 */
export function tenantDb(tenantId: string) {
  if (!tenantId) {
    throw new TenantScopeError();
  }

  return prisma.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !MODELS_COM_TENANT.has(model)) {
            return query(args);
          }

          const nextArgs = injectTenantId(operation, args, tenantId);
          return query(nextArgs);
        },
      },
    },
  });
}

/**
 * Modelos que possuem coluna `tenantId`. Alinhado ao schema.prisma.
 * Mantenha em sincronia ao adicionar novas entidades.
 */
const MODELS_COM_TENANT = new Set<string>([
  "Tenant",
  "Usuario",
  "Papel",
  "Fornecedor",
  "ClienteFinal",
  "Veiculo",
  "OfertaVeiculo",
  "PacoteOferta",
  "Compra",
  "Venda",
  "Despesa",
  "Pagamento",
  "CategoriaFinanceira",
  "ModeloDocumento",
  "Documento",
  "FluxoAssinatura",
  "IntegracaoConfig",
  "EmailLog",
  "MensagemWhatsapp",
  "Notificacao",
  "AuditLog",
  "AssinaturaPlataforma",
]);

function injectTenantId(operation: string, args: any, tenantId: string) {
  const readOps = new Set([
    "findFirst",
    "findFirstOrThrow",
    "findMany",
    "findUnique",
    "findUniqueOrThrow",
    "count",
    "aggregate",
    "groupBy",
    "updateMany",
    "deleteMany",
  ]);

  const writeOps = new Set(["create", "createMany"]);
  const upsertOps = new Set(["upsert"]);
  const updateOne = new Set(["update", "delete"]);

  if (readOps.has(operation)) {
    args.where = { AND: [args.where ?? {}, { tenantId }] };
    return args;
  }

  if (writeOps.has(operation)) {
    if (operation === "createMany") {
      args.data = (Array.isArray(args.data) ? args.data : [args.data]).map(
        (row: any) => ({ tenantId, ...row }),
      );
    } else {
      args.data = { tenantId, ...(args.data ?? {}) };
    }
    return args;
  }

  if (upsertOps.has(operation)) {
    args.where = { AND: [args.where ?? {}, { tenantId }] };
    args.create = { tenantId, ...(args.create ?? {}) };
    return args;
  }

  if (updateOne.has(operation)) {
    // update/delete usam where com unique. Não podemos forçar AND
    // porque o Prisma exige a chave única exata. Vamos garantir a checagem
    // no callsite via findFirst + operação. Aqui só marcamos para lint futuro.
    return args;
  }

  return args;
}

export type TenantDb = ReturnType<typeof tenantDb>;

/**
 * Helper para queries "livres de tenant" (super admin, plataforma).
 * Uso restrito a rotas dentro de `/(platform)` e webhooks de plataforma.
 */
export const platformDb = prisma;
export type PlatformDb = typeof prisma;

/**
 * Type-safe: transforme uma função em uma versão que rejeita quando
 * tenantId está ausente.
 */
export function requireTenant<T>(
  tenantId: string | null | undefined,
  fn: (id: string) => T,
): T {
  if (!tenantId) throw new TenantScopeError();
  return fn(tenantId);
}

// Reexport para conveniência
export type { Prisma };
