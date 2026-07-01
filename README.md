# AutoGestão — Plataforma multi-tenant de gestão de veículos

SaaS multi-tenant para revendas de veículos. Cobre o ciclo completo: oferta do
fornecedor → compra → estoque → venda → documentos → assinatura → financeiro.

Este repositório contém a **Fase 0 (Fundação)** implementada conforme o PRD em
`cursor.md`. As fases seguintes serão evoluídas em cima desta base.

## Stack

- **Next.js 15** (App Router) + TypeScript + React 19
- **Tailwind CSS** + shadcn/ui + Radix
- **Prisma** ORM + PostgreSQL (Neon)
- **Auth.js v5** (Credentials + JWT), preparado para multi-tenant
- **Vercel** para deploy (serverless-friendly)

## Estrutura

```
app/
  (marketing)/          # landing, login, planos (público)
  (platform)/admin/     # painel do Super Admin
  (tenant)/t/[slug]/    # painel operacional do tenant
  (supplier)/portal-fornecedor/[slug]/   # portal do fornecedor
  (customer)/portal-cliente/[slug]/       # portal do cliente
  api/                  # rotas e webhooks (auth, health, ...)
lib/
  auth/                 # sessão, escopo, permissões
  db/                   # cliente Prisma + helpers tenant-scoped
  tenant/               # resolução de tenant por slug
  integrations/         # adapters plugáveis (SignatureProvider, ...)
  jobs/                 # abstração de fila
  crypto/               # AES-256-GCM para IntegracaoConfig
components/
  ui/                   # shadcn (button, card, input, ...)
  portal/               # shell de portal (sidebar, stat card, ...)
prisma/
  schema.prisma
  seed.ts
  migrations/rls-bootstrap.sql
```

## Setup local

### 1. Instale as dependências

```bash
npm install
```

### 2. Provisione um banco Neon

Crie um projeto grátis em [neon.tech](https://neon.tech) e copie as duas URLs
(pooled e direct) para `.env.local`:

```bash
cp .env.example .env.local
```

Gere os segredos:

```bash
# AUTH_SECRET
openssl rand -base64 32

# INTEGRATION_ENCRYPTION_KEY (32 bytes / 256 bits em base64)
openssl rand -base64 32
```

### 3. Rode as migrações e o seed

```bash
npm run db:migrate     # cria as tabelas
npm run db:seed        # cria planos, permissões, tenant demo e usuários
```

Opcional — habilite RLS (recomendado em produção):

```bash
psql "$DIRECT_URL" -f prisma/migrations/rls-bootstrap.sql
```

### 4. Inicie o dev server

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Credenciais do seed

- **Super Admin** (painel da plataforma): `admin@autogestao.com` / `admin@123` → `/admin`
- **Admin do tenant demo**: slug `demo`, `admin@demo.com` / `demo@123` → `/t/demo`

## Deploy no Vercel

1. Push do repositório para GitHub.
2. Importe no Vercel; ele detecta o Next.js automaticamente.
3. Configure as variáveis de ambiente listadas em `.env.example`.
4. Ative o build hook do Prisma configurando o `postinstall` (já está em
   `package.json`).
5. Execute `prisma migrate deploy` no primeiro deploy (via CI ou Vercel Build
   Environment Variable `PRISMA_MIGRATE_ON_DEPLOY=1`).

## Roadmap

- **Fase 0 — Fundação** *(pronta)*: Next.js + Prisma + Auth + RBAC + tenant
  resolver + painel Super Admin mínimo + 4 portais navegáveis.
- **Fase 1 — Núcleo operacional (MVP)**: estoque, ofertas, compras, vendas,
  financeiro básico.
- **Fase 2 — Documentos e assinatura**: modelos, geração de PDF, DocuSign.
- **Fase 3 — Comunicação**: e-mail transacional + WhatsApp com fila.
- **Fase 4 — Plataforma e billing**: planos, limites, métricas, faturamento.
- **Fase 5 — Integrações avançadas**: PIX, consulta veicular, domínio
  customizado por tenant.

## Princípios de segurança

- **`tenantId` obrigatório**: toda entidade de negócio carrega `tenantId`. A
  camada de acesso (`lib/db/scoped.ts`) exige o tenant do contexto de sessão e
  injeta o filtro automaticamente.
- **RLS como segunda barreira**: policies do PostgreSQL bloqueiam vazamentos
  mesmo se um filtro for esquecido no código.
- **IDOR**: nunca confiamos em ID vindo do cliente sem checar `tenantId`.
- **Segredos criptografados**: `IntegracaoConfig` armazena credenciais com
  AES-256-GCM (`lib/crypto/encrypt.ts`).
- **AuditLog**: modelo pronto para trilha completa (LGPD).

## Convenções

- Server Actions para mutações; validação com Zod na borda.
- Valores monetários em inteiros (centavos) — nunca float.
- Nomes de entidades em português no domínio; código e tipos em inglês
  idiomático (`prisma.veiculo.findMany()`, `formatCentavos()`).
- Interfaces de integração intercambiáveis (`SignatureProvider`,
  `EmailProvider`, `MessagingProvider`).

---

Este projeto foi inicializado a partir do PRD em `cursor.md`.
