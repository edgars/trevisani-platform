import type { PlacaApiResponse, PlacaDados } from "./types";

// ─── Combustível → enum do schema ────────────────────────────────────────────

const COMBUSTIVEL_MAP: Array<[RegExp, string]> = [
  [/flex|álcool.gasolina|alcool.gasolina|gasolina.alcool|gasolina.álcool/i, "FLEX"],
  [/gasolina/i, "GASOLINA"],
  [/álcool|alcool|etanol/i, "ETANOL"],
  [/diesel/i, "DIESEL"],
  [/gnv|gás natural|gas natural/i, "GNV"],
  [/híbrid|hibrid/i, "HIBRIDO"],
  [/elétric|eletric/i, "ELETRICO"],
];

function normalizarCombustivel(raw?: string): string {
  if (!raw) return "";
  for (const [re, val] of COMBUSTIVEL_MAP) {
    if (re.test(raw)) return val;
  }
  return "";
}

// ─── Câmbio inferido a partir do texto do modelo ─────────────────────────────

function inferirCambio(modelo?: string, caixaCambio?: string): string {
  const src = `${modelo ?? ""} ${caixaCambio ?? ""}`.toUpperCase();
  if (/\bCVT\b/.test(src)) return "CVT";
  if (/\bAUT\b|AUTOMAT|AT\b|\bTRIPTRONIC|\bS-TRONIC|\bDSG|\bPDK/.test(src)) return "AUTOMATICO";
  if (/\bAMT\b|AUTOMATIZADO/.test(src)) return "AUTOMATIZADO";
  if (/\bMAN\b|MANUAL|\bMEC\b/.test(src)) return "MANUAL";
  return "";
}

// ─── Cor ─────────────────────────────────────────────────────────────────────

const COR_MAP: Array<[RegExp, string]> = [
  [/preto|preta/i, "Preto"],
  [/branco|branca/i, "Branco"],
  [/prata|silver/i, "Prata"],
  [/cinza escuro|grafite/i, "Grafite"],
  [/cinza/i, "Cinza"],
  [/azul/i, "Azul"],
  [/vermelho|vermelha/i, "Vermelho"],
  [/verde/i, "Verde"],
  [/amarelo|amarela/i, "Amarelo"],
  [/laranja/i, "Laranja"],
  [/vinho|bordo|bordeaux/i, "Vinho"],
  [/marrom|bege|cafe/i, "Marrom"],
  [/dourado|gold/i, "Dourado"],
  [/roxo|violeta/i, "Roxo"],
  [/rosa/i, "Rosa"],
];

function normalizarCor(raw?: string): string {
  if (!raw) return "";
  for (const [re, val] of COR_MAP) {
    if (re.test(raw)) return val;
  }
  return raw;
}

// ─── Capitaliza primeira letra de cada palavra ───────────────────────────────

function capitalizar(str?: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Extrai marca legível ────────────────────────────────────────────────────
// O campo MARCA da API é um código (ex: "I"). A marca real está em:
// 1. fipe.dados[i].texto_marca  (melhor score)
// 2. marcaModelo sem o prefixo de código (ex: "I/PEUGEOT 208..." → "PEUGEOT")
// 3. listamodelo[0]

function extrairMarca(r: PlacaApiResponse): string {
  // Tenta FIPE (maior score)
  const melhorFipe = maiorScore(r);
  if (melhorFipe?.texto_marca) return capitalizar(melhorFipe.texto_marca);

  // Tenta listamodelo (primeiro elemento = fabricante)
  if (r.listamodelo && r.listamodelo.length > 0) {
    return capitalizar(r.listamodelo[0]);
  }

  // Tenta marcaModelo removendo o prefixo "X/" se existir
  if (r.marcaModelo) {
    const partes = r.marcaModelo.split("/");
    const nomeCompleto = partes.length > 1 ? partes[1] : partes[0];
    // Pega o primeiro token como marca
    return capitalizar(nomeCompleto.split(" ")[0]);
  }

  return capitalizar(r.MARCA ?? r.marca ?? "");
}

// ─── Extrai modelo legível ───────────────────────────────────────────────────
// O campo MODELO contém marca+modelo. Preferimos FIPE texto_modelo.

function extrairModelo(r: PlacaApiResponse): string {
  const melhorFipe = maiorScore(r);
  if (melhorFipe?.texto_modelo) {
    // Remove a parte da marca do início se for igual
    return capitalizar(melhorFipe.texto_modelo);
  }

  // Se listamodelo tiver ≥2 tokens, usa a partir do índice 1
  if (r.listamodelo && r.listamodelo.length >= 2) {
    return capitalizar(r.listamodelo.slice(1).join(" "));
  }

  return capitalizar(r.MODELO ?? r.modelo ?? "");
}

// ─── Melhor entrada FIPE por score ───────────────────────────────────────────

function maiorScore(r: PlacaApiResponse) {
  const dados = r.fipe?.dados;
  if (!dados || dados.length === 0) return null;
  return dados.reduce((best, cur) =>
    (cur.score ?? 0) > (best.score ?? 0) ? cur : best,
  );
}

// ─── Valor FIPE em centavos ──────────────────────────────────────────────────

function parseFipe(fipeValor?: string): number {
  if (!fipeValor) return 0;
  // "R$ 64.852,00" → 6485200
  const clean = fipeValor.replace(/[R$\s.]/g, "").replace(",", ".");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num * 100);
}

// ─── Restrições documentais ───────────────────────────────────────────────────

function extrairSituacao(r: PlacaApiResponse): string {
  // Campo raiz "situacao" é o mais legível
  if (r.situacao) return capitalizar(r.situacao);

  // Fallback: agrupa restrições do extra
  if (r.extra) {
    const restricoes = [
      r.extra.restricao_1,
      r.extra.restricao_2,
      r.extra.restricao_3,
      r.extra.restricao_4,
    ]
      .filter((v): v is string => !!v && v.toUpperCase() !== "SEM RESTRICAO")
      .map(capitalizar);
    return restricoes.length > 0 ? restricoes.join(", ") : "Sem restrição";
  }

  return "";
}

// ─── Mapper principal ────────────────────────────────────────────────────────

export function mapearResposta(
  placaOriginal: string,
  r: PlacaApiResponse,
): PlacaDados {
  // Anos: a API retorna campos com nomes variados
  const anoFab =
    parseInt(r.extra?.ano_fabricacao ?? r.ano ?? "0", 10) ||
    new Date().getFullYear();
  const anoMod =
    parseInt(r.extra?.ano_modelo ?? r.anoModelo ?? r.ano ?? "0", 10) ||
    anoFab;

  // Chassis: campo raiz é mascarado; extra.chassi tem o completo
  const chassi = r.extra?.chassi ?? r.chassi ?? "";

  // Combustível: extra tem o texto mais descritivo
  const combustivel = normalizarCombustivel(
    r.extra?.combustivel ?? "",
  );

  const melhorFipe = maiorScore(r);

  return {
    placa: placaOriginal.toUpperCase().replace(/[^A-Z0-9]/g, ""),
    marca: extrairMarca(r),
    modelo: extrairModelo(r),
    versao: capitalizar(r.SUBMODELO ?? r.VERSAO ?? ""),
    anoFabricacao: anoFab,
    anoModelo: anoMod,
    cor: normalizarCor(r.cor),
    chassi,
    renavam: r.extra?.renavam ?? "",
    combustivel,
    cambio: inferirCambio(r.MODELO ?? r.modelo, r.extra?.caixa_cambio),
    situacaoDocumental: extrairSituacao(r),
    municipio: capitalizar(r.municipio ?? r.extra?.municipio ?? ""),
    uf: r.uf ?? r.extra?.uf ?? r.extra?.uf_placa ?? "",
    cilindrada: r.extra?.cilindradas ?? "",
    fipeValorCentavos: parseFipe(melhorFipe?.texto_valor),
    fipeModelo: capitalizar(melhorFipe?.texto_modelo ?? ""),
    payloadRaw: r,
  };
}
