/**
 * Resposta real da API wdapi2.com.br (campos conforme payload de produção).
 * Alguns campos vêm em camelCase, outros em SCREAMING_CASE, outros em snake_case.
 */
export interface PlacaApiResponse {
  // ── Campos raiz ─────────────────────────────────────────────────────────
  MARCA?: string;           // código interno (ex: "I" para importado)
  MODELO?: string;          // descrição completa (ex: "PEUGEOT 208 ACTIVE AT")
  SUBMODELO?: string;
  VERSAO?: string;
  /** Ano de fabricação — chave lowercase na resposta real */
  ano?: string;
  /** Ano do modelo — chave camelCase na resposta real */
  anoModelo?: string;
  /** Cor — lowercase na resposta real, já capitalizada (ex: "Branca") */
  cor?: string;
  chassi?: string;          // mascarado; chassis completo em extra.chassi
  codigoSituacao?: string;
  data?: string;
  listamodelo?: string[];
  logo?: string;
  marca?: string;           // mesmo que MARCA (código)
  marcaModelo?: string;     // "I/PEUGEOT 208 ACTIVE AT"
  mensagemRetorno?: string; // "Sem erros." quando OK
  modelo?: string;          // igual a MODELO
  municipio?: string;       // já com acento (ex: "Brasília")
  origem?: string;          // "IMPORTADO" | "NACIONAL"
  placa?: string;
  placa_alternativa?: string;
  segmento?: string;
  situacao?: string;        // "Sem restrição"
  sub_segmento?: string;
  uf?: string;

  // ── Bloco extra (detalhamento DENATRAN) ─────────────────────────────────
  extra?: {
    ano_fabricacao?: string;
    ano_modelo?: string;
    caixa_cambio?: string;
    carroceria?: string;
    chassi?: string;        // chassis completo sem máscara
    cilindradas?: string;
    combustivel?: string;   // "Alcool / Gasolina"
    especie?: string;       // "Passageiro"
    municipio?: string;     // uppercase
    nacionalidade?: string;
    placa?: string;
    placa_modelo_antigo?: string;
    placa_modelo_novo?: string;
    renavam?: string;
    restricao_1?: string;
    restricao_2?: string;
    restricao_3?: string;
    restricao_4?: string;
    segmento?: string;
    situacao_veiculo?: string;
    sub_segmento?: string;
    tipo_veiculo?: string;
    uf?: string;
    uf_placa?: string;
    [key: string]: unknown;
  } | null;

  // ── Bloco FIPE ───────────────────────────────────────────────────────────
  fipe?: {
    dados?: Array<{
      ano_modelo?: string;
      codigo_fipe?: string;
      combustivel?: string;
      mes_referencia?: string;
      score?: number;
      texto_marca?: string;
      texto_modelo?: string;
      texto_valor?: string;  // "R$ 64.852,00"
      tipo_modelo?: number;
    }>;
  } | null;

  /** Presente em respostas de erro (alguns endpoints legados) */
  message?: string;
}

/** Dados mapeados prontos para preencher o formulário */
export interface PlacaDados {
  placa: string;
  marca: string;
  modelo: string;
  versao: string;
  anoFabricacao: number;
  anoModelo: number;
  cor: string;
  chassi: string;
  renavam: string;
  combustivel: string;
  cambio: string;
  situacaoDocumental: string;
  municipio: string;
  uf: string;
  cilindrada: string;
  /** Valor FIPE sugerido em centavos (0 se não disponível) */
  fipeValorCentavos: number;
  fipeModelo: string;
  /** Payload bruto para armazenar no cache */
  payloadRaw: PlacaApiResponse;
}
