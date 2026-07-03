"use client";

import * as React from "react";
import { toast } from "sonner";
import { Building2, HandCoins, Loader2, Pencil, Plus, Trash2, UserRound, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

import { criarEmissorAction, atualizarEmissorAction, excluirEmissorAction } from "./actions";

type TipoEmissor = "EMPRESA" | "FUNCIONARIO" | "SOCIO";

interface EmissorData {
  id: string;
  nome: string;
  tipo: TipoEmissor;
  documento: string | null;
  contato: string | null;
  observacoes: string | null;
  ativo: boolean;
  movimentacoes: number;
}

const TIPO_LABEL: Record<TipoEmissor, string> = {
  EMPRESA: "Empresa / Fornecedor",
  FUNCIONARIO: "Funcionário",
  SOCIO: "Sócio",
};

const TIPO_ICON: Record<TipoEmissor, React.ElementType> = {
  EMPRESA: Building2,
  FUNCIONARIO: Users,
  SOCIO: HandCoins,
};

function EmissorForm({
  emissor,
  onClose,
}: {
  emissor?: EmissorData;
  onClose: () => void;
}) {
  const [tipo, setTipo] = React.useState<TipoEmissor>(emissor?.tipo ?? "EMPRESA");
  const [isPending, startTransition] = React.useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("tipo", tipo);
    startTransition(async () => {
      const result = emissor
        ? await atualizarEmissorAction(emissor.id, null, fd)
        : await criarEmissorAction(null, fd);
      if (result?.error) toast.error(result.error);
      else { toast.success(emissor ? "Emissor atualizado!" : "Emissor criado!"); onClose(); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label>Nome *</Label>
        <Input name="nome" defaultValue={emissor?.nome} placeholder="Ex: AWS, João Silva, Sócio Pedro" required disabled={isPending} />
      </div>

      <div className="space-y-1.5">
        <Label>Tipo *</Label>
        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoEmissor)} disabled={isPending}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="EMPRESA">Empresa / Fornecedor</SelectItem>
            <SelectItem value="FUNCIONARIO">Funcionário</SelectItem>
            <SelectItem value="SOCIO">Sócio (retirada / pró-labore)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>CPF / CNPJ</Label>
          <Input name="documento" defaultValue={emissor?.documento ?? ""} placeholder="000.000.000-00" disabled={isPending} />
        </div>
        <div className="space-y-1.5">
          <Label>Contato</Label>
          <Input name="contato" defaultValue={emissor?.contato ?? ""} placeholder="e-mail ou telefone" disabled={isPending} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Observações</Label>
        <Textarea name="observacoes" defaultValue={emissor?.observacoes ?? ""} rows={2} disabled={isPending} />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {emissor ? "Salvar" : "Criar emissor"}
        </Button>
      </div>
    </form>
  );
}

export function EmissoresManager({ emissores: initial }: { emissores: EmissorData[] }) {
  const [emissores, setEmissores] = React.useState(initial);
  const [editando, setEditando] = React.useState<EmissorData | null>(null);
  const [criarAberto, setCriarAberto] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  function handleExcluir(id: string) {
    if (!confirm("Excluir emissor? Esta ação é irreversível.")) return;
    startTransition(async () => {
      const { error } = await excluirEmissorAction(id);
      if (error) toast.error(error);
      else setEmissores(e => e.filter(x => x.id !== id));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={criarAberto} onOpenChange={setCriarAberto}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Novo emissor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo fornecedor / emissor</DialogTitle></DialogHeader>
            <EmissorForm onClose={() => { setCriarAberto(false); window.location.reload(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {emissores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <UserRound className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Nenhum emissor cadastrado. Cadastre empresas, funcionários ou sócios para vincular às despesas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {emissores.map(emissor => {
            const Icon = TIPO_ICON[emissor.tipo];
            return (
              <Card key={emissor.id} className={emissor.ativo ? "" : "opacity-60"}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <p className="truncate font-semibold">{emissor.nome}</p>
                      </div>
                      {emissor.documento && <p className="mt-1 text-xs text-muted-foreground font-mono">{emissor.documento}</p>}
                      {emissor.contato && <p className="text-xs text-muted-foreground">{emissor.contato}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <Badge variant="outline" className="text-[10px]">{TIPO_LABEL[emissor.tipo]}</Badge>
                      <Badge variant={emissor.ativo ? "secondary" : "outline"} className={`text-[10px] ${emissor.ativo ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : ""}`}>
                        {emissor.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{emissor.movimentacoes} movimentação(ões)</p>
                  <div className="mt-3 flex gap-1">
                    <Dialog open={editando?.id === emissor.id} onOpenChange={(open) => !open && setEditando(null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 flex-1" onClick={() => setEditando(emissor)}>
                          <Pencil className="mr-1 h-3.5 w-3.5" />Editar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Editar emissor</DialogTitle></DialogHeader>
                        {editando?.id === emissor.id && (
                          <EmissorForm emissor={editando} onClose={() => { setEditando(null); window.location.reload(); }} />
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-destructive hover:text-destructive"
                      onClick={() => handleExcluir(emissor.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
