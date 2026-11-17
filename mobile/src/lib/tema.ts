import type { TextStyle, ViewStyle } from "react-native";

// Cores da marca (Figma). Rosa e turquesa puros são decoração: falham contraste de texto.
// Texto e botões usam as versões escuras, todas com 4.5:1 ou mais sobre branco e `fundo` (WCAG AA).
export const cores = {
  rosa: "#E54DAA",
  rosaClaro: "#F4B6DA",
  rosaSuave: "#FDEEF6",
  primaria: "#C2187F",
  primariaClara: "#D12B8E",
  primariaEscura: "#A8126F",
  sobrePrimaria: "#FFFFFF",
  turquesa: "#33D3CB",
  turquesaSuave: "#E6F8F7",
  turquesaTexto: "#0B6F6A",
  azulTexto: "#2F5A9E",
  ambarSuave: "#FFF4E0",
  fundo: "#FFF8FB",
  superficie: "#FFFFFF",
  texto: "#241B22",
  textoSuave: "#6B6170",
  linha: "rgba(36, 27, 34, 0.08)",
  borda: "#F6D3E6",
  bordaTurquesa: "#B9ECE9",
  // 3:1 sobre branco: o mínimo para borda de campo (WCAG 1.4.11), sem pesar como cinza escuro.
  bordaCampo: "#9C9097",
  desabilitado: "#ECE6EA",
  erro: "#B3261E",
  erroSuave: "#FCECEA",
  splash: "#BD2182",
  splashEscuro: "#9E1F6C",
};

export const gradiente = {
  primaria: [cores.primariaClara, cores.primariaEscura] as const,
  marca: [cores.splash, cores.splashEscuro] as const,
};

export const espaco = { m: 16, g: 24, gg: 32 };

export const raio = { p: 6, m: 8, g: 12, pilula: 999 };

export const toqueMinimo = 48;

export const familia = {
  regular: "Poppins_400Regular",
  medio: "Poppins_500Medium",
  semi: "Poppins_600SemiBold",
  // Só para a saudação da Início, como no Figma.
  assinatura: "MomoSignature_400Regular",
};

/** Escala tipográfica. Use `tipo.x` e sobrescreva só a cor quando precisar. */
export const tipo = {
  display: { fontFamily: familia.semi, fontSize: 34, lineHeight: 40, letterSpacing: -0.6, color: cores.texto },
  titulo: { fontFamily: familia.semi, fontSize: 22, lineHeight: 30, letterSpacing: -0.2, color: cores.texto },
  subtitulo: { fontFamily: familia.semi, fontSize: 18, lineHeight: 24, letterSpacing: -0.2, color: cores.texto },
  corpo: { fontFamily: familia.regular, fontSize: 16, lineHeight: 24, color: cores.texto },
  corpoForte: { fontFamily: familia.medio, fontSize: 16, lineHeight: 24, color: cores.texto },
  legenda: { fontFamily: familia.regular, fontSize: 14, lineHeight: 20, color: cores.textoSuave },
} satisfies Record<string, TextStyle>;

export const sombra = {
  suave: {
    shadowColor: "#7A1A50",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  media: {
    shadowColor: "#7A1A50",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  botao: {
    shadowColor: cores.primaria,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
} satisfies Record<string, ViewStyle>;

export const mola = {
  toque: { damping: 30, stiffness: 420, mass: 0.6 },
  elastica: { damping: 22, stiffness: 260 },
};
