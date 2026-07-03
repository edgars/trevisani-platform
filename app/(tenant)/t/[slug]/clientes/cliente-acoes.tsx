"use client";

import { useTransition } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { excluirClienteAction } from "./actions";

export function ClienteAcoes({
  slug,
  clienteId,
}: {
  slug: string;
  clienteId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleExcluir() {
    if (!confirm("Excluir este cliente? Esta ação não pode ser desfeita.")) return;
    startTransition(async () => {
      const res = await excluirClienteAction(slug, clienteId);
      if (res.error) toast.error(res.error);
      else toast.success("Cliente excluído.");
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isPending}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={handleExcluir}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Excluir cliente
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
