import { router } from "expo-router";
import { Check, ClipboardCheck, Heart, Hourglass } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import { Botao } from "@/components/Botao";
import { Cartao } from "@/components/Cartao";
import { cores, familia, tipo } from "@/lib/tema";

const PASSOS = [
  { rotulo: "Cadastro recebido", icone: ClipboardCheck, estado: "feito" },
  { rotulo: "Análise do banco", icone: Hourglass, estado: "agora" },
  { rotulo: "Pronta para doar", icone: Heart, estado: "depois" },
] as const;

/** Cadastro em análise: mostra onde a mãe está no caminho até poder doar, em vez de só um texto. */
export function EmAnalise({ texto }: { texto: string }) {
  const giro = useSharedValue(0);
  const onda = useSharedValue(0);
  useEffect(() => {
    // Ampulheta vira de tempos em tempos; a onda em volta pulsa devagar.
    giro.value = withRepeat(withSequence(withTiming(0, { duration: 1400 }), withTiming(180, { duration: 600, easing: Easing.inOut(Easing.cubic) })), -1, false, undefined, ReduceMotion.System);
    onda.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false, undefined, ReduceMotion.System);
  }, [giro, onda]);
  const estiloGiro = useAnimatedStyle(() => ({ transform: [{ rotate: `${giro.value}deg` }] }));
  const estiloOnda = useAnimatedStyle(() => ({ transform: [{ scale: 1 + onda.value * 0.5 }], opacity: 0.5 * (1 - onda.value) }));

  return (
    <Cartao style={{ gap: 16 }}>
      <View style={estilos.topo}>
        <View style={estilos.icone}>
          <Animated.View style={[estilos.onda, estiloOnda]} />
          <Animated.View style={estiloGiro}>
            <Hourglass size={28} color={cores.primaria} strokeWidth={2} />
          </Animated.View>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text accessibilityRole="header" style={[tipo.subtitulo, { color: cores.primaria }]}>
            Cadastro em análise
          </Text>
          <Text style={tipo.legenda}>{texto}</Text>
        </View>
      </View>

      <View style={estilos.passos} accessible accessibilityLabel="Cadastro recebido, concluído. Análise do banco, agora. Pronta para doar, depois.">
        {PASSOS.map((p, i) => {
          const Icone = p.estado === "feito" ? Check : p.icone;
          return (
            <View key={p.rotulo} style={estilos.passo}>
              {i > 0 ? <View style={[estilos.traco, p.estado !== "depois" && { backgroundColor: cores.turquesaTexto }]} /> : null}
              <View style={[estilos.bolinha, p.estado === "feito" && estilos.feito, p.estado === "agora" && estilos.agora]}>
                <Icone size={16} color={p.estado === "feito" ? cores.sobrePrimaria : p.estado === "agora" ? cores.primaria : cores.textoSuave} strokeWidth={2.4} />
              </View>
              <Text style={[estilos.rotulo, p.estado === "agora" && { color: cores.primaria, fontFamily: familia.semi }]}>{p.rotulo}</Text>
            </View>
          );
        })}
      </View>

      <Botao titulo="Enquanto isso, ver dicas" variante="suave" compacto onPress={() => router.push("/dicas")} />
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  topo: { flexDirection: "row", alignItems: "center", gap: 14 },
  icone: { width: 56, height: 56, borderRadius: 28, backgroundColor: cores.rosaSuave, alignItems: "center", justifyContent: "center" },
  onda: { position: "absolute", width: 56, height: 56, borderRadius: 28, backgroundColor: cores.rosaClaro },
  passos: { flexDirection: "row" },
  passo: { flex: 1, alignItems: "center", gap: 6 },
  traco: { position: "absolute", top: 15, right: "50%", width: "100%", height: 2, backgroundColor: cores.linha },
  bolinha: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: cores.bordaCampo,
    backgroundColor: cores.superficie,
    alignItems: "center",
    justifyContent: "center",
  },
  feito: { backgroundColor: cores.turquesaTexto, borderColor: cores.turquesaTexto },
  agora: { borderColor: cores.primaria, borderWidth: 2, backgroundColor: cores.rosaSuave },
  rotulo: { fontFamily: familia.regular, fontSize: 12, lineHeight: 16, color: cores.textoSuave, textAlign: "center" },
});
