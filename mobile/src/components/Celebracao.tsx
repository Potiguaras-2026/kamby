import { Check } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming, ZoomIn } from "react-native-reanimated";

import { haptico } from "@/lib/haptico";
import { cores, tipo } from "@/lib/tema";

import { Entrada } from "./Entrada";

/** Selo de sucesso no fim de um pedido: agendamento, kit, cadastro. */
export function Celebracao({ titulo, texto }: { titulo: string; texto: string }) {
  const anel = useSharedValue(0);
  useEffect(() => {
    haptico.sucesso();
    anel.value = withDelay(250, withTiming(1, { duration: 1200 }));
  }, [anel]);
  const anelEstilo = useAnimatedStyle(() => ({ transform: [{ scale: 1 + anel.value * 0.6 }], opacity: 0.45 * (1 - anel.value) }));

  return (
    <View style={estilos.celebracao} accessible accessibilityLabel={`${titulo} ${texto}`}>
      <View style={estilos.seloCaixa}>
        <Animated.View style={[estilos.anel, anelEstilo]} />
        <Animated.View entering={ZoomIn.duration(300)} style={estilos.selo}>
          <Check size={36} color={cores.sobrePrimaria} strokeWidth={3} />
        </Animated.View>
      </View>
      <Entrada style={{ alignItems: "center", gap: 2 }}>
        <Text accessibilityRole="header" style={tipo.titulo}>
          {titulo}
        </Text>
        <Text style={[tipo.corpo, { color: cores.textoSuave, textAlign: "center" }]}>{texto}</Text>
      </Entrada>
    </View>
  );
}

const estilos = StyleSheet.create({
  celebracao: { alignItems: "center", gap: 14, paddingVertical: 4 },
  seloCaixa: { width: 88, height: 88, alignItems: "center", justifyContent: "center" },
  anel: { position: "absolute", width: 88, height: 88, borderRadius: 44, backgroundColor: cores.turquesa },
  selo: { width: 76, height: 76, borderRadius: 38, backgroundColor: cores.turquesaTexto, alignItems: "center", justifyContent: "center" },
});
