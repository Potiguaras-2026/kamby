import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";

import { Botao } from "@/components/Botao";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Tela } from "@/components/Tela";
import { imagem } from "@/features/conteudo/imagens";
import { api, chamar } from "@/lib/api";
import { raio, tipo } from "@/lib/tema";

export default function TelaDica() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dica = useQuery({
    queryKey: ["dicas", id],
    queryFn: () => chamar(api.GET("/api/v1/conteudo/dicas/{slug}", { params: { path: { slug: id } } })),
    staleTime: 10 * 60_000,
  });

  if (dica.error && (dica.error as { codigo?: string }).codigo === "nao_encontrado") {
    return (
      <Tela voltar titulo="Dica não encontrada">
        <Botao titulo="Voltar" onPress={() => router.back()} />
      </Tela>
    );
  }
  if (!dica.data) {
    return (
      <Tela voltar>
        <Estado erro={dica.error} tentarDeNovo={() => dica.refetch()} />
      </Tela>
    );
  }

  const foto = imagem(dica.data.imagem);
  return (
    <Tela voltar titulo={dica.data.titulo} subtitulo={dica.data.resumo}>
      {foto ? (
        <Entrada ordem={1}>
          <Image source={foto} style={estilos.imagem} resizeMode="cover" accessibilityIgnoresInvertColors />
        </Entrada>
      ) : null}
      <Entrada ordem={2} style={{ gap: 14 }}>
        {dica.data.paragrafos.map((p) => (
          <Text key={p} style={tipo.corpo}>
            {p}
          </Text>
        ))}
      </Entrada>
      <View style={{ height: 8 }} />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  imagem: { width: "100%", height: 220, borderRadius: raio.g },
});
