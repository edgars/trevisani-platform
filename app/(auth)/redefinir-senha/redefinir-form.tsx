"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { AlertCircle, CheckCircle2, KeyRound, Lock } from "lucide-react";

import { AuthFormShell } from "@/app/(auth)/_components/auth-form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  redefinirComOtp,
  redefinirComToken,
  type RedefinirSenhaState,
} from "./actions";

const initialState: RedefinirSenhaState = { status: "idle" };

export function RedefinirSenhaForm() {
  const router = useRouter();
  const params = useSearchParams();

  const modo =
    params.get("modo") === "otp" || !params.get("token")
      ? "otp"
      : "link";
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";

  const [tokenState, tokenAction, tokenPending] = useActionState(redefinirComToken, initialState);
  const [otpState, otpAction, otpPending] = useActionState(redefinirComOtp, initialState);

  const state = modo === "link" ? tokenState : otpState;
  const pending = modo === "link" ? tokenPending : otpPending;
  const action = modo === "link" ? tokenAction : otpAction;

  if (modo === "link" && (!token || !email)) {
    return (
      <AuthFormShell
        title="Link inválido"
        description="Este link de redefinição é inválido ou expirou."
      >
        <Button asChild className="w-full">
          <Link href="/esqueci-senha">Solicitar novo link</Link>
        </Button>
      </AuthFormShell>
    );
  }

  if (modo === "otp" && !email) {
    return (
      <AuthFormShell
        title="E-mail necessário"
        description="Informe seu e-mail para redefinir a senha com código OTP."
      >
        <Button asChild className="w-full">
          <Link href="/esqueci-senha?modo=otp">Solicitar código</Link>
        </Button>
      </AuthFormShell>
    );
  }

  if (state.status === "success") {
    return (
      <AuthFormShell
        title="Senha redefinida"
        description="Sua senha foi atualizada com sucesso."
      >
        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Você já pode entrar com a nova senha.</span>
        </div>
        <Button className="w-full" onClick={() => router.push("/login")}>
          Ir para o login
        </Button>
      </AuthFormShell>
    );
  }

  return (
    <AuthFormShell
      title="Redefinir senha"
      description={
        modo === "link"
          ? "Escolha uma nova senha para sua conta."
          : "Informe o código recebido por e-mail e escolha uma nova senha."
      }
    >
      <form action={action} className="space-y-5">
        {state.status === "error" && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {state.message}
          </div>
        )}

        <input type="hidden" name="email" value={email} />
        {modo === "link" && <input type="hidden" name="token" value={token} />}

        {modo === "otp" && (
          <div className="space-y-2">
            <Label htmlFor="codigo">Código de 6 dígitos</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="codigo"
                name="codigo"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                required
                disabled={pending}
                className="pl-9 tracking-[0.3em]"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="novaSenha">Nova senha</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="novaSenha"
              name="novaSenha"
              type="password"
              minLength={6}
              required
              autoComplete="new-password"
              disabled={pending}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmarSenha">Confirmar senha</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmarSenha"
              name="confirmarSenha"
              type="password"
              minLength={6}
              required
              autoComplete="new-password"
              disabled={pending}
              className="pl-9"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          Salvar nova senha
        </Button>
      </form>

      {modo === "otp" && (
        <p className="text-center text-sm text-muted-foreground">
          Não recebeu?{" "}
          <Link
            href={`/esqueci-senha?modo=otp&email=${encodeURIComponent(email)}`}
            className="font-medium text-primary hover:underline"
          >
            Reenviar código
          </Link>
        </p>
      )}
    </AuthFormShell>
  );
}
