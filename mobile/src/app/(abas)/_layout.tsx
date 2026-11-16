import { LinearGradient } from "expo-linear-gradient";
import { Tabs, type BottomTabBarProps } from "expo-router/tabs";
import { House, Lightbulb, UserRound, type LucideIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { haptico } from "@/lib/haptico";
import { cores, familia, sombra, toqueMinimo } from "@/lib/tema";

const ABAS: Record<string, { rotulo: string; icone: LucideIcon }> = {
  index: { rotulo: "Início", icone: House },
  dicas: { rotulo: "Dicas", icone: Lightbulb },
  perfil: { rotulo: "Perfil", icone: UserRound },
};

export default function LayoutAbas() {
  return (
    <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: cores.fundo } }} tabBar={(p) => <BarraAbas {...p} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="dicas" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}

// Rótulo visível: ajuda quem não reconhece o ícone.
function BarraAbas({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const [largura, setLargura] = useState(0);
  const pedaco = largura / state.routes.length;
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withTiming(state.index * pedaco, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [state.index, pedaco, x]);
  const indicador = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={[estilos.area, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      {/* Conteúdo branco rolando por trás some num degradê do fundo: a barra não se mistura com os cartões. */}
      <LinearGradient colors={["rgba(255,248,251,0)", "rgba(255,248,251,0.92)", cores.fundo]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={[estilos.pilula, sombra.media]} accessibilityRole="tablist" onLayout={(e) => setLargura(e.nativeEvent.layout.width - 12)}>
        {largura ? <Animated.View style={[estilos.indicador, { width: pedaco }, indicador]} /> : null}
        {state.routes.map((rota, i) => {
          const aba = ABAS[rota.name];
          const ativa = state.index === i;
          return (
            <Pressable
              key={rota.key}
              accessibilityRole="tab"
              accessibilityLabel={aba.rotulo}
              accessibilityState={{ selected: ativa }}
              onPress={() => {
                const evento = emitter.emit({ type: "tabPress", target: rota.key, canPreventDefault: true });
                if (!ativa && !evento.defaultPrevented) {
                  haptico.selecao();
                  navigateToTab(rota.key);
                }
              }}
              style={estilos.aba}
            >
              <IconeAba icone={aba.icone} ativa={ativa} />
              <Text style={[estilos.rotulo, ativa && estilos.rotuloAtivo]}>{aba.rotulo}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function IconeAba({ icone: Icone, ativa }: { icone: LucideIcon; ativa: boolean }) {
  return <Icone size={22} color={ativa ? cores.turquesaTexto : cores.textoSuave} strokeWidth={ativa ? 2.2 : 1.8} />;
}

const estilos = StyleSheet.create({
  area: { position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 36, paddingHorizontal: 24 },
  pilula: {
    flexDirection: "row",
    backgroundColor: cores.superficie,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: cores.rosaClaro,
    padding: 6,
  },
  indicador: { position: "absolute", top: 6, bottom: 6, left: 6, borderRadius: 999, backgroundColor: cores.turquesaSuave },
  aba: { flex: 1, minHeight: toqueMinimo + 8, alignItems: "center", justifyContent: "center", gap: 2 },
  rotulo: { fontFamily: familia.medio, fontSize: 11, color: cores.textoSuave },
  rotuloAtivo: { fontFamily: familia.semi, color: cores.turquesaTexto },
});
