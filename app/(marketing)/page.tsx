import Link from "next/link";
import {
  ArrowRight,
  Car,
  CheckCircle2,
  Globe,
  LayoutDashboard,
  Receipt,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Dados ───────────────────────────────────────────────────────────────────

const FUNCIONALIDADES = [
  {
    icon: Search,
    badge: "Automação",
    title: "Busca de placa inteligente",
    body: "Digite a placa e o sistema preenche automaticamente marca, modelo, ano, cor, chassi e situação documental via DETRAN. A tabela FIPE já vem como sugestão de preço.",
    destaque: true,
  },
  {
    icon: LayoutDashboard,
    badge: "Estoque",
    title: "Kanban visual de estoque",
    body: "Visualize todos os veículos em colunas por status: Em Preparação, Disponível, Reservado, Negociando e Vendido. Controle o ciclo de vida de cada placa.",
    destaque: false,
  },
  {
    icon: Car,
    badge: "Compras",
    title: "Captação e avaliação",
    body: "Registre o custo de aquisição, despesas de preparação (mecânica, estética, funilaria) e calcule automaticamente o custo real do veículo antes de precificá-lo.",
    destaque: false,
  },
  {
    icon: Users,
    badge: "CRM",
    title: "Funil de vendas e leads",
    body: "Gerencie propostas, simulações de financiamento e trocas com troco. Centralize leads de portais como Webmotors e OLX em um único lugar.",
    destaque: false,
  },
  {
    icon: Globe,
    badge: "Vitrine online",
    title: "Site da loja incluso",
    body: "Cada loja tem sua vitrine pública em slug.volante7.com.br com estoque, fotos, WhatsApp e formulário de contato. Personalize tema, cores, fontes e logo.",
    destaque: false,
  },
  {
    icon: Wallet,
    badge: "Financeiro",
    title: "DRE por veículo",
    body: "Veja exatamente quanto cada placa gerou de lucro líquido: preço de venda menos custo de compra, preparação, comissões e impostos. Giro de estoque em dias.",
    destaque: false,
  },
  {
    icon: Receipt,
    badge: "Documentação",
    title: "Controle documental",
    body: "Acompanhe transferência de propriedade, IPVA em atraso, multas e status do despachante. Emissão de NF-e de Entrada e Saída integradas.",
    destaque: false,
  },
  {
    icon: TrendingUp,
    badge: "Relatórios",
    title: "Métricas da operação",
    body: "Painel com faturamento por período, ticket médio, veículos mais rentáveis, tempo médio em estoque e performance por vendedor.",
    destaque: false,
  },
];

const PASSOS = [
  {
    n: "01",
    title: "Cadastre a placa",
    body: "Digite a placa do veículo. O sistema busca instantaneamente todos os dados do DETRAN e sugere o preço FIPE.",
  },
  {
    n: "02",
    title: "Registre os custos",
    body: "Informe o valor pago, gastos com preparação e origem (compra, consignação ou troca). O custo real é calculado automaticamente.",
  },
  {
    n: "03",
    title: "Publique na vitrine",
    body: "Com um clique o veículo aparece no site da sua loja com fotos, ficha técnica e botão de WhatsApp.",
  },
  {
    n: "04",
    title: "Venda e feche",
    body: "Registre a proposta, financiamento ou troca. O DRE por placa mostra o lucro assim que a venda é concluída.",
  },
];

const STATS = [
  { k: "Consulta de placa", v: "Dados DETRAN + FIPE automáticos" },
  { k: "Vitrine inclusa", v: "Site para cada loja na nuvem" },
  { k: "Multi-loja", v: "Dados isolados por revenda" },
  { k: "100% nuvem", v: "Sem instalação, acesse do celular" },
];

// ─── Página ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a0e1a]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(225,29,72,0.15),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(15,23,42,0.8),transparent_60%)]" />

        <div className="container relative py-24 md:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="secondary"
              className="mb-6 border-red-900/40 bg-red-950/50 text-red-400"
            >
              Plataforma para revendas e concessionárias
            </Badge>

            <h1 className="text-balance text-4xl font-bold tracking-tight text-white md:text-6xl">
              Da placa ao contrato,{" "}
              <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                tudo em um lugar.
              </span>
            </h1>

            <p className="mt-6 text-balance text-lg text-slate-400 md:text-xl">
              Volante7 é o sistema de gestão para revendas que automatiza o cadastro de
              veículos pela placa, controla estoque em Kanban, gerencia leads e ainda
              cria o site da sua loja — sem precisar de TI.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white" asChild>
                <Link href="/planos">
                  Começar grátis <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/t/demo">Ver demonstração</Link>
              </Button>
            </div>

            {/* Mini-preview do dashboard */}
            <div className="mt-16 overflow-hidden rounded-xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-black/40">
              <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
                <span className="h-3 w-3 rounded-full bg-red-500/70" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <span className="h-3 w-3 rounded-full bg-green-500/70" />
                <span className="ml-3 text-xs text-slate-500">app.volante7.com.br/t/sualooja/veiculos</span>
              </div>
              {/* Kanban mockup */}
              <div className="grid grid-cols-4 gap-0 divide-x divide-white/5 p-4">
                {[
                  { label: "Em Preparação", color: "bg-yellow-500", n: 4 },
                  { label: "Disponível", color: "bg-green-500", n: 11 },
                  { label: "Reservado", color: "bg-blue-500", n: 2 },
                  { label: "Vendido", color: "bg-slate-500", n: 28 },
                ].map((col) => (
                  <div key={col.label} className="px-3">
                    <div className="mb-3 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${col.color}`} />
                      <span className="text-[10px] font-medium text-slate-400">{col.label}</span>
                      <span className="ml-auto text-[10px] text-slate-600">{col.n}</span>
                    </div>
                    {Array.from({ length: Math.min(col.n, 3) }).map((_, i) => (
                      <div
                        key={i}
                        className="mb-2 h-14 rounded-md bg-slate-800 border border-white/5 p-2"
                      >
                        <div className="h-2 w-3/4 rounded bg-slate-700 mb-1.5" />
                        <div className="h-1.5 w-1/2 rounded bg-slate-700/60" />
                        <div className="mt-2 flex items-center justify-between">
                          <div className="h-1.5 w-1/3 rounded bg-red-900/60" />
                          <div className="h-1.5 w-1/4 rounded bg-slate-700/40" />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <section className="border-y bg-muted/40">
        <div className="container grid grid-cols-2 gap-8 py-10 text-center md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.k}>
              <div className="text-xl font-semibold">{s.k}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Funcionalidades ─────────────────────────────────────────── */}
      <section id="funcionalidades" className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">Funcionalidades</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Um sistema completo para o ciclo do veículo
          </h2>
          <p className="mt-3 text-muted-foreground">
            Do cadastro pela placa até o DRE por veículo vendido — sem planilhas,
            sem papelada, sem perder negócio.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Card destaque (busca de placa) — ocupa 2 colunas */}
          <Card className="lg:col-span-2 border-red-200 bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-background dark:border-red-900/40">
            <CardHeader>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white">
                <Search className="h-5 w-5" />
              </div>
              <Badge variant="secondary" className="w-fit text-xs">Automação</Badge>
              <CardTitle className="text-xl mt-2">Busca de placa inteligente</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                Digite a placa e o sistema preenche automaticamente marca, modelo, ano,
                cor, chassi e situação documental via DETRAN. A tabela FIPE já vem
                como sugestão de preço de venda. Cache de 2 meses — consultas
                subsequentes são instantâneas.
              </p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {[
                  "Dados do DETRAN em menos de 2 segundos",
                  "Valor FIPE sugerido automaticamente",
                  "Restrições de roubo, leilão e sinistro",
                  "Cache compartilhado entre lojas da plataforma",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-red-600 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Demais cards */}
          {FUNCIONALIDADES.slice(1).map(({ icon: Icon, badge, title, body }) => (
            <Card key={title} className="hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant="secondary" className="w-fit text-xs">{badge}</Badge>
                <CardTitle className="mt-2 text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Como funciona ───────────────────────────────────────────── */}
      <section id="como-funciona" className="border-t bg-muted/30">
        <div className="container py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">Como funciona</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Do cadastro à venda em 4 passos
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PASSOS.map((p) => (
              <div key={p.n} className="relative">
                <div className="text-5xl font-black text-primary/10 leading-none mb-4">{p.n}</div>
                <h3 className="font-semibold text-lg mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vitrine online ──────────────────────────────────────────── */}
      <section className="container py-24">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <Badge variant="secondary" className="mb-4">Vitrine online</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Seu site de loja incluso no plano
            </h2>
            <p className="mt-4 text-muted-foreground">
              Cada loja cadastrada na plataforma ganha automaticamente um site
              público em <strong>sualooja.volante7.com.br</strong>. Personalize
              tema, cores, fontes e logo. Publique ou despublique com um clique.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {[
                "3 temas visuais prontos: Clássico, Moderno e Minimal",
                "Estoque sincronizado em tempo real",
                "Formulário de contato com captação de leads",
                "Botão de WhatsApp em cada veículo",
                "SEO configurável por loja",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Preview da vitrine */}
          <div className="rounded-2xl border bg-muted/30 overflow-hidden shadow-lg">
            <div className="border-b bg-background px-4 py-2.5 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
              <span className="text-xs text-muted-foreground mx-auto">minharevenda.volante7.com.br</span>
            </div>
            <div className="bg-slate-900 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 w-24 rounded bg-white/20" />
                <div className="flex gap-2">
                  <div className="h-3 w-12 rounded bg-white/10" />
                  <div className="h-3 w-12 rounded bg-white/10" />
                  <div className="h-6 w-16 rounded bg-red-600/80" />
                </div>
              </div>
              <div className="rounded-lg bg-slate-800 p-6 mb-4 text-center">
                <div className="h-5 w-48 rounded bg-white/20 mx-auto mb-2" />
                <div className="h-3 w-32 rounded bg-white/10 mx-auto mb-4" />
                <div className="h-8 w-28 rounded-full bg-red-600/70 mx-auto" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg bg-slate-800 overflow-hidden">
                    <div className="h-16 bg-slate-700" />
                    <div className="p-2">
                      <div className="h-2 w-3/4 rounded bg-white/20 mb-1" />
                      <div className="h-2 w-1/2 rounded bg-red-600/50" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Segurança ───────────────────────────────────────────────── */}
      <section className="border-t bg-muted/30">
        <div className="container grid gap-10 py-20 md:grid-cols-2 md:items-center">
          <div>
            <Badge variant="secondary" className="mb-4">Segurança</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Dados de cada loja 100% isolados
            </h2>
            <p className="mt-4 text-muted-foreground">
              Arquitetura multi-tenant com duas camadas de proteção: filtro
              automático por <code className="rounded bg-muted px-1">tenantId</code>{" "}
              em toda consulta e Row Level Security no banco de dados.
              Nenhuma loja acessa dados de outra.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "RBAC granular: Admin, Vendedor, Financeiro",
                "Segredos de integração criptografados (AES-256)",
                "Trilha de auditoria completa para LGPD",
                "Deploy serverless na Vercel — zero manutenção de servidor",
              ].map((l) => (
                <li key={l} className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Roadmap */}
          <Card>
            <CardHeader>
              <Badge variant="secondary" className="w-fit">Roadmap</Badge>
              <CardTitle className="mt-2">Evolução da plataforma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {[
                { n: "✓", t: "Fundação", d: "Estoque, Kanban, compras, fornecedores, vitrine online", done: true },
                { n: "✓", t: "Consulta veicular", d: "Busca por placa com dados DETRAN + FIPE automáticos", done: true },
                { n: "2", t: "Documentos e contratos", d: "Geração de PDF, contratos e assinatura eletrônica (DocuSign)" },
                { n: "3", t: "Comunicação integrada", d: "E-mail transacional + WhatsApp com fila e retry" },
                { n: "4", t: "Financeiro avançado", d: "DRE, fluxo de caixa, contas a pagar/receber, NF-e" },
                { n: "5", t: "CRM e portais de anúncio", d: "Leads do Webmotors e OLX, simulação de financiamento" },
              ].map((f) => (
                <div key={f.t} className="flex items-start gap-3">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    f.done
                      ? "bg-green-600 text-white"
                      : "bg-primary text-primary-foreground"
                  }`}>
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

      {/* ── CTA final ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a0e1a]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(225,29,72,0.12),transparent_60%)]" />
        <div className="container relative py-28 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-text.svg"
            alt="Volante7"
            style={{ height: 40 }}
            className="mx-auto mb-8 [filter:brightness(0)_invert(1)]"
          />
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            Pronto para digitalizar sua revenda?
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Crie sua conta, cadastre seus veículos e publique a vitrine da sua loja
            hoje mesmo.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white" asChild>
              <Link href="/planos">
                Começar grátis <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/t/demo">Ver demo →</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
