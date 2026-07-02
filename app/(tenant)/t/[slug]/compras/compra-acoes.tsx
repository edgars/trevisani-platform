"use client";

import { useTransition } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, CheckCircle, XCircle, Trash2, FileSignature } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { atualizarStatusCompraAction, excluirCompraAction } from "./actions";

interface Props {
  slug: string;
  compraId: string;
  status: string;
}

export function CompraAcoes({ slug, compraId, status }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleStatus(s: "RASCUNHO" | "AGUARDANDO_ASSINATURA" | "CONCLUIDA" | "CANCELADA") {
    startTransition(async () => {
      const result = await atualizarStatusCompraAction(slug, compraId, s);
      if (result.error) toast.error(result.error);
      else toast.success("Status atualizado.");
    });
  }

  function handleExcluir() {
    if (!confirm("Excluir este rascunho de compra?")) return;
    startTransition(async () => {
      const result = await excluirCompraAction(slug, compraId);
      if (result.error) toast.error(result.error);
      else toast.success("Compra excluída.");
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending} className="h-7 w-7">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild className="gap-2">
          <Link href={`/t/${slug}/compras/${compraId}`}>
            <Pencil className="h-4 w-4 text-muted-foreground" />
            Ver detalhes
          </Link>
        </DropdownMenuItem>

        {status !== "CANCELADA" && status !== "CONCLUIDA" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Avançar status</DropdownMenuLabel>
            {status === "RASCUNHO" && (
              <DropdownMenuItem onClick={() => handleStatus("AGUARDANDO_ASSINATURA")} className="gap-2">
                <FileSignature className="h-4 w-4 text-blue-500" />
                Aguardando assinatura
              </DropdownMenuItem>
            )}
            {(status === "RASCUNHO" || status === "AGUARDANDO_ASSINATURA") && (
              <DropdownMenuItem onClick={() => handleStatus("CONCLUIDA")} className="gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                Concluir compra
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleStatus("CANCELADA")} className="gap-2 text-destructive focus:text-destructive">
              <XCircle className="h-4 w-4" />
              Cancelar compra
            </DropdownMenuItem>
          </>
        )}

        {status === "RASCUNHO" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExcluir} className="gap-2 text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4" />
              Excluir rascunho
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
