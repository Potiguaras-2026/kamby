import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { CartaoOnda } from "@/components/CartaoOnda";
import { useGuias } from "@/lib/consultas";

export function AtalhosGuias() {
  const { data: guias } = useGuias();
  if (!guias?.length) return null;
  return (
    <View style={estilos.linha}>
      {guias.map((g) => (
        <CartaoOnda
          key={g.slug}
          compacto
          tom={g.tom as "rosa" | "turquesa" | "azul"}
          titulo={g.titulo}
          onPress={() => router.push({ pathname: "/guia/[tema]", params: { tema: g.slug } })}
        />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: "row", gap: 8 },
});
