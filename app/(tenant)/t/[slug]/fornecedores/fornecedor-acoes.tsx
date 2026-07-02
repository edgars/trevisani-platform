"use client";

import { useTransition } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, PowerOff, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleAtivoFornecedorAction, excluirFornecedorAction } from "./actions";

interface Props {
  slug: string;
  fornecedorId: string;
  ativo: boolean;
}

export function FornecedorAcoes({ slug, fornecedorId, ativo }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleAtivoFornecedorAction(slug, fornecedorId, !ativo);
      if (result.error) toast.error(result.error);
      else toast.success(ativo ? "Fornecedor inativado." : "Fornecedor reativado.");
    });
  }

  function handleExcluir() {
    if (!confirm("Excluir este fornecedor? Essa ação não pode ser desfeita.")) return;
    startTransition(async () => {
      const result = await excluirFornecedorAction(slug, fornecedorId);
      if (result.error) toast.error(result.error);
      else toast.success("Fornecedor excluído.");
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending} className="h-7 w-7">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild className="gap-2">
          <Link href={`/t/${slug}/fornecedores/${fornecedorId}/editar`}>
            <Pencil className="h-4 w-4 text-muted-foreground" />
            Editar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggle} className="gap-2">
          {ativo ? (
            <>
              <PowerOff className="h-4 w-4 text-amber-600" />
              Inativar
            </>
          ) : (
            <>
              <Power className="h-4 w-4 text-emerald-600" />
              Reativar
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleExcluir}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
