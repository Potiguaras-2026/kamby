import { router } from "expo-router";
import { Search, X } from "lucide-react-native";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Entrada } from "@/components/Entrada";
import { Pressavel } from "@/components/Pressavel";
import { Tela } from "@/components/Tela";
import { AtalhosGuias } from "@/features/conteudo/AtalhosGuias";
import { DICAS, type IdDica } from "@/features/conteudo/dicas";
import { IMAGENS } from "@/features/conteudo/imagens";
import { cores, familia, raio, tipo, toqueMinimo } from "@/lib/tema";

// shortcut: notícias, vídeos e blog do Figma precisam de conteúdo de verdade e de quem o mantenha.
const RAPIDAS: IdDica[] = ["higiene", "armazenamento", "frascos"];

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function TelaDicas() {
  const [busca, setBusca] = useState("");
  const termo = normalizar(busca.trim());
  const encontradas = (Object.keys(DICAS) as IdDica[]).filter((id) =>
    normalizar(`${DICAS[id].titulo} ${DICAS[id].resumo} ${DICAS[id].texto.join(" ")}`).includes(termo),
  );

  return (
    <Tela comAbas titulo="Dicas e informações">
      <Entrada ordem={1}>
        <View style={estilos.busca}>
          <Search size={20} color={cores.textoSuave} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por..."
            placeholderTextColor={cores.textoSuave}
            accessibilityLabel="Buscar dicas"
            returnKeyType="search"
            style={estilos.buscaCampo}
          />
          {busca ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setBusca("")} style={estilos.limpar}>
              <X size={18} color={cores.textoSuave} />
            </Pressable>
          ) : null}
        </View>
      </Entrada>

      {termo ? (
        <View style={{ gap: 10 }}>
          {encontradas.length ? (
            encontradas.map((id) => <LinhaDica key={id} id={id} />)
          ) : (
            <Text style={tipo.legenda} accessibilityLiveRegion="polite">
              Nada encontrado para “{busca}”.
            </Text>
          )}
        </View>
      ) : (
        <>
          <Entrada ordem={2}>
            <AtalhosGuias />
          </Entrada>

          <Entrada ordem={3} style={{ gap: 10 }}>
            <Text accessibilityRole="header" style={estilos.secao}>
              Em destaque
            </Text>
            <Artigo
              tag="Guia"
              titulo="Como retirar o leite em casa"
              resumo="O passo a passo, do preparo até guardar no congelador."
              imagem={IMAGENS.retirada}
              onPress={() => router.push({ pathname: "/guia/[tema]", params: { tema: "passo-a-passo" } })}
            />
          </Entrada>

          <Entrada ordem={4} style={{ gap: 10 }}>
            <Text accessibilityRole="header" style={estilos.secao}>
              Dicas rápidas
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.faixa} style={{ marginHorizontal: -20 }}>
              {RAPIDAS.map((id) => (
                <Pressavel
                  key={id}
                  accessibilityRole="button"
                  accessibilityLabel={`${DICAS[id].titulo}. ${DICAS[id].resumo}`}
                  onPress={() => router.push({ pathname: "/dica/[id]", params: { id } })}
                  style={estilos.rapida}
                >
                  <Image source={DICAS[id].imagem} style={estilos.rapidaImagem} resizeMode="cover" accessibilityIgnoresInvertColors />
                  <Text style={[tipo.corpoForte, { marginTop: 8 }]}>{DICAS[id].titulo}</Text>
                  <Text style={[tipo.legenda, { fontSize: 12, lineHeight: 16, fontStyle: "italic" }]}>{DICAS[id].resumo}</Text>
                </Pressavel>
              ))}
            </ScrollView>
          </Entrada>

          <Entrada ordem={5} style={{ gap: 10 }}>
            <Text accessibilityRole="header" style={estilos.secao}>
              Leia também
            </Text>
            <LinhaDica id="destino" tag="Impacto" />
          </Entrada>
        </>
      )}
    </Tela>
  );
}

function Artigo({ tag, titulo, resumo, imagem, onPress }: { tag: string; titulo: string; resumo: string; imagem: number; onPress: () => void }) {
  return (
    <Pressavel accessibilityRole="button" accessibilityLabel={`${titulo}. ${resumo}`} onPress={onPress} style={estilos.artigo}>
      <Image source={imagem} style={estilos.artigoImagem} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View style={estilos.artigoTexto}>
        <Text style={estilos.tag}>{tag}</Text>
        <Text style={tipo.subtitulo}>{titulo}</Text>
        <Text style={tipo.legenda}>{resumo}</Text>
      </View>
    </Pressavel>
  );
}

function LinhaDica({ id, tag }: { id: IdDica; tag?: string }) {
  const d = DICAS[id];
  return (
    <Pressavel accessibilityRole="button" accessibilityLabel={`${d.titulo}. ${d.resumo}`} onPress={() => router.push({ pathname: "/dica/[id]", params: { id } })} style={estilos.linha}>
      <Image source={d.imagem} style={estilos.linhaImagem} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View style={{ flex: 1, gap: 2 }}>
        {tag ? <Text style={estilos.tag}>{tag}</Text> : null}
        <Text style={[tipo.corpoForte, { lineHeight: 22 }]}>{d.titulo}</Text>
        <Text style={[tipo.legenda, { fontSize: 13, lineHeight: 18 }]}>{d.resumo}</Text>
      </View>
    </Pressavel>
  );
}

const estilos = StyleSheet.create({
  secao: { fontFamily: familia.medio, fontSize: 17, color: cores.texto },
  busca: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 16,
    borderRadius: raio.m,
    backgroundColor: cores.rosaSuave,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  buscaCampo: { flex: 1, fontFamily: familia.regular, fontSize: 16, color: cores.texto, paddingVertical: 12, outlineWidth: 0 },
  limpar: { width: toqueMinimo, height: toqueMinimo, alignItems: "center", justifyContent: "center" },
  artigo: { backgroundColor: cores.superficie, borderRadius: raio.g, borderWidth: 1, borderColor: cores.borda, overflow: "hidden" },
  artigoImagem: { width: "100%", height: 176 },
  artigoTexto: { padding: 16, gap: 4 },
  tag: { fontFamily: familia.semi, fontSize: 12, color: cores.primaria },
  faixa: { gap: 12, paddingHorizontal: 20 },
  rapida: { width: 150 },
  rapidaImagem: { width: 150, height: 112, borderRadius: raio.m },
  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: cores.superficie,
    borderRadius: raio.m,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: 10,
  },
  linhaImagem: { width: 84, height: 84, borderRadius: raio.m },
});
