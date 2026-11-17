import { Sparkles } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { cores, familia, tipo } from "@/lib/tema";

import { Mascote } from "./Mascote";

type Props = { titulo: string; texto: string; selo?: string; tom?: "rosa" | "turquesa" };

const TONS = {
  rosa: { fundo: cores.rosaSuave, borda: cores.rosaClaro, selo: cores.primaria },
  turquesa: { fundo: cores.turquesaSuave, borda: cores.bordaTurquesa, selo: cores.turquesaTexto },
};

/**
 * Dica com personagem, no espírito dos apps que dão vontade de continuar: a gotinha "fala" num balão.
 * Entra com mola e o frasco balança de leve. Com "reduzir movimento" ligado, aparece parado.
 */
export function DicaAnimada({ titulo, texto, selo = "Você sabia?", tom = "turquesa" }: Props) {
  const cor = TONS[tom];
  const balao = useSharedValue(0);
  const pulo = useSharedValue(0);

  useEffect(() => {
    balao.value = withDelay(150, withSpring(1, { damping: 11, stiffness: 140, reduceMotion: ReduceMotion.System }));
    pulo.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 380, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 380, easing: Easing.in(Easing.quad) }),
          withTiming(0, { duration: 1800 }),
        ),
        -1,
        false,
        undefined,
        ReduceMotion.System,
      ),
    );
  }, [balao, pulo]);

  const estiloBalao = useAnimatedStyle(() => ({
    opacity: Math.min(1, balao.value * 1.4),
    transform: [{ scale: 0.85 + balao.value * 0.15 }, { rotate: `${(1 - balao.value) * -4}deg` }],
  }));
  const estiloPersonagem = useAnimatedStyle(() => ({ transform: [{ translateY: pulo.value }, { rotate: `${pulo.value * 0.8}deg` }] }));

  return (
    <View style={estilos.linha} accessible accessibilityLabel={`${selo} ${titulo}. ${texto}`}>
      <Animated.View style={[estilos.personagem, { backgroundColor: cor.fundo, borderColor: cor.borda }, estiloPersonagem]}>
        <Mascote tamanho={46} />
      </Animated.View>
      <Animated.View style={[estilos.balao, { borderColor: cor.borda }, estiloBalao]}>
        <View style={[estilos.ponta, { borderRightColor: cor.borda }]} />
        <View style={estilos.ponteiraDentro} />
        <View style={estilos.seloLinha}>
          <Sparkles size={14} color={cor.selo} />
          <Text style={[estilos.selo, { color: cor.selo }]}>{selo}</Text>
        </View>
        <Text style={estilos.titulo}>{titulo}</Text>
        {texto ? <Text style={[tipo.legenda, { color: cores.texto }]}>{texto}</Text> : null}
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  personagem: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  balao: {
    flex: 1,
    gap: 2,
    backgroundColor: cores.superficie,
    borderWidth: 2,
    // Borda de baixo mais grossa: dá o "relevo" de cartão de jogo, sem sombra.
    borderBottomWidth: 4,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  // Ponta do balão apontando para o personagem: triângulo de borda + triângulo branco por cima.
  ponta: {
    position: "absolute",
    left: -12,
    bottom: 14,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 12,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  ponteiraDentro: {
    position: "absolute",
    left: -8,
    bottom: 16,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 9,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: cores.superficie,
  },
  seloLinha: { flexDirection: "row", alignItems: "center", gap: 4 },
  selo: { fontFamily: familia.semi, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase" },
  titulo: { fontFamily: familia.semi, fontSize: 16, lineHeight: 22, color: cores.texto },
});
