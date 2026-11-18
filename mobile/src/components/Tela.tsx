import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useEu } from "@/lib/consultas";
import { cores, espaco, familia, sombra, tipo, toqueMinimo } from "@/lib/tema";

import { Avatar } from "./Avatar";
import { Entrada } from "./Entrada";
import { Fundo } from "./Fundo";
import { Logo } from "./Marca";
import { Pressavel } from "./Pressavel";

type Props = {
  titulo?: string;
  subtitulo?: string;
  /** Botão voltar e título centralizado. */
  voltar?: boolean;
  /** Telas das abas: a barra de abas flutua sobre o conteúdo. */
  comAbas?: boolean;
  atualizar?: { atualizando: boolean; aoAtualizar: () => void };
  /** Troca o voltar padrão, ex.: etapa anterior de um fluxo. */
  aoVoltar?: () => void;
  /** Antes do login: sem avatar nem busca do perfil. */
  publica?: boolean;
  children: ReactNode;
};

function voltarOuInicio() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

export function Tela({ titulo, subtitulo, voltar, comAbas, atualizar, aoVoltar, publica, children }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const voltarPara = aoVoltar ?? voltarOuInicio;

  return (
    <View style={estilos.raiz}>
      <Fundo />
      <Cabecalho topo={top} publica={publica} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[estilos.conteudo, { paddingBottom: (comAbas ? 112 : espaco.gg) + bottom }]}
        refreshControl={
          atualizar ? (
            <RefreshControl refreshing={atualizar.atualizando} onRefresh={atualizar.aoAtualizar} tintColor={cores.primaria} colors={[cores.primaria]} />
          ) : undefined
        }
      >
        {titulo ? (
          <Entrada style={estilos.topo}>
            <View style={estilos.linhaTitulo}>
              {voltar ? (
                <Pressavel accessibilityRole="button" accessibilityLabel="Voltar" onPress={voltarPara} escala={0.9} style={estilos.voltar}>
                  <View style={estilos.voltarCirculo}>
                    <ArrowLeft size={18} color={cores.sobrePrimaria} strokeWidth={2.4} />
                  </View>
                </Pressavel>
              ) : null}
              <Text accessibilityRole="header" style={[tipo.titulo, estilos.titulo, voltar && estilos.centro]}>
                {titulo}
              </Text>
              {voltar ? <View style={estilos.voltar} /> : null}
            </View>
            {subtitulo ? <Text style={[tipo.corpo, voltar && estilos.centro, { paddingHorizontal: voltar ? 8 : 0 }]}>{subtitulo}</Text> : null}
          </Entrada>
        ) : voltar ? (
          <Pressavel accessibilityRole="button" accessibilityLabel="Voltar" onPress={voltarPara} escala={0.9} style={estilos.voltar}>
            <View style={estilos.voltarCirculo}>
              <ArrowLeft size={18} color={cores.sobrePrimaria} strokeWidth={2.4} />
            </View>
          </Pressavel>
        ) : null}
        {children}
      </ScrollView>
    </View>
  );
}

function Cabecalho({ topo, publica }: { topo: number; publica?: boolean }) {
  const marca = (
    <>
      <Logo largura={96} />
      <View style={estilos.divisor} />
      <Text style={estilos.maes}>Mães</Text>
    </>
  );
  return (
    <View style={[estilos.cabecalho, { paddingTop: topo + 6 }]}>
      {publica ? (
        <View style={estilos.marca}>{marca}</View>
      ) : (
        <Pressavel accessibilityRole="button" accessibilityLabel="Kamby, ir para o início" onPress={() => router.navigate("/")} escala={0.96} style={[estilos.marca, { minHeight: toqueMinimo }]}>
          {marca}
        </Pressavel>
      )}
      {publica ? <View style={estilos.toque} /> : <BotaoPerfil />}
    </View>
  );
}

function BotaoPerfil() {
  const eu = useEu();
  return (
    <Pressavel accessibilityRole="button" accessibilityLabel="Abrir meu perfil" onPress={() => router.navigate("/perfil")} escala={0.92} style={estilos.toque}>
      <Avatar nome={eu.data?.nome_completo} tamanho={38} />
    </Pressavel>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 24,
    paddingRight: 14,
    paddingBottom: 8,
    backgroundColor: cores.superficie,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomWidth: 1,
    borderColor: cores.rosaClaro,
    zIndex: 1,
    ...sombra.suave,
  },
  marca: { flexDirection: "row", alignItems: "center", gap: 10 },
  divisor: { width: 1, height: 20, backgroundColor: cores.rosaClaro },
  maes: { fontFamily: familia.regular, fontSize: 15, color: cores.primaria },
  toque: { width: toqueMinimo, height: toqueMinimo, alignItems: "center", justifyContent: "center" },
  conteudo: { paddingHorizontal: 20, paddingTop: 22, gap: 16 },
  topo: { gap: 6, marginBottom: 4 },
  linhaTitulo: { flexDirection: "row", alignItems: "center" },
  titulo: { flex: 1 },
  centro: { textAlign: "center" },
  voltar: { width: toqueMinimo, height: toqueMinimo, justifyContent: "center", marginLeft: -6 },
  voltarCirculo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    // Rosa mais claro que o da marca, como no Figma: o voltar não compete com o título.
    backgroundColor: "rgba(229, 77, 170, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
});
