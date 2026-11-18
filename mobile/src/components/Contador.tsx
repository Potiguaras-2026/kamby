import { Minus, Plus, type LucideIcon } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";

import { haptico } from "@/lib/haptico";
import { cores, familia, mola, tipo, toqueMinimo } from "@/lib/tema";

import { Cartao } from "./Cartao";
import { Pressavel } from "./Pressavel";

type Props = { rotulo: string; valor: number; min: number; max: number; onChange: (valor: number) => void };

export function Contador({ rotulo, valor, min, max, onChange }: Props) {
  const anterior = useRef(valor);
  const y = useSharedValue(0);
  useEffect(() => {
    if (valor === anterior.current) return;
    y.value = withSequence(withTiming(valor > anterior.current ? -3 : 3, { duration: 60 }), withSpring(0, mola.elastica));
    anterior.current = valor;
  }, [valor, y]);
  const pulo = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  const mudar = (delta: number) => {
    const novo = Math.min(max, Math.max(min, valor + delta));
    if (novo !== valor) haptico.selecao();
    onChange(novo);
  };

  return (
    <Cartao style={estilos.cartao}>
      <View
        style={estilos.linha}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={rotulo}
        accessibilityValue={{ min, max, now: valor, text: String(valor) }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(e) => mudar(e.nativeEvent.actionName === "increment" ? 1 : -1)}
      >
        <Text style={[tipo.corpo, estilos.rotulo]}>{rotulo}</Text>
        <BotaoRedondo icone={Minus} desabilitado={valor <= min} onPress={() => mudar(-1)} />
        <View style={estilos.valorCaixa}>
          <Animated.Text style={[estilos.valor, pulo]}>{valor}</Animated.Text>
        </View>
        <BotaoRedondo icone={Plus} desabilitado={valor >= max} onPress={() => mudar(1)} />
      </View>
    </Cartao>
  );
}

function BotaoRedondo({ icone: Icone, desabilitado, onPress }: { icone: LucideIcon; desabilitado: boolean; onPress: () => void }) {
  return (
    <Pressavel onPress={onPress} disabled={desabilitado} semVibrar escala={0.85} style={estilos.toque}>
      <View style={[estilos.circulo, desabilitado && { backgroundColor: cores.desabilitado }]}>
        <Icone size={18} color={desabilitado ? cores.textoSuave : cores.sobrePrimaria} strokeWidth={2.6} />
      </View>
    </Pressavel>
  );
}

const estilos = StyleSheet.create({
  rotulo: { flex: 1, fontSize: 15, lineHeight: 22 },
  cartao: { paddingVertical: 4, paddingLeft: 16, paddingRight: 6 },
  linha: { flexDirection: "row", alignItems: "center" },
  valorCaixa: { width: 36, alignItems: "center" },
  valor: { fontFamily: familia.semi, fontSize: 16, color: cores.texto, fontVariant: ["tabular-nums"] },
  toque: { width: toqueMinimo, height: toqueMinimo + 4, alignItems: "center", justifyContent: "center" },
  circulo: { width: 30, height: 30, borderRadius: 15, backgroundColor: cores.rosa, alignItems: "center", justifyContent: "center" },
});
