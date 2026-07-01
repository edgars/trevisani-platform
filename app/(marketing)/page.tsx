import Link from "next/link";
import {
  ArrowRight,
  Car,
  FileSignature,
  MessageCircle,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RECURSOS = [
  {
    icon: Truck,
    title: "Ofertas e portal do fornecedor",
    body: "Fornecedores submetem ofertas unitárias ou pacotes. Você aprova, negocia e converte em compra em minutos.",
  },
  {
    icon: Car,
    title: "Estoque com precificação",
    body: "CRUD completo de veículos, galeria de fotos, custo x margem sugerida x preço de venda, histórico e status.",
  },
  {
    icon: Users,
    title: "Vendas e proposta",
    body: "Reserve veículos, gere propostas, registre entrada, financiamento externo e trocas — tudo com contrato.",
  },
  {
    icon: Wallet,
    title: "Financeiro simplificado",
    body: "Contas a pagar/receber, parcelas, categorias, fluxo de caixa e DRE por período. Conciliação manual.",
  },
  {
    icon: FileSignature,
    title: "Documentos + DocuSign",
    body: "Modelos versionados, geração de PDF e envio de envelope de assinatura com webhook idempotente.",
  },
  {
    icon: MessageCircle,
    title: "E-mail e WhatsApp",
    body: "Comunicação transacional em fila com retry. Adapters plugáveis: Resend, Evolution API, WhatsApp Cloud.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.1),transparent_45%)]" />
        <div className="container py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6">
              Fase 0 · Fundação pronta
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
              Da oferta do fornecedor à assinatura do contrato,{" "}
              <span className="bg-gradient-to-r from-primary to-primary/40 bg-clip-text text-transparent">
                em uma única plataforma.
              </span>
            </h1>
            <p className="mt-6 text-balance text-lg text-muted-foreground md:text-xl">
              AutoGestão é o SaaS multi-tenant para revendas gerenciarem compra e venda de
              veículos com isolamento de dados por loja, RBAC granular e integrações
              plugáveis para assinatura, e-mail e WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/planos">
                  Ver planos <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/t/demo">Ver demo do tenant</Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/admin">Painel da plataforma</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Estatísticas / provas de conceito */}
      <section className="border-y bg-muted/40">
        <div className="container grid grid-cols-2 gap-8 py-10 text-center md:grid-cols-4">
          {[
            { k: "4 portais", v: "Plataforma · Tenant · Fornecedor · Cliente" },
            { k: "RLS + RBAC", v: "Duas camadas de isolamento" },
            { k: "Postgres/Neon", v: "Serverless-friendly" },
            { k: "Adapters", v: "Assinatura, e-mail e WhatsApp" },
          ].map((s) => (
            <div key={s.k}>
              <div className="text-2xl font-semibold">{s.k}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Um sistema. O ciclo inteiro do veículo.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Todos os módulos do PRD prontos para evoluir por fases, com auditoria e
            trilha LGPD já modeladas.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {RECURSOS.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {body}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Segurança */}
      <section id="integracoes" className="border-t bg-muted/30">
        <div className="container grid gap-10 py-20 md:grid-cols-2 md:items-center">
          <div>
            <Badge className="mb-4">Segurança em duas camadas</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Isolamento por tenant, com RLS no banco
            </h2>
            <p className="mt-4 text-muted-foreground">
              Toda entidade de negócio carrega <code className="rounded bg-muted px-1">tenantId</code>.
              A camada de acesso injeta o tenant do contexto de sessão automaticamente,
              e a Row Level Security do PostgreSQL age como segunda barreira contra
              vazamentos entre lojas. Super Admin usa impersonação auditada.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "RBAC granular com permissões editáveis por Admin do tenant",
                "IDOR protegido: nunca confiamos em ID vindo do cliente",
                "Segredos criptografados em IntegracaoConfig (AES-256)",
                "AuditLog completo para operações críticas",
              ].map((l) => (
                <li key={l} className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          </div>
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                Roadmap por fases
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {[
                { n: "0", t: "Fundação", d: "Next.js + Prisma + Neon, RBAC, tenant resolver" },
                { n: "1", t: "Núcleo operacional (MVP)", d: "Estoque, ofertas, compras, vendas, financeiro básico" },
                { n: "2", t: "Documentos e assinatura", d: "Modelos, PDF, adapter DocuSign + webhook" },
                { n: "3", t: "Comunicação", d: "E-mail transacional + WhatsApp com fila" },
                { n: "4", t: "Plataforma e billing", d: "Planos, limites, métricas globais, faturamento" },
                { n: "5", t: "Integrações avançadas", d: "PIX, consulta veicular, domínio customizado" },
              ].map((f) => (
                <div key={f.n} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {f.n}
                  </div>
                  <div>
                    <div className="font-medium">{f.t}</div>
                    <div className="text-muted-foreground">{f.d}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA final */}
      <section className="container py-24 text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Pronto para operar sua revenda no digital?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Um seed com tenant demo já vem pronto. Rode <code>npm run db:seed</code> e explore.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/t/demo">Abrir tenant demo</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
