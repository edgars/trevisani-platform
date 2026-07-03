"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { excluirMovimentacaoAction } from "../../actions";

export function ExcluirMovimentacaoButton({ slug, movId }: { slug: string; movId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleExcluir() {
    if (!confirm("Excluir esta movimentação? Esta ação não pode ser desfeita.")) return;
    startTransition(async () => {
      const { error } = await excluirMovimentacaoAction(slug, movId);
      if (error) toast.error(error);
      else { toast.success("Movimentação excluída."); router.push(`/t/${slug}/financeiro/movimentacoes`); }
    });
  }

  return (
    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleExcluir} disabled={isPending}>
      <Trash2 className="mr-2 h-4 w-4" />Excluir
    </Button>
  );
}
