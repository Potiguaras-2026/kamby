import { router, useLocalSearchParams } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";

import { Botao } from "@/components/Botao";
import { Entrada } from "@/components/Entrada";
import { Tela } from "@/components/Tela";
import { DICAS, type IdDica } from "@/features/conteudo/dicas";
import { raio, tipo } from "@/lib/tema";

export default function TelaDica() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dica = DICAS[id as IdDica];

  if (!dica) {
    return (
      <Tela voltar titulo="Dica não encontrada">
        <Botao titulo="Voltar" onPress={() => router.back()} />
      </Tela>
    );
  }

  return (
    <Tela voltar titulo={dica.titulo} subtitulo={dica.resumo}>
      <Entrada ordem={1}>
        <Image source={dica.imagem} style={estilos.imagem} resizeMode="cover" accessibilityIgnoresInvertColors />
      </Entrada>
      <Entrada ordem={2} style={{ gap: 14 }}>
        {dica.texto.map((p) => (
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
