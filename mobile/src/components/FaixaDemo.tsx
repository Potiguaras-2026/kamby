import { FlaskConical } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { useInicio } from "@/lib/consultas";
import { familia } from "@/lib/tema";

// Flag de build: aparece antes do login, quando a mãe ainda vai digitar os dados.
const DEMO = process.env.EXPO_PUBLIC_DEMO === "1";

export const AZUL_DEMO = { texto: "#1F4A8A", borda: "#4A6FB0", fundo: "#E4ECF9" };

/** Aviso fixo em toda versão de demonstração: ninguém deve colocar dados de saúde reais aqui. */
export function FaixaDemo({ topo = 0, publica }: { topo?: number; publica?: boolean }) {
  if (DEMO) return <Faixa topo={topo} />;
  // Sem a flag de build, logada vale o que a API diz (KAMBY_DEMO).
  return publica ? null : <SeDemoNaApi topo={topo} />;
}

function SeDemoNaApi({ topo }: { topo: number }) {
  return useInicio().data?.demo ? <Faixa topo={topo} /> : null;
}

function Faixa({ topo }: { topo: number }) {
  return (
    <View style={[estilos.faixa, { paddingTop: 7 + topo }]} accessible accessibilityLabel="Modo demonstração. Use dados fictícios. Nenhuma coleta é real.">
      <FlaskConical size={16} color={AZUL_DEMO.texto} strokeWidth={2.2} />
      <Text style={estilos.texto}>
        <Text style={{ fontFamily: familia.semi }}>MODO DEMONSTRAÇÃO</Text> · use dados fictícios, nenhuma coleta é real
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  faixa: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingBottom: 7,
    paddingHorizontal: 16,
    backgroundColor: AZUL_DEMO.fundo,
    borderBottomWidth: 2,
    borderStyle: "dashed",
    borderColor: AZUL_DEMO.borda,
  },
  texto: { flexShrink: 1, fontFamily: familia.medio, fontSize: 12, lineHeight: 16, color: AZUL_DEMO.texto, textAlign: "center" },
});
