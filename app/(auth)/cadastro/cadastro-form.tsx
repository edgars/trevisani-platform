"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Building2, Car, CheckCircle2, Globe, Lock, Mail, MailCheck, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatCentavos } from "@/lib/utils";

import { criarContaAction, cadastroInitialState, reenviarConfirmacaoAction } from "./actions";

interface PlanoOpcao {
  slug: string;
  nome: string;
  precoMensalCentavos: number;
  limiteVeiculos: number;
}

const PASSOS = [
  { icon: Car, texto: "Cadastre seu primeiro veículo" },
  { icon: Globe, texto: "Escolha o endereço da sua loja" },
  { icon: CheckCircle2, texto: "Publique o site e comece a vender" },
];

export function CadastroForm({ planos }: { planos: PlanoOpcao[] }) {
  const params = useSearchParams();
  const planoFromUrl = params.get("plano");

  const planoDefault = useMemo(() => {
    if (planoFromUrl && planos.some((p) => p.slug === planoFromUrl)) return planoFromUrl;
    return planos.find((p) => p.slug === "gratis")?.slug ?? planos[0]?.slug ?? "";
  }, [planoFromUrl, planos]);

  const [planoSlug, setPlanoSlug] = useState(planoDefault);
  const [state, formAction, pending] = useActionState(criarContaAction, cadastroInitialState);
  const [reenviando, setReenviando] = useState(false);

  async function handleReenviar(email: string) {
    setReenviando(true);
    try {
      await reenviarConfirmacaoAction(email);
      toast.success("E-mail reenviado. Confira sua caixa de entrada.");
    } finally {
      setReenviando(false);
    }
  }

  if (state.status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MailCheck className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Confirme seu e-mail</h1>
            <p className="text-sm text-muted-foreground">
              Enviamos um link de confirmação para{" "}
              <strong className="text-foreground">{state.email}</strong>. Clique no link para
              ativar sua conta e começar a usar a plataforma.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            disabled={reenviando}
            onClick={() => handleReenviar(state.email)}
          >
            {reenviando ? "Reenviando…" : "Não recebeu? Reenviar e-mail"}
          </Button>
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ── Painel esquerdo — branding ─────────────────────────────── */}
      <div className="relative hidden lg:flex lg:flex-col bg-[#0a0e1a] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(225,29,72,0.18),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(15,23,42,0.9),transparent_60%)]" />

        <div className="relative flex flex-1 flex-col justify-between p-12">
          <Link href="/" className="inline-flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-text.svg"
              alt="Volante7"
              style={{ height: 30 }}
              className="[filter:brightness(0)_invert(1)]"
            />
          </Link>

          <div className="space-y-10">
            <div>
              <p className="mb-3 text-sm font-medium uppercase tracking-widest text-red-400">
                Comece agora, sem custo
              </p>
              <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
                Sua loja online em{" "}
                <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                  poucos minutos.
                </span>
              </h1>
              <p className="mt-4 text-lg text-slate-400">
                Crie sua conta, cadastre seu estoque e publique o site da sua revenda —
                sem cartão de crédito.
              </p>
            </div>

            <ul className="space-y-4">
              {PASSOS.map(({ icon: Icon, texto }, i) => (
                <li key={texto} className="flex items-center gap-3 text-slate-300">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600/20 text-red-400 text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm">{texto}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Volante7. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* ── Painel direito — formulário ────────────────────────────── */}
      <div className="flex flex-col bg-background">
        <div className="flex items-center justify-between border-b px-6 py-4 lg:hidden">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-text.svg" alt="Volante7" style={{ height: 26 }} />
          </Link>
        </div>

        <div className="hidden items-center justify-end px-10 pt-6 lg:flex">
          <span className="text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Criar sua conta</h2>
              <p className="text-sm text-muted-foreground">
                Leva menos de 2 minutos. Você confirma o e-mail e já pode cadastrar seu
                primeiro veículo.
              </p>
            </div>

            {planos.length > 0 && (
              <div className="space-y-2">
                <Label>Plano escolhido</Label>
                <div className="grid grid-cols-3 gap-2">
                  {planos.map((p) => (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => setPlanoSlug(p.slug)}
                      className={cn(
                        "rounded-lg border px-2 py-2.5 text-center transition-colors",
                        planoSlug === p.slug
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-input hover:border-primary/40",
                      )}
                    >
                      <div className="text-xs font-semibold">{p.nome}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {p.precoMensalCentavos === 0 ? "grátis" : formatCentavos(p.precoMensalCentavos) + "/mês"}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pode mudar de plano depois em Configurações →{" "}
                  <Link href="/planos" className="underline underline-offset-2">
                    ver detalhes dos planos
                  </Link>
                  .
                </p>
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="planoSlug" value={planoSlug} />

              {state.status === "error" && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {state.message}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="nomeLoja">Nome da loja</Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="nomeLoja" name="nomeLoja" placeholder="Ex: Revenda Boa Vista" required disabled={pending} className="pl-9" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomeResponsavel">Seu nome</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="nomeResponsavel" name="nomeResponsavel" placeholder="Seu nome completo" required disabled={pending} className="pl-9" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" name="email" type="email" placeholder="voce@suarevenda.com.br" required disabled={pending} className="pl-9" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="senha" name="senha" type="password" required disabled={pending} className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar</Label>
                  <Input id="confirmarSenha" name="confirmarSenha" type="password" required disabled={pending} />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={pending}>
                {pending ? "Criando conta…" : "Criar minha conta"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Ao continuar, você concorda com os termos de uso da plataforma.
              </p>
            </form>

            <p className="text-center text-sm text-muted-foreground lg:hidden">
              Já tem conta?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
