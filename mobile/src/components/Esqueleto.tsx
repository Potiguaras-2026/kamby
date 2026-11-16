import { useEffect } from "react";
import { View, type DimensionValue } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

import { cores, raio } from "@/lib/tema";

type Props = { altura: number; largura?: DimensionValue; arredondado?: number };

export function Esqueleto({ altura, largura = "100%", arredondado = raio.m }: Props) {
  const opacidade = useSharedValue(0.55);
  useEffect(() => {
    opacidade.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacidade]);
  const animado = useAnimatedStyle(() => ({ opacity: opacidade.value }));
  return (
    <Animated.View style={[{ height: altura, width: largura, borderRadius: arredondado, backgroundColor: cores.rosaSuave }, animado]} />
  );
}

export function EsqueletoTela() {
  return (
    <View style={{ gap: 16 }} accessible accessibilityLabel="Carregando">
      <Esqueleto altura={28} largura="60%" />
      <Esqueleto altura={168} arredondado={raio.g} />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Esqueleto altura={112} arredondado={raio.g} />
        </View>
        <View style={{ flex: 1 }}>
          <Esqueleto altura={112} arredondado={raio.g} />
        </View>
      </View>
      <Esqueleto altura={200} arredondado={raio.g} />
    </View>
  );
}
