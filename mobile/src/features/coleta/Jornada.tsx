import type { Schemas } from "@kamby/api";
import { Check } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming, ZoomIn } from "react-native-reanimated";

import { Cartao } from "@/components/Cartao";
import { cores, familia, tipo } from "@/lib/tema";

type Etapa = Schemas["EtapaSaida"];

const quando = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "") +
  " • " +
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const etapaAtual = (jornada: Etapa[]) => {
  const i = jornada.findIndex((e) => e.estado === "atual");
  return i === -1 ? null : { numero: i + 1, etapa: jornada[i] };
};

/** Linha do tempo de uma coleta, do pedido à entrega no banco. Status com ícone e texto, nunca só cor. */
export function Jornada({ etapas }: { etapas: Etapa[] }) {
  return (
    <Cartao>
      {etapas.map((etapa, i) => {
        const feita = etapa.estado === "feita";
        const agora = etapa.estado === "atual";
        const ultima = i === etapas.length - 1;
        return (
          <View
            key={etapa.codigo}
            style={estilos.etapa}
            accessible
            accessibilityLabel={`${etapa.rotulo}: ${feita ? "concluída" : agora ? "etapa atual" : "pendente"}${etapa.data ? `, ${quando(etapa.data)}` : ""}`}
          >
            <View style={{ alignItems: "center" }}>
              {/* key com o estado: quando a etapa muda, o ponto remonta e anima a entrada. */}
              <Animated.View key={etapa.estado} entering={ZoomIn.springify().damping(12).reduceMotion(ReduceMotion.System)} style={[estilos.ponto, feita && estilos.pontoFeito, agora && estilos.pontoAgora]}>
                {agora ? <Pulso /> : null}
                {feita ? <Check size={12} color={cores.sobrePrimaria} strokeWidth={3.2} /> : agora ? <View style={estilos.miolo} /> : null}
              </Animated.View>
              {!ultima ? <View style={[estilos.linha, feita && { backgroundColor: cores.turquesaTexto }]} /> : null}
            </View>
            <View style={[{ flex: 1, gap: 2 }, !ultima && { paddingBottom: 16 }]}>
              <View style={estilos.topo}>
                <Text style={[tipo.corpoForte, { flex: 1 }, !feita && !agora && estilos.pendente, agora && { color: cores.primaria }]}>{etapa.rotulo}</Text>
                {agora ? <Text style={estilos.agora}>Agora</Text> : null}
              </View>
              {etapa.data && (feita || agora) ? <Text style={[tipo.legenda, { fontSize: 13 }]}>{quando(etapa.data)}</Text> : null}
              {agora || (feita && ultima) ? <Text style={tipo.legenda}>{etapa.detalhe}</Text> : null}
            </View>
          </View>
        );
      })}
    </Cartao>
  );
}

/** Anel que se expande em volta da etapa atual: "está acontecendo agora". */
function Pulso() {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withRepeat(withTiming(1, { duration: 1500 }), -1, false, undefined, ReduceMotion.System);
  }, [v]);
  const estilo = useAnimatedStyle(() => ({ transform: [{ scale: 1 + v.value * 0.8 }], opacity: 0.5 * (1 - v.value) }));
  return <Animated.View style={[estilos.pulso, estilo]} />;
}

const estilos = StyleSheet.create({
  pulso: { position: "absolute", width: 22, height: 22, borderRadius: 11, backgroundColor: cores.rosa },
  etapa: { flexDirection: "row", gap: 14 },
  topo: { flexDirection: "row", alignItems: "center", gap: 8 },
  ponto: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: cores.bordaCampo,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  pontoFeito: { backgroundColor: cores.turquesaTexto, borderColor: cores.turquesaTexto },
  pontoAgora: { borderColor: cores.primaria, borderWidth: 2 },
  miolo: { width: 10, height: 10, borderRadius: 5, backgroundColor: cores.primaria },
  linha: { flex: 1, width: 1.5, minHeight: 14, backgroundColor: cores.linha, marginVertical: 4 },
  pendente: { color: cores.textoSuave, fontFamily: familia.regular },
  agora: {
    fontFamily: familia.semi,
    fontSize: 11,
    color: cores.primaria,
    backgroundColor: cores.rosaSuave,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: "hidden",
    textTransform: "uppercase",
  },
});
