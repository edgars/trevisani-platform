import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCentavos(centavos: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(centavos / 100);
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", opts ?? { dateStyle: "short" }).format(d);
}

/** Converte "R$ 25.000,50" → centavos (2500050) */
export function parseCentavos(raw: string | number): number {
  if (typeof raw === "number") return Math.round(raw * 100);
  const clean = raw.replace(/[R$\s.]/g, "").replace(",", ".");
  const value = parseFloat(clean);
  return isNaN(value) ? 0 : Math.round(value * 100);
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}
