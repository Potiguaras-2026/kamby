import { StyleSheet, Text } from "react-native";

import { cores, familia, raio } from "@/lib/tema";

export type TomSelo = "andamento" | "concluido" | "cancelado" | "atencao";

const TONS: Record<TomSelo, { fundo: string; texto: string }> = {
  andamento: { fundo: cores.turquesaSuave, texto: cores.turquesaTexto },
  concluido: { fundo: "#EAF4EC", texto: "#2E6B3F" },
  cancelado: { fundo: "#F1EEF0", texto: cores.textoSuave },
  atencao: { fundo: cores.erroSuave, texto: cores.erro },
};

/** Situação de um pedido em uma palavra. Sempre texto, nunca só cor. */
export function Selo({ texto, tom }: { texto: string; tom: TomSelo }) {
  const t = TONS[tom];
  return <Text style={[estilos.selo, { backgroundColor: t.fundo, color: t.texto }]}>{texto}</Text>;
}

const estilos = StyleSheet.create({
  selo: {
    alignSelf: "flex-start",
    fontFamily: familia.semi,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: raio.pilula,
    overflow: "hidden",
  },
});
