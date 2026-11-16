// Datas da API chegam como "AAAA-MM-DD"; meio-dia evita virar o dia por fuso.
const paraData = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`);

export function diaCurto(iso: string) {
  const d = paraData(iso);
  return {
    semana: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
    dia: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    extenso: d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }),
  };
}

export function diaRelativo(iso: string) {
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  const dias = Math.round((paraData(iso).getTime() - hoje.getTime()) / 86_400_000);
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  const { extenso } = diaCurto(iso);
  return extenso.charAt(0).toUpperCase() + extenso.slice(1);
}

export function dataCompleta(iso: string) {
  return paraData(iso).toLocaleDateString("pt-BR");
}

export function litros(ml: number) {
  return `${(ml / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} L`;
}

export function telefone(digitos: string) {
  const d = digitos.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digitos;
}

export function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0];
}

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

/** Máscara progressiva enquanto a pessoa digita: (84) 91234-5678. */
export function mascaraTelefone(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function mascaraCep(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

type EnderecoLinha = { logradouro: string; numero: string; complemento?: string | null; bairro: string };

/** "Rua das Acácias, 145 - Apto 302, Jardim Primavera". */
export function linhaEndereco(e: EnderecoLinha) {
  return `${e.logradouro}, ${e.numero}${e.complemento ? ` - ${e.complemento}` : ""}, ${e.bairro}`;
}
