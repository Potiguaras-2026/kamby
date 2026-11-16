import { IMAGENS } from "./imagens";

// shortcut: texto de rascunho com orientações gerais da Rede Brasileira de Bancos de Leite Humano;
// validar com a equipe do banco de leite antes de uso real.
export const DICAS = {
  higiene: {
    titulo: "Higiene correta",
    resumo: "Mãos e utensílios sempre limpos",
    imagem: IMAGENS.maos,
    texto: [
      "Antes de cada retirada, prenda o cabelo e cubra com a touca do kit.",
      "Lave as mãos e os braços até o cotovelo com água e sabão, e seque com toalha limpa ou papel.",
      "Evite conversar durante a retirada, ou use uma máscara. Isso protege o leite.",
    ],
  },
  armazenamento: {
    titulo: "Armazenamento seguro",
    resumo: "Congele o leite logo depois",
    imagem: IMAGENS.congelador,
    texto: [
      "Feche bem o frasco e coloque no congelador assim que terminar.",
      "Você pode completar o mesmo frasco nos dias seguintes, sempre deixando dois dedos livres até a tampa.",
      "O leite congelado pode ficar até 15 dias no congelador até a coleta.",
    ],
  },
  frascos: {
    titulo: "Frascos adequados",
    resumo: "Prefira vidro esterilizado",
    imagem: IMAGENS.frascos,
    texto: [
      "Use os frascos de vidro esterilizados que vêm no kit. Eles foram preparados pelo banco de leite.",
      "Escreva na etiqueta seu nome e a data da primeira retirada.",
      "Se precisar de mais frascos, peça um novo kit pelo app.",
    ],
  },
  destino: {
    titulo: "Para onde vai o seu leite",
    resumo: "Bebês prematuros na UTI neonatal",
    imagem: IMAGENS.uti,
    texto: [
      "No banco de leite, o leite doado passa por análise e pasteurização.",
      "Depois vai para bebês prematuros ou de baixo peso internados em UTIs neonatais, que ainda não podem mamar no peito.",
      "Cada frasco faz diferença no crescimento desses bebês.",
    ],
  },
} as const;

export type IdDica = keyof typeof DICAS;
