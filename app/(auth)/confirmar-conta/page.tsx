import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { confirmarContaComToken } from "@/lib/tenant/signup";

export const metadata = { title: "Confirmar conta — Volante7" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function ConfirmarContaPage({ searchParams }: Props) {
  const { token, email } = await searchParams;

  const result =
    token && email
      ? await confirmarContaComToken(email, token)
      : { ok: false as const, error: "Link de confirmação inválido." };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-text.svg" alt="Volante7" style={{ height: 26 }} />
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6 text-center">
          {result.ok ? (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Conta confirmada!</h1>
                <p className="text-sm text-muted-foreground">
                  Seu e-mail foi verificado com sucesso. Você já pode entrar e começar a
                  cadastrar seus veículos.
                </p>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link href="/login">Entrar na minha conta</Link>
              </Button>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertCircle className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Não foi possível confirmar</h1>
                <p className="text-sm text-muted-foreground">{result.error}</p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Ir para o login</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
