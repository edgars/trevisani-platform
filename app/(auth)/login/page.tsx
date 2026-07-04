import Link from "next/link";
import { CheckCircle2, LayoutDashboard, Search, Globe, TrendingUp } from "lucide-react";
import { Suspense } from "react";

import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar — Volante7" };

const DESTAQUES = [
  { icon: Search, text: "Cadastro de veículo com busca automática por placa" },
  { icon: LayoutDashboard, text: "Painel visual do estoque, sempre atualizado" },
  { icon: Globe, text: "Vitrine online inclusa para cada loja" },
  { icon: TrendingUp, text: "DRE por veículo e métricas de giro de estoque" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ── Painel esquerdo — branding ─────────────────────────────── */}
      <div className="relative hidden lg:flex lg:flex-col bg-[#0a0e1a] text-white">
        {/* Gradients decorativos */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(225,29,72,0.18),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(15,23,42,0.9),transparent_60%)]" />

        {/* Conteúdo */}
        <div className="relative flex flex-1 flex-col justify-between p-12">
          {/* Logo */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-text.svg"
                alt="Volante7"
                style={{ height: 30 }}
                className="[filter:brightness(0)_invert(1)]"
              />
            </Link>
          </div>

          {/* Headline + features */}
          <div className="space-y-10">
            <div>
              <p className="mb-3 text-sm font-medium uppercase tracking-widest text-red-400">
                Plataforma de gestão automotiva
              </p>
              <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
                Da placa ao contrato,{" "}
                <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                  tudo em um lugar.
                </span>
              </h1>
              <p className="mt-4 text-lg text-slate-400">
                Gerencie estoque, leads, documentação e sua vitrine online —
                sem planilhas, sem papelada.
              </p>
            </div>

            <ul className="space-y-4">
              {DESTAQUES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-slate-300">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600/20 text-red-400">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Rodapé */}
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Volante7. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* ── Painel direito — formulário ────────────────────────────── */}
      <div className="flex flex-col bg-background">
        {/* Barra superior mobile */}
        <div className="flex items-center justify-between border-b px-6 py-4 lg:hidden">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-text.svg" alt="Volante7" style={{ height: 26 }} />
          </Link>
        </div>

        {/* Navegação superior (desktop) */}
        <div className="hidden items-center justify-end px-10 pt-6 lg:flex">
          <span className="text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link
              href="/cadastro"
              className="font-medium text-primary hover:underline"
            >
              Criar conta grátis
            </Link>
          </span>
        </div>

        {/* Form centralizado */}
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm space-y-8">
            {/* Ícone + Título */}
            <div className="space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="12" y1="2" x2="12" y2="5" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="5" y2="12" />
                  <line x1="19" y1="12" x2="22" y2="12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h2>
              <p className="text-sm text-muted-foreground">
                Entre com seu e-mail e senha para acessar sua loja.
              </p>
            </div>

            <Suspense>
              <LoginForm erro={erro} />
            </Suspense>

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Segurança
                  </span>
                </div>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {[
                  "Dados isolados por loja (multi-tenant)",
                  "Sessão criptografada com JWT RS256",
                  "Acesso revogado automaticamente após 30 dias",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Link "Ver planos" — mobile */}
            <p className="text-center text-sm text-muted-foreground lg:hidden">
              Ainda não tem conta?{" "}
              <Link href="/cadastro" className="font-medium text-primary hover:underline">
                Criar conta grátis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
