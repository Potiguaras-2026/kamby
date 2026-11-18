import { router, useLocalSearchParams } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";

import { Botao } from "@/components/Botao";
import { Cartao } from "@/components/Cartao";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Tela } from "@/components/Tela";
import { imagem } from "@/features/conteudo/imagens";
import { useGuias } from "@/lib/consultas";
import { cores, familia, raio, tipo } from "@/lib/tema";

const COR: Record<string, string> = { rosa: cores.primaria, turquesa: cores.turquesaTexto, azul: cores.azulTexto };

export default function TelaGuia() {
  const { tema } = useLocalSearchParams<{ tema: string }>();
  const guias = useGuias();

  if (!guias.data) {
    return (
      <Tela voltar>
        <Estado erro={guias.error} tentarDeNovo={() => guias.refetch()} />
      </Tela>
    );
  }

  const guia = guias.data.find((g) => g.slug === tema);
  if (!guia) {
    return (
      <Tela voltar titulo="Conteúdo não encontrado">
        <Botao titulo="Voltar ao início" onPress={() => router.replace("/")} />
      </Tela>
    );
  }

  const cor = COR[guia.tom] ?? cores.primaria;
  const foto = imagem(guia.imagem);

  return (
    <Tela voltar titulo={guia.titulo} subtitulo={guia.resumo || undefined}>
      {foto ? (
        <Entrada ordem={1}>
          <Image source={foto} style={estilos.imagem} resizeMode="cover" accessibilityIgnoresInvertColors />
        </Entrada>
      ) : null}
      <Entrada ordem={2}>
        <Cartao style={{ gap: 18 }}>
          {guia.passos.map((passo, i) => (
            <View key={passo} style={estilos.passo} accessible accessibilityLabel={`${i + 1}. ${passo}`}>
              <Text style={[estilos.numero, { color: cor }]}>{String(i + 1).padStart(2, "0")}</Text>
              <Text style={[tipo.corpo, { flex: 1 }]}>{passo}</Text>
            </View>
          ))}
        </Cartao>
      </Entrada>
      <Text style={[tipo.legenda, { textAlign: "center" }]}>Dúvidas? O banco de leite orienta você.</Text>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  imagem: { width: "100%", height: 220, borderRadius: raio.g },
  passo: { flexDirection: "row", gap: 14 },
  numero: { fontFamily: familia.semi, fontSize: 14, lineHeight: 22, width: 24 },
});
