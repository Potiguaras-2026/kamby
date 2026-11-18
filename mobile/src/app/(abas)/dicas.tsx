import { router } from "expo-router";
import { Search, X } from "lucide-react-native";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { Schemas } from "@kamby/api";

import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Pressavel } from "@/components/Pressavel";
import { Tela } from "@/components/Tela";
import { AtalhosGuias } from "@/features/conteudo/AtalhosGuias";
import { imagem } from "@/features/conteudo/imagens";
import { useDicas, useGuias } from "@/lib/consultas";
import { cores, familia, raio, tipo, toqueMinimo } from "@/lib/tema";

type Dica = Schemas["DicaSaida"];

// shortcut: notícias, vídeos e blog do Figma precisam de conteúdo de verdade e de quem o mantenha.

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function TelaDicas() {
  const [busca, setBusca] = useState("");
  const dicas = useDicas();
  const { data: guias } = useGuias();
  const termo = normalizar(busca.trim());

  if (!dicas.data) {
    return (
      <Tela comAbas titulo="Dicas e informações">
        <Estado erro={dicas.error} tentarDeNovo={() => dicas.refetch()} />
      </Tela>
    );
  }

  const encontradas = dicas.data.filter((d) => normalizar(`${d.titulo} ${d.resumo} ${d.paragrafos.join(" ")}`).includes(termo));
  const rapidas = dicas.data.filter((d) => d.secao === "rapidas");
  const leia = dicas.data.filter((d) => d.secao === "leia");
  const destaque = guias?.find((g) => g.destaque);

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
            encontradas.map((d) => <LinhaDica key={d.slug} dica={d} />)
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

          {destaque ? (
            <Entrada ordem={3} style={{ gap: 10 }}>
              <Text accessibilityRole="header" style={estilos.secao}>
                Em destaque
              </Text>
              <Artigo
                tag="Guia"
                titulo={destaque.titulo}
                resumo={destaque.resumo ?? ""}
                imagem={imagem(destaque.imagem)}
                onPress={() => router.push({ pathname: "/guia/[tema]", params: { tema: destaque.slug } })}
              />
            </Entrada>
          ) : null}

          {rapidas.length ? (
          <Entrada ordem={4} style={{ gap: 10 }}>
            <Text accessibilityRole="header" style={estilos.secao}>
              Dicas rápidas
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.faixa} style={{ marginHorizontal: -20 }}>
              {rapidas.map((d) => (
                <Pressavel
                  key={d.slug}
                  accessibilityRole="button"
                  accessibilityLabel={`${d.titulo}. ${d.resumo}`}
                  onPress={() => router.push({ pathname: "/dica/[id]", params: { id: d.slug } })}
                  style={estilos.rapida}
                >
                  <Image source={imagem(d.imagem)} style={estilos.rapidaImagem} resizeMode="cover" accessibilityIgnoresInvertColors />
                  <Text style={[tipo.corpoForte, { marginTop: 8 }]}>{d.titulo}</Text>
                  <Text style={[tipo.legenda, { fontSize: 12, lineHeight: 16, fontStyle: "italic" }]}>{d.resumo}</Text>
                </Pressavel>
              ))}
            </ScrollView>
          </Entrada>
          ) : null}

          {leia.length ? (
            <Entrada ordem={5} style={{ gap: 10 }}>
              <Text accessibilityRole="header" style={estilos.secao}>
                Leia também
              </Text>
              {leia.map((d) => (
                <LinhaDica key={d.slug} dica={d} />
              ))}
            </Entrada>
          ) : null}
        </>
      )}
    </Tela>
  );
}

function Artigo({ tag, titulo, resumo, imagem, onPress }: { tag: string; titulo: string; resumo: string; imagem?: number; onPress: () => void }) {
  return (
    <Pressavel accessibilityRole="button" accessibilityLabel={`${titulo}. ${resumo}`} onPress={onPress} style={estilos.artigo}>
      {imagem ? <Image source={imagem} style={estilos.artigoImagem} resizeMode="cover" accessibilityIgnoresInvertColors /> : null}
      <View style={estilos.artigoTexto}>
        <Text style={estilos.tag}>{tag}</Text>
        <Text style={tipo.subtitulo}>{titulo}</Text>
        <Text style={tipo.legenda}>{resumo}</Text>
      </View>
    </Pressavel>
  );
}

function LinhaDica({ dica: d }: { dica: Dica }) {
  return (
    <Pressavel accessibilityRole="button" accessibilityLabel={`${d.titulo}. ${d.resumo}`} onPress={() => router.push({ pathname: "/dica/[id]", params: { id: d.slug } })} style={estilos.linha}>
      <Image source={imagem(d.imagem)} style={estilos.linhaImagem} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[tipo.corpoForte, { lineHeight: 22 }]}>{d.titulo}</Text>
        <Text style={[tipo.legenda, { fontSize: 13, lineHeight: 18 }]}>{d.resumo}</Text>
      </View>
    </Pressavel>
  );
}

const estilos = StyleSheet.create({
  secao: { fontFamily: familia.medio, fontSize: 15, color: cores.texto },
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
