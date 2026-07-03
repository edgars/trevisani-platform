"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { salvarConfiguracaoFiscalAction } from "./actions";

const REGIMES = [
  { value: "mei",             label: "MEI",              aliquota: 5,  desc: "Microempreendedor Individual" },
  { value: "simples",         label: "Simples Nacional",  aliquota: 6,  desc: "Alíquota típica para comércio" },
  { value: "lucro_presumido", label: "Lucro Presumido",   aliquota: 11.33, desc: "IRPJ + CSLL + PIS + COFINS" },
  { value: "lucro_real",      label: "Lucro Real",        aliquota: 34, desc: "IRPJ 25% + CSLL 9%" },
];

interface Props {
  config: {
    regimeTributario: string;
    aliquotaImpostosPct: string | number;
    overheadMensalCentavos: number;
  } | null;
}

function centavosToStr(c: number) {
  return (c / 100).toFixed(2).replace(".", ",");
}

export function ConfigFiscalForm({ config }: Props) {
  const [regime, setRegime] = React.useState(config?.regimeTributario ?? "simples");
  const [aliquota, setAliquota] = React.useState(
    config ? String(config.aliquotaImpostosPct) : "6"
  );
  const [isPending, startTransition] = React.useTransition();

  // When regime changes, suggest the default aliquota
  function handleRegimeChange(val: string) {
    setRegime(val);
    const found = REGIMES.find(r => r.value === val);
    if (found) setAliquota(String(found.aliquota));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await salvarConfiguracaoFiscalAction(null, fd);
      if (result?.error) toast.error(result.error);
      else toast.success("Configuração fiscal salva!");
    });
  }

  const currentRegime = REGIMES.find(r => r.value === regime);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-sm">Regime tributário</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Regime</Label>
            <Select value={regime} onValueChange={handleRegimeChange} name="regimeTributario">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REGIMES.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label} — {r.aliquota}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Hidden input so FormData carries the value */}
            <input type="hidden" name="regimeTributario" value={regime} />
            {currentRegime && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />{currentRegime.desc}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="aliquotaImpostosPct">
              Alíquota efetiva de impostos (%)
            </Label>
            <div className="relative">
              <Input
                id="aliquotaImpostosPct"
                name="aliquotaImpostosPct"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={aliquota}
                onChange={e => setAliquota(e.target.value)}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Percentual descontado da receita bruta no DRE. Ajuste conforme sua carga real.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Overhead fixo mensal</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="overheadMensalStr">Valor mensal (R$)</Label>
            <Input
              id="overheadMensalStr"
              name="overheadMensalStr"
              defaultValue={config ? centavosToStr(config.overheadMensalCentavos) : "0,00"}
              placeholder="0,00"
            />
            <p className="text-[11px] text-muted-foreground">
              Custos fixos que não entram em nenhuma categoria: aluguel, salários, energia, etc.
              Aparece como linha dedutiva no DRE.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="min-w-36">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar configuração
        </Button>
      </div>
    </form>
  );
}
