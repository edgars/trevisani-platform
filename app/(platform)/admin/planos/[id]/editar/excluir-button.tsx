"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { excluirPlanoAction } from "../../actions";

interface Props { id: string; nome: string; count: number; }

export function ExcluirPlanoButton({ id, nome, count }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function handleClick() {
    if (!confirm(`Excluir plano "${nome}"? Esta ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      const result = await excluirPlanoAction(id);
      if (result.error) { toast.error(result.error); return; }
      toast.success("Plano excluído.");
      router.push("/admin/planos");
    });
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleClick} disabled={isPending || count > 0} title={count > 0 ? "Existem tenants vinculados" : undefined}>
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      <span className="ml-2">Excluir</span>
    </Button>
  );
}
