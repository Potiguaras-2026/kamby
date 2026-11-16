import { StyleSheet, Text, View } from "react-native";

import { lerErro } from "@/lib/api";
import { tipo } from "@/lib/tema";

import { Botao } from "./Botao";
import { EsqueletoTela } from "./Esqueleto";

export function Estado({ erro, tentarDeNovo }: { erro?: unknown; tentarDeNovo?: () => void }) {
  if (!erro) return <EsqueletoTela />;
  return (
    <View style={estilos.centro}>
      <Text accessibilityRole="alert" style={[tipo.corpo, { textAlign: "center" }]}>
        {lerErro(erro).mensagem}
      </Text>
      {tentarDeNovo ? <Botao titulo="Tentar de novo" variante="secundaria" compacto onPress={tentarDeNovo} /> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: { paddingVertical: 48, alignItems: "center", gap: 16 },
});
