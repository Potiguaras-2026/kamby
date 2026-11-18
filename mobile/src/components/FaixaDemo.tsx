import { FlaskConical } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { cores, familia } from "@/lib/tema";

// Flag de build, não da API: precisa aparecer antes do login, quando a mãe ainda vai digitar os dados.
const DEMO = process.env.EXPO_PUBLIC_DEMO === "1";

/** Aviso fixo na versão publicada para testes: ninguém deve colocar dados de saúde reais aqui. */
export function FaixaDemo({ topo = 0 }: { topo?: number }) {
  if (!DEMO) return null;
  return (
    <View style={[estilos.faixa, { paddingTop: 6 + topo }]}>
      <FlaskConical size={16} color={cores.azulTexto} />
      <Text style={estilos.texto}>Versão de demonstração. Não use dados reais.</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  faixa: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: "#F2F6FC",
    borderBottomWidth: 1,
    borderColor: "#A9BEE0",
  },
  texto: { fontFamily: familia.medio, fontSize: 13, color: cores.azulTexto, textAlign: "center" },
});
