"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface Props {
  ano: number;
  mes: number;
  regime: string;
}

export function DreMesesNav({ ano, mes, regime }: Props) {
  function href(a: number, m: number) {
    return `/admin/financeiro?ano=${a}&mes=${m}&regime=${regime}`;
  }
  function prev() { return mes === 1 ? href(ano - 1, 12) : href(ano, mes - 1); }
  function next() { return mes === 12 ? href(ano + 1, 1) : href(ano, mes + 1); }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="icon" className="h-8 w-8">
        <Link href={prev()}><ChevronLeft className="h-4 w-4" /></Link>
      </Button>
      <div className="flex gap-1 overflow-x-auto">
        {MESES_ABREV.map((m, i) => {
          const active = i + 1 === mes;
          return (
            <Link
              key={m}
              href={href(ano, i + 1)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {m}
            </Link>
          );
        })}
      </div>
      <Button asChild variant="outline" size="icon" className="h-8 w-8">
        <Link href={next()}><ChevronRight className="h-4 w-4" /></Link>
      </Button>
      <span className="ml-2 text-sm font-semibold">{ano}</span>
    </div>
  );
}
