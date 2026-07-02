"use client";

import { useActionState } from "react";
import { enviarLead, type LeadFormState } from "./actions";

interface ContatoFormProps {
  tenantId: string;
  whatsapp: string | null;
}

const initial: LeadFormState = { status: "idle" };

export function ContatoForm({ tenantId, whatsapp }: ContatoFormProps) {
  const [state, formAction, pending] = useActionState(enviarLead, initial);

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border bg-green-50 p-8 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-semibold text-green-800">{state.message}</p>
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Ou fale agora pelo WhatsApp →
          </a>
        )}
      </div>
    );
  }

  const errors = state.status === "error" ? state.errors : {};

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="tenantId" value={tenantId} />

      <div>
        <label className="block text-sm font-medium mb-1">Nome *</label>
        <input
          name="nome"
          required
          className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
          style={{ focusRingColor: "hsl(var(--site-accent))" } as React.CSSProperties}
          placeholder="Seu nome completo"
        />
        {errors.nome && <p className="text-xs text-red-600 mt-1">{errors.nome[0]}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Telefone / WhatsApp *</label>
        <input
          name="telefone"
          required
          type="tel"
          className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
          placeholder="(11) 99999-0000"
        />
        {errors.telefone && <p className="text-xs text-red-600 mt-1">{errors.telefone[0]}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">E-mail</label>
        <input
          name="email"
          type="email"
          className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
          placeholder="seu@email.com (opcional)"
        />
        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email[0]}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Mensagem *</label>
        <textarea
          name="mensagem"
          required
          rows={4}
          className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none"
          placeholder="Olá! Tenho interesse em um veículo..."
        />
        {errors.mensagem && <p className="text-xs text-red-600 mt-1">{errors.mensagem[0]}</p>}
      </div>

      {state.status === "error" && !Object.keys(errors).length && (
        <p className="text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          Ocorreu um erro. Tente novamente.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: "hsl(var(--site-accent))" }}
      >
        {pending ? "Enviando..." : "Enviar mensagem"}
      </button>
    </form>
  );
}
