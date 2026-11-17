export type EnderecoCep = { logradouro: string; bairro: string; cidade: string; uf: string };

/** Busca o endereço na ViaCEP. Qualquer falha devolve null e a pessoa digita o endereço. */
export async function buscarCep(cep: string): Promise<EnderecoCep | null> {
  const digitos = cep.replace(/\D/g, "");
  if (digitos.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
    const d = await r.json();
    if (!r.ok || d.erro) return null;
    return { logradouro: d.logradouro ?? "", bairro: d.bairro ?? "", cidade: d.localidade ?? "", uf: d.uf ?? "" };
  } catch {
    return null;
  }
}
