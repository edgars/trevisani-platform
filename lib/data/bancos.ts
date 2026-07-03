export interface Banco {
  codigo: string;
  nome: string;
  nomeCurto: string;
}

/** Principais bancos brasileiros pelo código COMPE / ISPB */
export const BANCOS_BRASIL: Banco[] = [
  { codigo: "001", nome: "Banco do Brasil S.A.", nomeCurto: "Banco do Brasil" },
  { codigo: "033", nome: "Banco Santander (Brasil) S.A.", nomeCurto: "Santander" },
  { codigo: "041", nome: "Banco do Estado do RS – Banrisul", nomeCurto: "Banrisul" },
  { codigo: "047", nome: "Banco do Estado de Sergipe S.A.", nomeCurto: "Banese" },
  { codigo: "070", nome: "Banco de Brasília S.A. – BRB", nomeCurto: "BRB" },
  { codigo: "077", nome: "Banco Inter S.A.", nomeCurto: "Inter" },
  { codigo: "085", nome: "Cooperativa Central de Crédito Rural – AILOS", nomeCurto: "Ailos" },
  { codigo: "104", nome: "Caixa Econômica Federal", nomeCurto: "Caixa" },
  { codigo: "197", nome: "Stone Pagamentos S.A.", nomeCurto: "Stone" },
  { codigo: "208", nome: "Banco BTG Pactual S.A.", nomeCurto: "BTG Pactual" },
  { codigo: "212", nome: "Banco Original S.A.", nomeCurto: "Banco Original" },
  { codigo: "237", nome: "Banco Bradesco S.A.", nomeCurto: "Bradesco" },
  { codigo: "260", nome: "Nu Pagamentos S.A. – Nubank", nomeCurto: "Nubank" },
  { codigo: "290", nome: "PagSeguro Internet S.A. – PagBank", nomeCurto: "PagBank" },
  { codigo: "318", nome: "Banco BMG S.A.", nomeCurto: "BMG" },
  { codigo: "323", nome: "Mercado Pago / Mercado Bitcoin", nomeCurto: "Mercado Pago" },
  { codigo: "336", nome: "Banco C6 S.A.", nomeCurto: "C6 Bank" },
  { codigo: "341", nome: "Itaú Unibanco S.A.", nomeCurto: "Itaú" },
  { codigo: "380", nome: "PicPay Serviços S.A.", nomeCurto: "PicPay" },
  { codigo: "389", nome: "Banco Mercantil do Brasil S.A.", nomeCurto: "Mercantil" },
  { codigo: "403", nome: "Cora Sociedade de Crédito S.A.", nomeCurto: "Cora" },
  { codigo: "422", nome: "Banco Safra S.A.", nomeCurto: "Safra" },
  { codigo: "461", nome: "Asaas Gestão Financeira Ind. Com. S.A.", nomeCurto: "Asaas" },
  { codigo: "604", nome: "Banco Industrial do Brasil S.A.", nomeCurto: "Industrial" },
  { codigo: "623", nome: "Banco Pan S.A.", nomeCurto: "Banco Pan" },
  { codigo: "655", nome: "Banco Votorantim S.A. – BV", nomeCurto: "BV" },
  { codigo: "735", nome: "Banco Neon S.A.", nomeCurto: "Neon" },
  { codigo: "745", nome: "Citibank N.A.", nomeCurto: "Citibank" },
  { codigo: "748", nome: "Sicredi – Coop. Central de Créd.", nomeCurto: "Sicredi" },
  { codigo: "756", nome: "Sicoob – Sistema de Coop. de Créd.", nomeCurto: "Sicoob" },
  { codigo: "999", nome: "Outro / Não listado", nomeCurto: "Outro" },
];

export const TIPOS_CONTA = [
  { value: "corrente",       label: "Conta Corrente" },
  { value: "poupanca",       label: "Conta Poupança" },
  { value: "pagamento",      label: "Conta de Pagamento" },
  { value: "caixa_interno",  label: "Caixa Interno" },
] as const;

/** Categorias padrão pré-cadastradas ao criar um tenant */
export const CATEGORIAS_PADRAO = [
  // Receitas
  { nome: "Venda de Veículo",        tipo: "ENTRADA" as const, cor: "#4ade80", icone: "car" },
  { nome: "Entrada / Sinal",         tipo: "ENTRADA" as const, cor: "#22c55e", icone: "handshake" },
  { nome: "Financiamento Recebido",  tipo: "ENTRADA" as const, cor: "#86efac", icone: "banknote" },
  { nome: "Serviço / Mão de Obra",   tipo: "ENTRADA" as const, cor: "#a3e635", icone: "wrench" },
  { nome: "Outros Recebimentos",     tipo: "ENTRADA" as const, cor: "#d9f99d", icone: "plus" },

  // Despesas
  { nome: "Peças e Acessórios",      tipo: "SAIDA"   as const, cor: "#f87171", icone: "cog" },
  { nome: "Mão de Obra / Mecânica",  tipo: "SAIDA"   as const, cor: "#ef4444", icone: "wrench" },
  { nome: "Estética / Funilaria",    tipo: "SAIDA"   as const, cor: "#fca5a5", icone: "paintbrush" },
  { nome: "Documentação / Despachante", tipo: "SAIDA" as const, cor: "#fb923c", icone: "file-text" },
  { nome: "Compra de Veículo",       tipo: "SAIDA"   as const, cor: "#f97316", icone: "shopping-cart" },
  { nome: "Aluguel / Infraestrutura",tipo: "SAIDA"   as const, cor: "#fbbf24", icone: "building" },
  { nome: "Salários e Encargos",     tipo: "SAIDA"   as const, cor: "#facc15", icone: "users" },
  { nome: "Marketing e Publicidade", tipo: "SAIDA"   as const, cor: "#a78bfa", icone: "megaphone" },
  { nome: "Impostos e Taxas",        tipo: "SAIDA"   as const, cor: "#818cf8", icone: "landmark" },
  { nome: "Outros Custos",           tipo: "SAIDA"   as const, cor: "#94a3b8", icone: "minus" },
] as const;
