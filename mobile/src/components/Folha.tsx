import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cores, espaco, raio, tipo } from "@/lib/tema";

import { Botao } from "./Botao";

type Props = {
  visivel: boolean;
  aoFechar: () => void;
  titulo: string;
  texto: string;
  confirmar: string;
  manter: string;
  aoConfirmar: () => void;
  perigo?: boolean;
  carregando?: boolean;
};

function BaseFolha({ visivel, aoFechar, rotuloFechar, children }: { visivel: boolean; aoFechar: () => void; rotuloFechar: string; children: ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <Modal visible={visivel} transparent animationType="none" onRequestClose={aoFechar} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(200)} style={estilos.veu}>
        <Pressable style={StyleSheet.absoluteFill} onPress={aoFechar} accessibilityLabel={rotuloFechar} accessibilityRole="button" />
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(260)} style={[estilos.folha, { paddingBottom: espaco.g + bottom }]} accessibilityViewIsModal>
        <View style={estilos.alca} />
        {children}
      </Animated.View>
    </Modal>
  );
}

export function Folha({ visivel, aoFechar, titulo, texto, confirmar, manter, aoConfirmar, perigo, carregando }: Props) {
  return (
    <BaseFolha visivel={visivel} aoFechar={aoFechar} rotuloFechar={manter}>
      <Text accessibilityRole="header" style={[tipo.subtitulo, { textAlign: "center" }]}>
        {titulo}
      </Text>
      <Text style={[tipo.legenda, { textAlign: "center", fontSize: 15, lineHeight: 22 }]}>{texto}</Text>
      <View style={estilos.botoes}>
        <Botao titulo={confirmar} variante={perigo ? "perigo" : "primaria"} carregando={carregando} onPress={aoConfirmar} />
        <Botao titulo={manter} variante="secundaria" onPress={aoFechar} />
      </View>
    </BaseFolha>
  );
}

type Acao = { rotulo: string; icone: LucideIcon; onPress: () => void; perigo?: boolean };

export function MenuAcoes({ visivel, aoFechar, titulo, subtitulo, acoes }: { visivel: boolean; aoFechar: () => void; titulo: string; subtitulo?: string; acoes: Acao[] }) {
  return (
    <BaseFolha visivel={visivel} aoFechar={aoFechar} rotuloFechar="Fechar">
      <View style={{ alignSelf: "stretch", gap: 2 }}>
        <Text accessibilityRole="header" style={tipo.subtitulo}>
          {titulo}
        </Text>
        {subtitulo ? <Text style={tipo.legenda}>{subtitulo}</Text> : null}
      </View>
      <View style={estilos.acoes}>
        {acoes.map(({ rotulo, icone: Icone, onPress, perigo }, i) => (
          <Pressable
            key={rotulo}
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => [estilos.acao, i > 0 && estilos.acaoDivisoria, pressed && { backgroundColor: cores.rosaSuave }]}
          >
            <Icone size={20} color={perigo ? cores.erro : cores.primaria} strokeWidth={1.8} />
            <Text style={[tipo.corpo, { color: perigo ? cores.erro : cores.texto }]}>{rotulo}</Text>
          </Pressable>
        ))}
      </View>
      <View style={estilos.botoes}>
        <Botao titulo="Fechar" variante="secundaria" onPress={aoFechar} />
      </View>
    </BaseFolha>
  );
}

const estilos = StyleSheet.create({
  veu: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(36, 27, 34, 0.4)" },
  folha: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    // Na web o app fica numa moldura de celular; a folha acompanha a largura dela.
    width: "100%",
    maxWidth: 440,
    marginHorizontal: "auto",
    backgroundColor: cores.superficie,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: espaco.g,
    paddingTop: 12,
    alignItems: "center",
    gap: 12,
  },
  alca: { width: 40, height: 5, borderRadius: 3, backgroundColor: cores.linha, marginBottom: 8 },
  botoes: { alignSelf: "stretch", gap: 10, marginTop: 8 },
  acoes: { alignSelf: "stretch", borderRadius: raio.g, borderWidth: 1, borderColor: cores.borda, overflow: "hidden" },
  acao: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  acaoDivisoria: { borderTopWidth: 1, borderTopColor: cores.borda },
});
