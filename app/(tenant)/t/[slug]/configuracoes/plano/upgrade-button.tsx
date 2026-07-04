"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { solicitarUpgradeAction } from "./actions";

export function UpgradeButton({ slug, disabled }: { slug: string; disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [enviado, setEnviado] = useState(disabled ?? false);

  function handleClick() {
    startTransition(async () => {
      const result = await solicitarUpgradeAction(slug);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setEnviado(true);
      toast.success("Pedido enviado! Nossa equipe vai entrar em contato para ativar seu plano.");
    });
  }

  if (enviado) {
    return (
      <Button className="w-full" variant="outline" disabled>
        Pedido de upgrade enviado
      </Button>
    );
  }

  return (
    <Button className="w-full" onClick={handleClick} disabled={pending}>
      {pending ? "Enviando…" : "Solicitar upgrade"}
    </Button>
  );
}
