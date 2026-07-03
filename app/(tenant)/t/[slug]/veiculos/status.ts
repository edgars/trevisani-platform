/**
 * Ciclo de vendas do veículo — ordem canônica dos estágios e metadados de
 * exibição compartilhados entre a lista, o kanban e os formulários.
 */

export const STAGE_ORDER = [
  "NEGOCIANDO",
  "EM_PREPARACAO",
  "DISPONIVEL",
  "RESERVADO",
  "VENDIDO",
  "BAIXADO",
] as const;

export type StageVeiculo = (typeof STAGE_ORDER)[number];

export const STAGE_CONFIG: Record<
  StageVeiculo,
  {
    label: string;
    badge: "success" | "warning" | "secondary" | "destructive" | "default";
    /** cor do indicador da coluna no kanban */
    dot: string;
  }
> = {
  NEGOCIANDO:    { label: "Negociando",    badge: "warning",     dot: "bg-violet-500" },
  DISPONIVEL:    { label: "Disponível",    badge: "success",     dot: "bg-emerald-500" },
  EM_PREPARACAO: { label: "Em preparação", badge: "secondary",   dot: "bg-amber-500" },
  RESERVADO:     { label: "Reservado",     badge: "warning",     dot: "bg-blue-500" },
  VENDIDO:       { label: "Vendido",       badge: "secondary",   dot: "bg-zinc-500" },
  BAIXADO:       { label: "Baixado",       badge: "destructive", dot: "bg-red-500" },
};

/** Shape serializável do veículo usado pela lista e pelo kanban. */
export interface VeiculoResumo {
  id: string;
  marca: string;
  modelo: string;
  versao: string | null;
  cor: string | null;
  anoFabricacao: number;
  anoModelo: number;
  placa: string | null;
  kmAtual: number | null;
  precoCustoCentavos: number;
  precoVendaCentavos: number;
  status: StageVeiculo;
  thumbUrl: string | null;
  fotosCount: number;
  documentosCount: number;
  /** ISO string — quando o veículo ficou disponível para venda */
  dataChegada: string | null;
}
