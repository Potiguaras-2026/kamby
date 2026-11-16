import { IMAGENS } from "./imagens";

// shortcut: texto de rascunho com orientações gerais da Rede Brasileira de Bancos de Leite Humano;
// validar com a equipe do banco de leite antes de uso real.
export const GUIAS: Record<
  string,
  { titulo: string; tom: "rosa" | "turquesa" | "azul"; imagem?: number; passos: string[] }
> = {
  "passo-a-passo": {
    titulo: "Passo a passo da doação",
    tom: "rosa",
    imagem: IMAGENS.retirada,
    passos: [
      "Prenda o cabelo, cubra com a touca e lave bem as mãos e os braços até o cotovelo.",
      "Use o frasco de vidro esterilizado do kit. Escreva na etiqueta seu nome e a data da primeira retirada.",
      "Massageie as mamas com a ponta dos dedos, em movimentos circulares.",
      "Despreze os primeiros jatos e retire o leite com as mãos, direto no frasco.",
      "Feche bem e guarde no congelador. Você pode completar o mesmo frasco nos próximos dias, deixando dois dedos livres até a tampa.",
      "Com os frascos prontos, agende a coleta pelo app. O leite congelado pode ficar até 15 dias no congelador.",
    ],
  },
  "quem-pode": {
    titulo: "Quem pode ser doadora?",
    tom: "turquesa",
    passos: [
      "Está amamentando e tem mais leite do que o seu bebê precisa.",
      "Está com boa saúde e com os exames do pré-natal sem alteração.",
      "Não fuma e não consome bebida alcoólica ou outras drogas.",
      "Não toma remédios que impedem a doação. Na dúvida, o banco de leite orienta.",
    ],
  },
  "como-ser": {
    titulo: "Como ser doadora?",
    tom: "azul",
    passos: [
      "Faça seu cadastro no Kamby.",
      "Responda às perguntas de saúde.",
      "O banco de leite analisa e avisa pelo app.",
      "Peça seu kit com os frascos esterilizados.",
      "Retire o leite em casa e agende a coleta.",
    ],
  },
};
