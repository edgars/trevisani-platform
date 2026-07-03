/** Categorias sugeridas para movimentações financeiras da própria plataforma. */
export const CATEGORIAS_PLATAFORMA = [
  // Receitas
  { nome: "Assinaturas de Tenants", tipo: "ENTRADA" as const },
  { nome: "Setup / Onboarding", tipo: "ENTRADA" as const },
  { nome: "Serviços Extras", tipo: "ENTRADA" as const },
  { nome: "Outras Receitas", tipo: "ENTRADA" as const },

  // Despesas
  { nome: "Infraestrutura / Hospedagem", tipo: "SAIDA" as const },
  { nome: "Ferramentas e Software", tipo: "SAIDA" as const },
  { nome: "Salários e Encargos", tipo: "SAIDA" as const },
  { nome: "Marketing e Publicidade", tipo: "SAIDA" as const },
  { nome: "Suporte / Terceirizados", tipo: "SAIDA" as const },
  { nome: "Impostos e Taxas", tipo: "SAIDA" as const },
  { nome: "Jurídico / Contabilidade", tipo: "SAIDA" as const },
  { nome: "Outras Despesas", tipo: "SAIDA" as const },
] as const;
