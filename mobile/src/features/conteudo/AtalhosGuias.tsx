import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { CartaoOnda } from "@/components/CartaoOnda";

import { GUIAS } from "./guias";

export function AtalhosGuias() {
  return (
    <View style={estilos.linha}>
      {Object.entries(GUIAS).map(([tema, g]) => (
        <CartaoOnda
          key={tema}
          compacto
          tom={g.tom}
          titulo={g.titulo}
          onPress={() => router.push({ pathname: "/guia/[tema]", params: { tema } })}
        />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: "row", gap: 8 },
});
