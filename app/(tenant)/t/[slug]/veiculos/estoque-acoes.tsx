"use client";

import { useTransition } from "react";
import Link from "next/link";
import { MoreHorizontal, Trash2, CheckCircle, Clock, Archive, Images } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { atualizarStatusVeiculoAction, excluirVeiculoAction } from "./actions";

interface Props {
  slug: string;
  veiculoId: string;
  statusAtual: string;
}

export function EstoqueAcoes({ slug, veiculoId, statusAtual }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleStatus(status: "DISPONIVEL" | "EM_PREPARACAO" | "RESERVADO" | "BAIXADO") {
    startTransition(async () => {
      const result = await atualizarStatusVeiculoAction(slug, veiculoId, status);
      if (result.error) toast.error(result.error);
      else toast.success("Status atualizado.");
    });
  }

  function handleExcluir() {
    if (!confirm("Tem certeza que deseja excluir este veículo?")) return;
    startTransition(async () => {
      const result = await excluirVeiculoAction(slug, veiculoId);
      if (result.error) toast.error(result.error);
      else toast.success("Veículo excluído.");
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending} className="h-7 w-7">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Fotos */}
        <DropdownMenuItem asChild className="gap-2">
          <Link href={`/t/${slug}/veiculos/${veiculoId}/fotos`}>
            <Images className="h-4 w-4 text-muted-foreground" />
            Gerenciar fotos
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Alterar status</DropdownMenuLabel>

        {statusAtual !== "DISPONIVEL" && (
          <DropdownMenuItem onClick={() => handleStatus("DISPONIVEL")} className="gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            Disponível
          </DropdownMenuItem>
        )}
        {statusAtual !== "EM_PREPARACAO" && (
          <DropdownMenuItem onClick={() => handleStatus("EM_PREPARACAO")} className="gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            Em preparação
          </DropdownMenuItem>
        )}
        {statusAtual !== "RESERVADO" && (
          <DropdownMenuItem onClick={() => handleStatus("RESERVADO")} className="gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            Reservado
          </DropdownMenuItem>
        )}
        {statusAtual !== "BAIXADO" && (
          <DropdownMenuItem onClick={() => handleStatus("BAIXADO")} className="gap-2">
            <Archive className="h-4 w-4 text-muted-foreground" />
            Baixado
          </DropdownMenuItem>
        )}

        {statusAtual !== "VENDIDO" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleExcluir}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
