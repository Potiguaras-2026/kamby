export const ETAPAS = [
  { status: "agendada", rotulo: "Agendada", detalhe: "O banco de leite recebeu o seu pedido." },
  { status: "confirmada", rotulo: "Confirmada pelo banco", detalhe: "Dia e período confirmados." },
  { status: "a_caminho", rotulo: "Equipe a caminho", detalhe: "Deixe os frascos prontos no congelador." },
  { status: "coletada", rotulo: "Leite coletado", detalhe: "Obrigada pela sua doação." },
];

export const indiceEtapa = (status: string) => ETAPAS.findIndex((e) => e.status === status);
