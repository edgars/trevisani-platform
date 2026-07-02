"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { lancarPagamentoCompraAction } from "../actions";

const FORMAS = [
  { value: "PIX",          label: "PIX" },
  { value: "TRANSFERENCIA",label: "Transferência" },
  { value: "BOLETO",       label: "Boleto" },
  { value: "DINHEIRO",     label: "Dinheiro" },
  { value: "CARTAO",       label: "Cartão" },
  { value: "FINANCIAMENTO",label: "Financiamento" },
  { value: "OUTRO",        label: "Outro" },
];

function formatBRL(v: string) {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  return (parseInt(digits, 10) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

export function PagamentoForm({ slug, compraId }: { slug: string; compraId: string }) {
  const action = lancarPagamentoCompraAction.bind(null, slug, compraId);
  const [state, formAction, isPending] = useActionState(action, null);
  const [valor, setValor] = useState("");

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    else if (state !== null) {
      toast.success("Pagamento lançado.");
      setValor("");
    }
  }, [state]);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_160px_180px_auto]">
      <div className="space-y-1.5">
        <Label htmlFor="pg-descricao">Descrição</Label>
        <Input id="pg-descricao" name="descricao" placeholder="Ex: Entrada PIX" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pg-valor">Valor (R$)</Label>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">R$</span>
          <Input
            id="pg-valor"
            name="valor"
            value={valor}
            onChange={(e) => setValor(formatBRL(e.target.value))}
            placeholder="0,00"
            inputMode="numeric"
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Forma de pagamento</Label>
        <Select name="formaPagamento" defaultValue="PIX">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {FORMAS.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={isPending} className="w-full gap-2">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Lançar
        </Button>
      </div>
    </form>
  );
}
