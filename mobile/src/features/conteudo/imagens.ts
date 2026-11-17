// Ilustrações e fotos exportadas do protótipo no Figma (página Protótipo).
export const IMAGENS = {
  maeBebe: require("../../../assets/imagens/mae-bebe.png"),
  kitLuva: require("../../../assets/imagens/kit-luva.png"),
  kitTouca: require("../../../assets/imagens/kit-touca.png"),
  kitPote: require("../../../assets/imagens/kit-pote.png"),
  // Montadas a partir das peças do kit, no mesmo traço: pote com leite e o kit agrupado.
  poteLeite: require("../../../assets/imagens/pote-leite.png"),
  kitGrupo: require("../../../assets/imagens/kit-grupo.png"),
  maos: require("../../../assets/imagens/maos.jpg"),
  congelador: require("../../../assets/imagens/congelador.jpg"),
  frascos: require("../../../assets/imagens/frascos.jpg"),
  retirada: require("../../../assets/imagens/retirada.jpg"),
  bancoFrascos: require("../../../assets/imagens/banco-frascos.jpg"),
  uti: require("../../../assets/imagens/uti.jpg"),
  // Equipe Potiguaras (IFRN), que criou o Kamby.
  equipe: require("../../../assets/imagens/equipe.png"),
  potiguaras: require("../../../assets/imagens/potiguaras.png"),
};

/** O admin escolhe a imagem pelo nome; nome desconhecido vira "sem imagem" em vez de quebrar a tela. */
export const imagem = (nome?: string | null): number | undefined => (nome ? IMAGENS[nome as keyof typeof IMAGENS] : undefined);
