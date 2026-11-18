import { FlaskConical } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { useDemo } from "@/lib/consultas";
import { demo, familia, raio } from "@/lib/tema";

/**
 * Aviso fixo em toda versão de demonstração: ninguém deve colocar dados de saúde reais aqui.
 * Com cabeçalho, sai de trás dele como uma aba; sem (tela de entrar), flutua no topo como um selo.
 */
export function FaixaDemo({ solta, topo = 0 }: { solta?: boolean; topo?: number }) {
  if (!useDemo()) return null;
  return (
    <View
      style={solta ? [estilos.selo, { top: topo + 10 }] : estilos.aba}
      accessible
      accessibilityLabel="Modo demonstração. Use dados fictícios. Nenhuma coleta é real."
      pointerEvents="none"
    >
      <FlaskConical size={13} color={demo.texto} strokeWidth={2.2} />
      <Text style={estilos.texto} numberOfLines={1}>
        <Text style={{ fontFamily: familia.semi }}>Modo demonstração</Text> · dados fictícios
      </Text>
    </View>
  );
}

const base = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  gap: 6,
  backgroundColor: demo.fundo,
  borderWidth: 1.5,
  borderStyle: "dashed" as const,
  borderColor: demo.borda,
};

const estilos = StyleSheet.create({
  // Sobe 16px para trás do cabeçalho (zIndex 1, cantos arredondados): parece sair de dentro dele.
  aba: {
    ...base,
    marginTop: -16,
    marginHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 5,
    paddingHorizontal: 12,
    borderTopWidth: 0,
    borderBottomLeftRadius: raio.g,
    borderBottomRightRadius: raio.g,
  },
  selo: { ...base, position: "absolute", alignSelf: "center", zIndex: 2, paddingVertical: 5, paddingHorizontal: 12, borderRadius: raio.pilula },
  texto: { flexShrink: 1, fontFamily: familia.medio, fontSize: 11, lineHeight: 15, color: demo.texto },
});
