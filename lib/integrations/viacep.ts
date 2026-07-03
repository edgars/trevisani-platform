export interface ViaCepDados {
  cep: string;        // "01310-100"
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // cidade
  uf: string;
}

/**
 * Consulta o ViaCEP e retorna os dados de endereço.
 * Pode ser chamado do browser (GET direto) ou do servidor.
 * Retorna null quando o CEP não existe ou a entrada é inválida.
 */
export async function consultarCep(cep: string): Promise<ViaCepDados | null> {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
      next: { revalidate: 86400 }, // cache 24h no servidor
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;
    return data as ViaCepDados;
  } catch {
    return null;
  }
}
