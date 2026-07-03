"use client";

import * as React from "react";
import { toast } from "sonner";
import { Building2, CreditCard, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { BANCOS_BRASIL, TIPOS_CONTA } from "@/lib/data/bancos";
import { criarContaAction, atualizarContaAction, excluirContaAction } from "./actions";

interface ContaData {
  id: string;
  nome: string;
  banco: string;
  codigoBanco: string | null;
  agencia: string | null;
  conta: string | null;
  tipoConta: string;
  pix: string | null;
  ativo: boolean;
  movimentacoes: number;
}

function ContaForm({
  conta,
  onClose,
}: {
  conta?: ContaData;
  onClose: () => void;
}) {
  const [banco, setBanco] = React.useState(conta?.banco ?? "");
  const [isPending, startTransition] = React.useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("banco", banco);
    startTransition(async () => {
      const result = conta
        ? await atualizarContaAction(conta.id, null, fd)
        : await criarContaAction(null, fd);
      if (result?.error) toast.error(result.error);
      else { toast.success(conta ? "Conta atualizada!" : "Conta criada!"); onClose(); }
    });
  }

  const bancoSelecionado = BANCOS_BRASIL.find(b => b.nome === banco);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label>Nome / Apelido *</Label>
        <Input name="nome" defaultValue={conta?.nome} placeholder="Ex: Conta PJ Principal" required disabled={isPending} />
      </div>

      <div className="space-y-1.5">
        <Label>Banco *</Label>
        <Select value={banco} onValueChange={(v) => setBanco(v)} disabled={isPending}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o banco" />
          </SelectTrigger>
          <SelectContent>
            {BANCOS_BRASIL.map(b => (
              <SelectItem key={b.codigo} value={b.nome}>
                {b.codigo !== "999" && <span className="mr-2 font-mono text-xs text-muted-foreground">{b.codigo}</span>}
                {b.nomeCurto}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {bancoSelecionado && <input type="hidden" name="codigoBanco" value={bancoSelecionado.codigo} />}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tipo de conta</Label>
          <Select name="tipoConta" defaultValue={conta?.tipoConta ?? "corrente"} disabled={isPending}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIPOS_CONTA.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Agência</Label>
          <Input name="agencia" defaultValue={conta?.agencia ?? ""} placeholder="0001" disabled={isPending} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Conta</Label>
          <Input name="conta" defaultValue={conta?.conta ?? ""} placeholder="00000-0" disabled={isPending} />
        </div>
        <div className="space-y-1.5">
          <Label>Chave PIX</Label>
          <Input name="pix" defaultValue={conta?.pix ?? ""} placeholder="CPF, CNPJ, e-mail..." disabled={isPending} />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={isPending || !banco}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {conta ? "Salvar" : "Criar conta"}
        </Button>
      </div>
    </form>
  );
}

export function ContasManager({ contas: initial }: { contas: ContaData[] }) {
  const [contas, setContas] = React.useState(initial);
  const [editando, setEditando] = React.useState<ContaData | null>(null);
  const [criarAberto, setCriarAberto] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  function handleExcluir(id: string) {
    if (!confirm("Excluir conta? Esta ação é irreversível.")) return;
    startTransition(async () => {
      const { error } = await excluirContaAction(id);
      if (error) toast.error(error);
      else setContas(c => c.filter(x => x.id !== id));
    });
  }

  const TIPO_LABEL: Record<string, string> = {
    corrente: "Corrente", poupanca: "Poupança",
    pagamento: "Pagamento", caixa_interno: "Caixa Interno",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={criarAberto} onOpenChange={setCriarAberto}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nova conta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova conta bancária</DialogTitle></DialogHeader>
            <ContaForm onClose={() => { setCriarAberto(false); window.location.reload(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {contas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada. Crie a primeira conta bancária da plataforma.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contas.map(conta => (
            <Card key={conta.id} className={conta.ativo ? "" : "opacity-60"}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <p className="truncate font-semibold">{conta.nome}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{conta.banco}</p>
                    {(conta.agencia || conta.conta) && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {conta.agencia && `Ag: ${conta.agencia}`}
                        {conta.agencia && conta.conta && " | "}
                        {conta.conta && `CC: ${conta.conta}`}
                      </p>
                    )}
                    {conta.pix && <p className="text-xs text-muted-foreground">PIX: {conta.pix}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <Badge variant="outline" className="text-[10px]">{TIPO_LABEL[conta.tipoConta] ?? conta.tipoConta}</Badge>
                    <Badge variant={conta.ativo ? "secondary" : "outline"} className={`text-[10px] ${conta.ativo ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : ""}`}>
                      {conta.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{conta.movimentacoes} movimentação(ões)</p>
                <div className="mt-3 flex gap-1">
                  <Dialog open={editando?.id === conta.id} onOpenChange={(open) => !open && setEditando(null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 flex-1" onClick={() => setEditando(conta)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" />Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Editar conta</DialogTitle></DialogHeader>
                      {editando?.id === conta.id && (
                        <ContaForm conta={editando} onClose={() => { setEditando(null); window.location.reload(); }} />
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-destructive hover:text-destructive"
                    onClick={() => handleExcluir(conta.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
