import type { Schemas } from "@kamby/api";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

import { Cartao } from "@/components/Cartao";
import { litros } from "@/lib/formato";
import { haptico } from "@/lib/haptico";
import { cores, familia, tipo } from "@/lib/tema";

const ALTURA = 112;

const nomeMes = (iso: string, formato: "narrow" | "short" | "long") =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { month: formato }).replace(".", "");

// Topo do eixo em litro cheio (ou meio litro para volumes pequenos), para as marcas lerem "1 L", "2 L".
const topoEixo = (ml: number) => (ml <= 1000 ? 1000 : Math.ceil(ml / 1000) * 1000);

export function Historico({ meses }: { meses: Schemas["MesSaida"][] }) {
  const topo = topoEixo(Math.max(...meses.map((m) => m.volume_ml)));
  const ultimo = meses.findLastIndex((m) => m.volume_ml > 0);
  const [selecionado, setSelecionado] = useState(ultimo < 0 ? meses.length - 1 : ultimo);

  if (ultimo < 0) {
    return (
      <Cartao>
        <Text style={[tipo.legenda, { textAlign: "center", paddingVertical: 28 }]}>Suas coletas dos últimos 6 meses vão aparecer aqui.</Text>
      </Cartao>
    );
  }

  const mes = meses[selecionado];
  return (
    <Cartao style={{ gap: 14 }}>
      <Text style={tipo.legenda} accessibilityLiveRegion="polite">
        <Text style={{ textTransform: "capitalize" }}>{nomeMes(mes.mes, "long")}</Text>
        {": "}
        <Text style={{ fontFamily: familia.semi, color: cores.texto }}>{mes.volume_ml ? litros(mes.volume_ml) : "sem coleta"}</Text>
      </Text>
      <View style={estilos.area}>
        <View style={estilos.eixo}>
          {[topo, topo / 2, 0].map((v) => (
            <Text key={v} style={estilos.eixoTexto}>
              {v ? litros(v) : "0"}
            </Text>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <View style={[estilos.guia, { top: 0 }]} />
          <View style={[estilos.guia, { top: ALTURA / 2 }]} />
          <View style={[estilos.guia, { top: ALTURA }]} />
          <View style={estilos.barras}>
            {meses.map((m, i) => (
              <Pressable
                key={m.mes}
                accessibilityRole="button"
                accessibilityState={{ selected: i === selecionado }}
                accessibilityLabel={`${nomeMes(m.mes, "long")}: ${m.volume_ml ? litros(m.volume_ml) : "nenhuma coleta"}`}
                onPress={() => {
                  haptico.selecao();
                  setSelecionado(i);
                }}
                style={estilos.coluna}
              >
                <View style={{ height: ALTURA, justifyContent: "flex-end" }}>
                  <Barra altura={(m.volume_ml / topo) * ALTURA} ordem={i} ativa={i === selecionado} />
                </View>
                <Text style={[estilos.mes, i === selecionado && estilos.mesAtivo]}>{nomeMes(m.mes, "short")}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Cartao>
  );
}

function Barra({ altura, ordem, ativa }: { altura: number; ordem: number; ativa: boolean }) {
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(ordem * 40, withTiming(altura, { duration: 450, easing: Easing.out(Easing.cubic) }));
  }, [altura, ordem, h]);
  const animado = useAnimatedStyle(() => ({ height: h.value }));
  return <Animated.View style={[estilos.barra, { backgroundColor: ativa ? cores.primaria : cores.rosaClaro }, animado]} />;
}

const estilos = StyleSheet.create({
  area: { flexDirection: "row", gap: 8 },
  eixo: { height: ALTURA + 8, justifyContent: "space-between", marginTop: -8, alignItems: "flex-end", width: 34 },
  eixoTexto: { fontFamily: familia.regular, fontSize: 11, color: cores.textoSuave },
  guia: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: cores.linha },
  barras: { flexDirection: "row" },
  coluna: { flex: 1, alignItems: "center", gap: 8 },
  barra: { width: 24, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  mes: { fontFamily: familia.regular, fontSize: 12, color: cores.textoSuave, textTransform: "capitalize" },
  mesAtivo: { fontFamily: familia.semi, color: cores.primaria },
});
