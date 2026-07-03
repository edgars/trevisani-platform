"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { AlertCircle, CheckCircle2, KeyRound, Mail } from "lucide-react";

import { AuthFormShell } from "@/app/(auth)/_components/auth-form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { solicitarLoginOtp, type OtpLoginState } from "./actions";

const initialState: OtpLoginState = { status: "idle" };

export function OtpLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? undefined;

  const emailFromUrl = params.get("email") ?? "";
  const [step, setStep] = useState<"email" | "codigo">(emailFromUrl ? "codigo" : "email");
  const [email, setEmail] = useState(emailFromUrl);
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [otpState, otpAction, otpPending] = useActionState(solicitarLoginOtp, initialState);

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("otp", {
      redirect: false,
      email,
      codigo,
    });

    if (res?.error) {
      setLoading(false);
      setError("Código inválido ou expirado. Verifique e tente novamente.");
      return;
    }

    const session = await getSession();
    const dest =
      callbackUrl ??
      (session?.user?.tenantSlug ? `/t/${session.user.tenantSlug}` : "/admin");

    router.push(dest);
    router.refresh();
  }

  if (step === "email") {
    return (
      <AuthFormShell
        title="Entrar com código"
        description="Enviaremos um código de 6 dígitos para o seu e-mail."
      >
        {otpState.status === "success" ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{otpState.message}</span>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setEmail(otpState.email);
                setStep("codigo");
              }}
            >
              Inserir código
            </Button>
          </div>
        ) : (
          <form action={otpAction} className="space-y-5">
            {otpState.status === "error" && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {otpState.message}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="voce@suarevenda.com.br"
                  required
                  autoComplete="email"
                  disabled={otpPending}
                  className="pl-9"
                  defaultValue={email}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={otpPending}>
              Enviar código
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Prefere usar senha?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Entrar com senha
          </Link>
        </p>
      </AuthFormShell>
    );
  }

  return (
    <AuthFormShell
      title="Digite o código"
      description={`Enviamos um código de 6 dígitos para ${email}.`}
    >
      <form onSubmit={onVerify} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="codigo">Código</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              required
              disabled={loading}
              className="pl-9 tracking-[0.3em]"
              autoFocus
            />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading || codigo.length !== 6}>
          Entrar
        </Button>
      </form>

      <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => setStep("email")}
        >
          Usar outro e-mail
        </button>
        <Link href="/login" className="hover:underline">
          Voltar ao login com senha
        </Link>
      </div>
    </AuthFormShell>
  );
}
