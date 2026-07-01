"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginFormProps {
  defaultTenant?: string;
  erro?: string;
}

export function LoginForm({ defaultTenant, erro }: LoginFormProps) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? undefined;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    erro ? "Não foi possível autenticar. Verifique suas credenciais." : null,
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const senha = String(form.get("senha") ?? "");
    const tenantSlug = String(form.get("tenantSlug") ?? "") || undefined;

    const res = await signIn("credentials", {
      redirect: false,
      email,
      senha,
      tenantSlug,
    });

    setLoading(false);

    if (res?.error) {
      setError("Não foi possível autenticar. Verifique suas credenciais.");
      return;
    }

    if (callbackUrl) {
      router.push(callbackUrl);
    } else if (tenantSlug) {
      router.push(`/t/${tenantSlug}`);
    } else {
      router.push("/admin");
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="tenantSlug">Slug da loja (opcional)</Label>
        <Input
          id="tenantSlug"
          name="tenantSlug"
          placeholder="demo"
          defaultValue={defaultTenant}
          autoComplete="organization"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="voce@empresa.com"
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="senha">Senha</Label>
        <Input
          id="senha"
          name="senha"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...
          </>
        ) : (
          "Entrar"
        )}
      </Button>
    </form>
  );
}
