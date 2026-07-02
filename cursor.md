# AutoGestão — Contexto do Projeto (PRD)

SaaS **multi-tenant** de gestão para lojas de compra e venda de carros (revendas e
concessionárias). Cobre o ciclo completo: oferta do fornecedor → compra → estoque →
venda → documentos → assinatura → financeiro.

## Stack

- **Next.js 15** (App Router) + TypeScript + React 19
- **Tailwind CSS** + shadcn/ui + Radix
- **Prisma** ORM + PostgreSQL (Neon)
- **Auth.js v5** (Credentials + JWT), multi-tenant
- **Vercel** para deploy (serverless-friendly)

## Visão de Negócio

Para uma revenda/concessionária, a **consulta de placas via API é o motor** que
automatiza a entrada de estoque, a avaliação e a precificação. O sistema deve
integrar o fluxo de dados desde a captação do veículo até a venda final.

### Fluxo de Automação com APIs de Placas

Ao digitar a placa no sistema, o software dispara requisições automáticas para
preencher a ficha do carro:

1. **Cadastro Automatizado**: a API retorna marca, modelo, ano/modelo, cor e
   chassi, eliminando erros humanos de digitação.
2. **Precificação de Compra**: o sistema usa o modelo retornado para consultar a
   **FIPE API** e sugerir uma margem de lucro (ex: pagar 80% da FIPE).
3. **Histórico e Segurança**: identifica se o veículo tem restrições de roubo,
   leilão ou sinistro antes de fechar o negócio.

## Módulos Essenciais do Sistema

Para gerenciar o negócio de ponta a ponta, o software se apoia em cinco pilares:

### 1. Módulo de Avaliação e Captação

- **Ficha de Inspeção digital**: checklist de lataria, motor, pneus e estofado
  via aplicativo móvel.
- **Cálculo de Custos de Preparação**: campo para registrar quanto a loja
  gastará com oficina ou estética antes de expor o carro (o que reduz o valor
  de compra).

### 2. Gestão de Estoque (Inventário)

- **Status do Veículo**: organização visual (Em Preparação, Disponível,
  Reservado, Vendido).
- **Custo Real de Estoque**: soma do valor pago no carro + custos de reparação
  + comissões, gerando o custo real exato.

### 3. CRM e Funil de Vendas

- **Atendimento de Leads**: integração com portais de anúncios (Webmotors, OLX)
  para centralizar os clientes interessados.
- **Histórico do Cliente**: registro de propostas, simulações de financiamento
  e carros que o cliente deixou na troca (troca com troco).

### 4. Faturamento e Documentação

- **Emissão de Notas Fiscais**: NF-e de Entrada (compra), NF-e de Saída (venda)
  e NF-e de Devolução.
- **Controle de Despachante**: status de transferência de propriedade,
  pagamento de IPVA atrasado e multas.

### 5. Módulo Financeiro e Relatórios

- **DRE por Veículo**: relatório que mostra exatamente o lucro líquido gerado
  por cada placa vendida.
- **Giro de Estoque**: indicador de quantos dias, em média, um carro fica
  parado na loja (fundamental para o fluxo de caixa).

## Portais e Estrutura

```
app/
  (marketing)/          # landing, login, planos (público)
  (platform)/admin/     # painel do Super Admin
  (tenant)/t/[slug]/    # painel operacional do tenant
  (supplier)/portal-fornecedor/[slug]/   # portal do fornecedor
  (customer)/portal-cliente/[slug]/      # portal do cliente
  api/                  # rotas e webhooks (auth, health, ...)
lib/
  auth/                 # sessão, escopo, permissões
  db/                   # cliente Prisma + helpers tenant-scoped
  tenant/               # resolução de tenant por slug
  integrations/         # adapters plugáveis (SignatureProvider, ...)
  jobs/                 # abstração de fila
  crypto/               # AES-256-GCM para IntegracaoConfig
```

## Roadmap

- **Fase 0 — Fundação** *(pronta)*: Next.js + Prisma + Auth + RBAC + tenant
  resolver + painel Super Admin mínimo + 4 portais navegáveis.
- **Fase 1 — Núcleo operacional (MVP)**: estoque, ofertas, compras, vendas,
  financeiro básico (módulos 1, 2 e parte do 5).
- **Fase 2 — Documentos e assinatura**: modelos, geração de PDF, DocuSign
  (base do módulo 4).
- **Fase 3 — Comunicação**: e-mail transacional + WhatsApp com fila (suporte
  ao CRM, módulo 3).
- **Fase 4 — Plataforma e billing**: planos, limites, métricas, faturamento.
- **Fase 5 — Integrações avançadas**: PIX, **consulta veicular por placa +
  FIPE**, integração com portais de anúncios, NF-e, domínio customizado por
  tenant.

## Princípios de Segurança

- **`tenantId` obrigatório** em toda entidade de negócio; `lib/db/scoped.ts`
  injeta o filtro automaticamente a partir da sessão.
- **RLS como segunda barreira** no PostgreSQL.
- **IDOR**: nunca confiar em ID vindo do cliente sem checar `tenantId`.
- **Segredos criptografados**: `IntegracaoConfig` usa AES-256-GCM
  (`lib/crypto/encrypt.ts`).
- **AuditLog** para trilha completa (LGPD).

## Convenções

- Server Actions para mutações; validação com Zod na borda.
- Valores monetários em inteiros (centavos) — nunca float.
- Entidades em português no domínio; código e tipos em inglês idiomático
  (`prisma.veiculo.findMany()`, `formatCentavos()`).
- Integrações intercambiáveis via interfaces (`SignatureProvider`,
  `EmailProvider`, `MessagingProvider`, e futuramente `PlateLookupProvider` /
  `FipeProvider` para consulta veicular).
