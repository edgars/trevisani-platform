import Link from "next/link";
import {
  ArrowRight,
  Car,
  CheckCircle2,
  Gavel,
  Globe,
  Handshake,
  LayoutDashboard,
  Receipt,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTenantPublicUrl } from "@/lib/tenant/public-url";

const DEMO_URL = getTenantPublicUrl("demo");

// ─── Layout util ─────────────────────────────────────────────────────────────

function Wrap({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-6 md:px-12 lg:px-20 ${className}`}>
      {children}
    </div>
  );
}

// ─── Dados ───────────────────────────────────────────────────────────────────

const FUNCIONALIDADES = [
  {
    icon: Search,
    badge: "Rapidez",
    title: "Cadastre um carro em segundos, só com a placa",
    body: "Digite a placa e pronto: marca, modelo, ano, cor e a documentação aparecem na hora, sem você precisar digitar nada. Mais tempo pra vender, menos tempo digitando.",
    destaque: true,
  },
  {
    icon: LayoutDashboard,
    badge: "Organização",
    title: "Veja todo o seu estoque em um único lugar",
    body: "Saiba de cara quais carros estão prontos pra vender, quais estão reservados e quais já foram vendidos. Nada se perde e nada passa despercebido.",
    destaque: false,
  },
  {
    icon: Car,
    badge: "Lucro garantido",
    title: "Saiba exatamente quanto vai lucrar em cada carro",
    body: "Anote quanto pagou e quanto gastou preparando o carro. O sistema calcula o custo real pra você nunca mais vender no prejuízo sem saber.",
    destaque: false,
  },
  {
    icon: Handshake,
    badge: "Parceiros",
    title: "Receba carros de parceiros sem perder o controle",
    body: "Cadastre fornecedores e carros em consignação e saiba sempre o que é seu e o que é do parceiro. Na hora de acertar as contas, tudo certo e todo mundo satisfeito.",
    destaque: false,
  },
  {
    icon: Users,
    badge: "Mais vendas",
    title: "Não deixe nenhum cliente interessado escapar",
    body: "Organize todas as propostas e conversas em um só lugar. Responda rápido, feche mais negócios e conquiste clientes satisfeitos que voltam a comprar.",
    destaque: false,
  },
  {
    icon: Gavel,
    badge: "Leilão ao vivo",
    title: "Deixe seus clientes disputarem o carro e venda pelo melhor preço",
    body: "Crie um leilão ao vivo pra um carro específico e veja os lances chegarem em tempo real. Quem paga mais leva — e você vende sempre pelo maior valor.",
    destaque: false,
  },
  {
    icon: Globe,
    badge: "Vitrine 24 horas",
    title: "Sua loja aberta na internet, o dia inteiro",
    body: "Seu site fica pronto automaticamente, com fotos, preços e botão de WhatsApp em cada carro. Seus clientes encontram e falam com você sem sair de casa.",
    destaque: false,
  },
  {
    icon: Wallet,
    badge: "Dinheiro no bolso",
    title: "Veja o quanto está ganhando de verdade",
    body: "Descubra o lucro de cada carro vendido sem fazer conta na mão. Sem surpresa no fim do mês — você sabe se está ganhando dinheiro ou não.",
    destaque: false,
  },
  {
    icon: Receipt,
    badge: "Menos dor de cabeça",
    title: "Documentação sempre em dia, sem susto",
    body: "Saiba na hora se o carro tem IPVA atrasado, multa ou outra pendência antes de fechar negócio. Menos risco pra você, mais confiança pro seu cliente.",
    destaque: false,
  },
  {
    icon: TrendingUp,
    badge: "Decisões certas",
    title: "Descubra o que está funcionando na sua loja",
    body: "Veja quais carros vendem mais rápido, quem são seus melhores vendedores e quanto sua loja faturou. Tudo em números fáceis de entender, sem planilha.",
    destaque: false,
  },
  {
    icon: UserCog,
    badge: "Sua equipe",
    title: "Coloque toda a equipe pra trabalhar junto, sem bagunça",
    body: "Defina o que cada vendedor, financeiro ou gerente pode ver e fazer. Todo mundo com acesso só ao que precisa, trabalhando organizado no mesmo sistema.",
    destaque: false,
  },
];

const PASSOS = [
  {
    n: "01",
    title: "Cadastre o carro",
    body: "Digite só a placa. Os dados aparecem sozinhos na tela — sem trabalho, sem erro de digitação.",
  },
  {
    n: "02",
    title: "Anote o que gastou",
    body: "Diga quanto pagou pelo carro e quanto gastou preparando. Você já sabe o lucro antes mesmo de vender.",
  },
  {
    n: "03",
    title: "Coloque na vitrine",
    body: "Com um clique o carro já aparece no site da sua loja, prontinho pra atrair novos clientes.",
  },
  {
    n: "04",
    title: "Venda e embolse o lucro",
    body: "Feche o negócio e veja na hora quanto aquele carro deu de lucro. Sem planilha, sem calculadora, sem confusão.",
  },
];

const STATS = [
  { k: "Cadastro em segundos", v: "Só com a placa do carro" },
  { k: "Site pronto pra vender", v: "Sua loja na internet, sem esforço" },
  { k: "Tudo no seu controle", v: "Cada loja com seus próprios dados" },
  { k: "De qualquer lugar", v: "Funciona no computador e no celular" },
];

// ─── Página ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a0e1a]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(225,29,72,0.15),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(15,23,42,0.8),transparent_60%)]" />

        <Wrap className="relative py-24 md:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="secondary"
              className="mb-6 border-red-900/40 bg-red-950/50 text-red-400"
            >
              Feito para revendas de carros que querem vender mais
            </Badge>

            <h1 className="text-balance text-4xl font-bold tracking-tight text-white md:text-6xl">
              Venda mais carros,{" "}
              <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                ganhe mais dinheiro.
              </span>
            </h1>

            <p className="mt-6 text-balance text-lg text-slate-400 md:text-xl">
              O Volante7 organiza sua loja, cadastra seus carros em segundos e cria o
              site da sua revenda — pra você fechar mais negócios, vender mais e
              deixar seus clientes satisfeitos. Sem complicação, sem TI.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white" asChild>
                <Link href="/cadastro">
                  Começar grátis <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href={DEMO_URL} target="_blank" rel="noopener noreferrer">
                  Ver loja de exemplo
                </Link>
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
        </Wrap>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <section className="border-y bg-muted/40">
        <Wrap className="grid grid-cols-2 gap-8 py-10 text-center md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.k}>
              <div className="text-xl font-semibold">{s.k}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </Wrap>
      </section>

      {/* ── Funcionalidades ─────────────────────────────────────────── */}
      <section id="funcionalidades">
        <Wrap className="py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">Funcionalidades</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Tudo que você precisa pra vender mais e ganhar mais dinheiro
            </h2>
            <p className="mt-3 text-muted-foreground">
              Esqueça planilhas, cadernos e papelada espalhada. Aqui você organiza sua
              loja, atende seus clientes rápido e fecha mais negócios — tudo em um
              lugar só, fácil de usar.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Card destaque (busca de placa) — ocupa 2 colunas */}
            <Card className="md:col-span-2 lg:col-span-2 border-red-200 bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-background dark:border-red-900/40">
              <CardHeader>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white">
                  <Search className="h-5 w-5" />
                </div>
                <Badge variant="secondary" className="w-fit text-xs">Rapidez</Badge>
                <CardTitle className="text-xl mt-2">Cadastre um carro em segundos, só com a placa</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Digite a placa e pronto: marca, modelo, ano, cor e toda a
                  documentação aparecem na tela sozinhos, sem você precisar digitar
                  nada. O preço de venda já vem sugerido, pra você não perder tempo
                  pesquisando.
                </p>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {[
                    "Carro cadastrado em menos de 2 segundos",
                    "Preço de venda sugerido automaticamente",
                    "Você vê na hora se o carro tem multa, roubo ou sinistro",
                    "Menos trabalho manual, menos chance de erro",
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
        </Wrap>
      </section>

      {/* ── Como funciona ───────────────────────────────────────────── */}
      <section id="como-funciona" className="border-t bg-muted/30">
        <Wrap className="py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">Como funciona</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Do carro no pátio ao dinheiro no bolso, em 4 passos simples
            </h2>
            <p className="mt-3 text-muted-foreground">
              Sem curso, sem manual chato de ler. Se você sabe usar WhatsApp, sabe
              usar o Volante7.
            </p>
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
        </Wrap>
      </section>

      {/* ── Vitrine online ──────────────────────────────────────────── */}
      <section>
        <Wrap className="py-24">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <Badge variant="secondary" className="mb-4">Vitrine online</Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Sua loja na internet, pronta pra vender por você
              </h2>
              <p className="mt-4 text-muted-foreground">
                Toda loja cadastrada na plataforma já ganha um site próprio em{" "}
                <strong>sualooja.volante7.com.br</strong>, sem precisar contratar
                ninguém. Escolha as cores e a logo da sua marca e publique com um
                clique.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {[
                  "3 temas visuais prontos, bonitos e fáceis de usar",
                  "Seus carros aparecem no site na hora que você cadastra",
                  "Formulário de contato pra você não perder nenhum cliente",
                  "Botão de WhatsApp em cada carro, direto pra você",
                  "Seu site aparece melhor no Google",
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
        </Wrap>
      </section>

      {/* ── Segurança ───────────────────────────────────────────────── */}
      <section className="border-t bg-muted/30">
        <Wrap className="grid gap-10 py-20 md:grid-cols-2 md:items-center">
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

          {/* Suporte e confiabilidade */}
          <Card>
            <CardHeader>
              <Badge variant="secondary" className="w-fit">Suporte dedicado</Badge>
              <CardTitle className="mt-2">Você nunca fica sozinho</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {[
                { icon: CheckCircle2, t: "Onboarding guiado", d: "Configuramos com você o primeiro veículo e o site da sua loja." },
                { icon: ShieldCheck, t: "Backups automáticos", d: "Seus dados são replicados continuamente, sem esforço manual." },
                { icon: TrendingUp, t: "Evolução constante", d: "Novas funcionalidades chegam sem custo adicional para o seu plano." },
                { icon: Users, t: "Atendimento humano", d: "Fale diretamente com nossa equipe por e-mail ou WhatsApp." },
              ].map((f) => (
                <div key={f.t} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{f.t}</div>
                    <div className="text-muted-foreground">{f.d}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </Wrap>
      </section>

      {/* ── CTA final ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a0e1a]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(225,29,72,0.12),transparent_60%)]" />
        <Wrap className="relative py-28 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-text.svg"
            alt="Volante7"
            style={{ height: 40 }}
            className="mx-auto mb-8 [filter:brightness(0)_invert(1)]"
          />
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            Pronto para vender mais e ganhar mais dinheiro?
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Crie sua conta agora, cadastre seu primeiro carro e comece a fechar mais
            negócios hoje mesmo. É grátis pra começar.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white" asChild>
              <Link href="/cadastro">
                Começar grátis <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href={DEMO_URL} target="_blank" rel="noopener noreferrer">
                Ver loja de exemplo →
              </Link>
            </Button>
          </div>
        </Wrap>
      </section>
    </div>
  );
}
