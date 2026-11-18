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
  // Data com hora vem em UTC: cortar em "AAAA-MM-DD" adiantaria o dia à noite no Brasil.
  return (iso.length > 10 ? new Date(iso) : paraData(iso)).toLocaleDateString("pt-BR");
}

/** Pedidos antigos não têm dia de entrega; aí vale a data do pedido. */
export function entregaKit(kit: { data_entrega?: string | null; horario_rotulo: string; criado_em: string }) {
  return kit.data_entrega ? `${diaRelativo(kit.data_entrega)} • ${kit.horario_rotulo}` : `Pedido em ${dataCompleta(kit.criado_em)}`;
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

/** Máscara progressiva de data: 05/04/1996. */
export function mascaraData(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** "05/04/1996" vira "1996-04-05"; data impossível (31/02) vira null. */
export function dataIso(valor: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  if (!m) return null;
  const [, dia, mes, ano] = m;
  const d = new Date(Number(ano), Number(mes) - 1, Number(dia), 12);
  if (d.getDate() !== Number(dia) || d.getMonth() !== Number(mes) - 1 || Number(ano) < 1900) return null;
  return `${ano}-${mes}-${dia}`;
}
