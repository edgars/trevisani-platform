"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { criarPlanoAction, atualizarPlanoAction } from "./actions";

export interface PlanoData {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  precoMensalCentavos: number;
  precoAnualCentavos: number;
  limiteUsuarios: number;
  limiteVeiculos: number;
  limiteStorageMB: number;
  limitePlacasMes: number;
  limiteCnpjsMes: number;
  limiteClientesMes: number;
  ativo: boolean;
}

function centavosToStr(c: number) {
  return (c / 100).toFixed(2).replace(".", ",");
}

function LimitInput({
  name, label, hint, defaultValue, disabled,
}: { name: string; label: string; hint: string; defaultValue: number; disabled?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="number" defaultValue={defaultValue} min={-1} disabled={disabled} />
      <p className="text-[11px] text-muted-foreground">{hint} · -1 = ilimitado</p>
    </div>
  );
}

interface Props { plano?: PlanoData; }

export function PlanoForm({ plano }: Props) {
  const router = useRouter();
  const isEdit = !!plano;
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError("");
    startTransition(async () => {
      const result = isEdit
        ? await atualizarPlanoAction(plano!.id, null, fd)
        : await criarPlanoAction(null, fd);
      if (result?.error) { setError(result.error); toast.error(result.error); }
      else if (!isEdit && "id" in result && result.id) {
        toast.success("Plano criado!");
        router.push(`/admin/planos/${result.id}/editar`);
      } else { toast.success("Plano salvo!"); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      {/* ── Identidade ──────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="text-base">Identidade</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome do plano *</Label>
            <Input id="nome" name="nome" defaultValue={plano?.nome} placeholder="Starter" required disabled={isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug *</Label>
            <Input id="slug" name="slug" defaultValue={plano?.slug} placeholder="starter" pattern="[a-z0-9-]+" disabled={isPending} required />
            <p className="text-[11px] text-muted-foreground">Minúsculas, números e hifens</p>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input type="checkbox" id="ativo" name="ativo" defaultChecked={plano?.ativo ?? true} className="h-4 w-4 rounded border" />
            <Label htmlFor="ativo">Plano ativo (visível para novos tenants)</Label>
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" name="descricao" defaultValue={plano?.descricao ?? ""} rows={2} disabled={isPending} placeholder="Ideal para revendas de pequeno porte" />
          </div>
        </CardContent>
      </Card>

      {/* ── Preços ──────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="text-base">Preços</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="precoMensalStr">Preço mensal (R$)</Label>
            <Input id="precoMensalStr" name="precoMensalStr" defaultValue={centavosToStr(plano?.precoMensalCentavos ?? 0)} placeholder="0,00" disabled={isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="precoAnualStr">Preço anual (R$)</Label>
            <Input id="precoAnualStr" name="precoAnualStr" defaultValue={centavosToStr(plano?.precoAnualCentavos ?? 0)} placeholder="0,00" disabled={isPending} />
            <p className="text-[11px] text-muted-foreground">Cobrado à vista anualmente</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Limites operacionais ────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Limites operacionais</CardTitle>
          <p className="text-xs text-muted-foreground">Use -1 para ilimitado</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <LimitInput name="limiteUsuarios"    label="Usuários"                defaultValue={plano?.limiteUsuarios ?? 5}    hint="usuários ativos por tenant"           disabled={isPending} />
          <LimitInput name="limiteVeiculos"    label="Veículos em estoque"     defaultValue={plano?.limiteVeiculos ?? 50}   hint="veículos ativos simultâneos"          disabled={isPending} />
          <LimitInput name="limiteStorageMB"   label="Armazenamento (MB)"      defaultValue={plano?.limiteStorageMB ?? 1024} hint="total de fotos e documentos"         disabled={isPending} />
          <LimitInput name="limitePlacasMes"   label="Consultas de placa/mês"  defaultValue={plano?.limitePlacasMes ?? 100} hint="chamadas à API de placas"             disabled={isPending} />
          <LimitInput name="limiteCnpjsMes"    label="Consultas de CNPJ/mês"   defaultValue={plano?.limiteCnpjsMes ?? 50}  hint="chamadas à BrasilAPI CNPJ"            disabled={isPending} />
          <LimitInput name="limiteClientesMes" label="Novos clientes/mês"      defaultValue={plano?.limiteClientesMes ?? 200} hint="cadastros de clientes no mês"       disabled={isPending} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/planos")} disabled={isPending}>Cancelar</Button>
        <Button type="submit" disabled={isPending} className="min-w-32">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Salvar alterações" : "Criar plano"}
        </Button>
      </div>
    </form>
  );
}
