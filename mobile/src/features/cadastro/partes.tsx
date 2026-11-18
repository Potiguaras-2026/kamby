import { Check, type LucideIcon } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring, ZoomIn } from "react-native-reanimated";

import { Campo } from "@/components/Campo";

import { haptico } from "@/lib/haptico";
import { cores, familia, raio, tipo, toqueMinimo } from "@/lib/tema";

const ANIMO = ["Vamos começar!", "Muito bem!", "Você está indo ótimo!", "Última etapa!"];

/** Barra de progresso que enche com mola, com uma palavra de ânimo a cada etapa. */
export function Progresso({ etapa, total }: { etapa: number; total: number }) {
  const largura = useSharedValue((etapa - 1) / total);
  useEffect(() => {
    largura.value = withSpring(etapa / total, { damping: 16, stiffness: 120, reduceMotion: ReduceMotion.System });
  }, [etapa, total, largura]);
  const preenchido = useAnimatedStyle(() => ({ width: `${largura.value * 100}%` }));

  return (
    <View style={{ gap: 8 }} accessible accessibilityRole="progressbar" accessibilityLabel={`Etapa ${etapa} de ${total}`} accessibilityValue={{ min: 0, max: total, now: etapa }}>
      <View style={estilos.progressoTopo}>
        <Text style={[tipo.legenda, { color: cores.primaria, fontFamily: familia.semi }]}>{ANIMO[Math.min(etapa - 1, ANIMO.length - 1)]}</Text>
        <Text style={[tipo.legenda, { fontSize: 13 }]}>
          {etapa} de {total}
        </Text>
      </View>
      <View style={estilos.trilho}>
        <Animated.View style={[estilos.preenchido, preenchido]}>
          <View style={estilos.brilho} />
        </Animated.View>
      </View>
    </View>
  );
}

/** Título da etapa com um ícone num círculo suave: dá cara a cada etapa sem pesar. */
export function CabecalhoEtapa({ icone: Icone, titulo, texto, tom = "rosa" }: { icone: LucideIcon; titulo: string; texto?: string; tom?: "rosa" | "turquesa" }) {
  const rosa = tom === "rosa";
  return (
    <View style={estilos.cabecalho}>
      <Animated.View entering={ZoomIn.springify().damping(12).reduceMotion(ReduceMotion.System)} style={[estilos.iconeEtapa, { backgroundColor: rosa ? cores.rosaSuave : cores.turquesaSuave }]}>
        <Icone size={26} color={rosa ? cores.primaria : cores.turquesaTexto} strokeWidth={2} />
      </Animated.View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text accessibilityRole="header" style={tipo.titulo}>
          {titulo}
        </Text>
        {texto ? <Text style={[tipo.legenda, { fontSize: 14, lineHeight: 20 }]}>{texto}</Text> : null}
      </View>
    </View>
  );
}

type Pergunta = { codigo: string; texto: string; ajuda: string; detalhe_se: string; detalhe_rotulo: string };

/** Uma pergunta de saúde em cartão: número, Sim/Não e, quando a resposta pede, o campo de detalhe. */
export function CartaoPergunta({
  numero,
  pergunta,
  resposta,
  detalhe,
  responder,
  detalhar,
}: {
  numero: number;
  pergunta: Pergunta;
  resposta: boolean | undefined;
  detalhe: string;
  responder: (v: boolean) => void;
  detalhar: (t: string) => void;
}) {
  const respondida = resposta !== undefined;
  const pedeDetalhe = !!pergunta.detalhe_se && resposta === (pergunta.detalhe_se === "sim");
  return (
    <View style={[estilos.pergunta, respondida && estilos.perguntaFeita]}>
      <View style={estilos.perguntaTopo}>
        <View style={[estilos.numero, respondida && { backgroundColor: cores.turquesaTexto }]}>
          {respondida ? <Check size={14} color={cores.sobrePrimaria} strokeWidth={3} /> : <Text style={estilos.numeroTexto}>{numero}</Text>}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={tipo.corpoForte}>{pergunta.texto}</Text>
          {pergunta.ajuda ? <Text style={[tipo.legenda, { fontSize: 13 }]}>{pergunta.ajuda}</Text> : null}
        </View>
      </View>
      <SimNao rotulo={pergunta.texto} esconderRotulo valor={resposta ?? null} onChange={responder} />
      {pedeDetalhe ? (
        <Animated.View entering={FadeIn.duration(200)}>
          <Campo rotulo={pergunta.detalhe_rotulo || "Conte um pouco mais"} opcional placeholder="Escreva aqui" multiline value={detalhe} onChangeText={detalhar} />
        </Animated.View>
      ) : null}
    </View>
  );
}

/** Sim/Não lado a lado. `null` é ainda sem resposta. */
export function SimNao({ rotulo, valor, onChange, erro, esconderRotulo }: { rotulo: string; valor: boolean | null; onChange: (v: boolean) => void; erro?: string; esconderRotulo?: boolean }) {
  return (
    <View style={{ gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={rotulo}>
      {esconderRotulo ? null : <Text style={estilos.rotulo}>{rotulo}</Text>}
      <View style={estilos.linha}>
        {[true, false].map((opcao) => {
          const marcado = valor === opcao;
          return (
            <Pressable
              key={String(opcao)}
              accessibilityRole="radio"
              accessibilityState={{ checked: marcado }}
              accessibilityLabel={opcao ? "Sim" : "Não"}
              onPress={() => {
                haptico.selecao();
                onChange(opcao);
              }}
              style={[estilos.opcao, marcado && estilos.opcaoMarcada]}
            >
              {marcado ? <Check size={18} color={cores.sobrePrimaria} strokeWidth={3} /> : null}
              <Text style={[estilos.opcaoTexto, marcado && { color: cores.sobrePrimaria }]}>{opcao ? "Sim" : "Não"}</Text>
            </Pressable>
          );
        })}
      </View>
      {erro ? <Text style={[tipo.legenda, { color: cores.erro }]}>{erro}</Text> : null}
    </View>
  );
}

export function Concordo({ texto, marcado, onChange, erro }: { texto: string; marcado: boolean; onChange: (v: boolean) => void; erro?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={texto}
        accessibilityState={{ checked: marcado }}
        onPress={() => {
          haptico.selecao();
          onChange(!marcado);
        }}
        style={[estilos.concordo, erro ? { borderColor: cores.erro } : null]}
      >
        <View style={[estilos.caixa, marcado && estilos.caixaMarcada]}>{marcado ? <Check size={16} color={cores.sobrePrimaria} strokeWidth={3} /> : null}</View>
        <Text style={[tipo.corpo, { flex: 1 }]}>{texto}</Text>
      </Pressable>
      {erro ? <Text style={[tipo.legenda, { color: cores.erro }]}>{erro}</Text> : null}
    </View>
  );
}

/** Corpo de texto do admin: linha em branco separa blocos; num bloco com várias linhas, a primeira é o título. */
export function TextoLongo({ corpo }: { corpo: string }) {
  return (
    <View style={{ gap: 14 }}>
      {corpo.split(/\n\s*\n/).map((bloco) => {
        const [primeira, ...resto] = bloco.trim().split("\n");
        return (
          <View key={bloco} style={{ gap: 4 }}>
            {resto.length ? <Text style={tipo.corpoForte}>{primeira}</Text> : null}
            <Text style={tipo.corpo}>{resto.length ? resto.join("\n") : primeira}</Text>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  progressoTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  trilho: { height: 12, borderRadius: 6, backgroundColor: cores.rosaSuave, borderWidth: 1, borderColor: cores.borda, overflow: "hidden" },
  preenchido: { height: "100%", borderRadius: 6, backgroundColor: cores.primaria, justifyContent: "flex-start", paddingHorizontal: 6, paddingTop: 2.5 },
  // Faixa clara no alto da barra, como um reflexo: a barra parece "cheia", não só pintada.
  brilho: { height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.35)" },
  cabecalho: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconeEtapa: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  pergunta: { gap: 12, padding: 16, borderRadius: raio.g, borderWidth: 1.5, borderColor: cores.borda, backgroundColor: cores.superficie },
  perguntaFeita: { borderColor: cores.bordaTurquesa },
  perguntaTopo: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  numero: { width: 26, height: 26, borderRadius: 13, backgroundColor: cores.primaria, alignItems: "center", justifyContent: "center", marginTop: 1 },
  numeroTexto: { fontFamily: familia.semi, fontSize: 13, color: cores.sobrePrimaria },
  rotulo: { fontFamily: familia.medio, fontSize: 13, color: cores.texto },
  linha: { flexDirection: "row", gap: 12 },
  opcao: {
    flex: 1,
    minHeight: toqueMinimo + 4,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: raio.m,
    borderWidth: 1.5,
    borderColor: cores.borda,
    backgroundColor: cores.rosaSuave,
  },
  opcaoMarcada: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  opcaoTexto: { fontFamily: familia.semi, fontSize: 15, color: cores.primaria },
  concordo: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 14,
    minHeight: toqueMinimo,
    borderRadius: raio.g,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.rosaSuave,
  },
  caixa: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: cores.bordaCampo, alignItems: "center", justifyContent: "center" },
  caixaMarcada: { backgroundColor: cores.primaria, borderColor: cores.primaria },
});
