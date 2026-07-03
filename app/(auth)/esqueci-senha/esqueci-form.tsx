"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";

import { AuthFormShell } from "@/app/(auth)/_components/auth-form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  solicitarResetLink,
  solicitarResetOtp,
  type EsqueciSenhaState,
} from "./actions";

type Modo = "link" | "otp";

const initialState: EsqueciSenhaState = { status: "idle" };

export function EsqueciSenhaForm() {
  const router = useRouter();
  const params = useSearchParams();
  const modoInicial = params.get("modo") === "otp" ? "otp" : "link";
  const [modo, setModo] = useState<Modo>(modoInicial);
  const [emailEnviado, setEmailEnviado] = useState("");

  const [linkState, linkAction, linkPending] = useActionState(solicitarResetLink, initialState);
  const [otpState, otpAction, otpPending] = useActionState(solicitarResetOtp, initialState);

  const state = modo === "link" ? linkState : otpState;
  const pending = modo === "link" ? linkPending : otpPending;

  async function onSubmitLink(formData: FormData) {
    setEmailEnviado(String(formData.get("email") ?? ""));
    return linkAction(formData);
  }

  async function onSubmitOtp(formData: FormData) {
    setEmailEnviado(String(formData.get("email") ?? ""));
    return otpAction(formData);
  }

  return (
    <AuthFormShell
      title="Esqueci minha senha"
      description={
        modo === "link"
          ? "Enviaremos um link seguro para redefinir sua senha."
          : "Enviaremos um código de 6 dígitos para redefinir sua senha."
      }
    >
      <div className="flex rounded-lg border p-1">
        <button
          type="button"
          onClick={() => setModo("link")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            modo === "link" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          Link por e-mail
        </button>
        <button
          type="button"
          onClick={() => setModo("otp")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            modo === "otp" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          Código OTP
        </button>
      </div>

      {state.status === "success" ? (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.message}</span>
          </div>
          {modo === "otp" && emailEnviado && (
            <Button
              className="w-full"
              onClick={() =>
                router.push(
                  `/redefinir-senha?modo=otp&email=${encodeURIComponent(emailEnviado)}`,
                )
              }
            >
              Inserir código
            </Button>
          )}
        </div>
      ) : (
        <form action={modo === "link" ? onSubmitLink : onSubmitOtp} className="space-y-5">
          {state.status === "error" && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.message}
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
                disabled={pending}
                className="pl-9"
                defaultValue={params.get("email") ?? ""}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {modo === "link" ? "Enviar link de redefinição" : "Enviar código"}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Prefere entrar sem senha?{" "}
        <Link href="/login/otp" className="font-medium text-primary hover:underline">
          Entrar com código OTP
        </Link>
      </p>
    </AuthFormShell>
  );
}
