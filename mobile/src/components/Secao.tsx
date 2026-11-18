import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { cores, familia, tipo } from "@/lib/tema";

/** Grupo de uma lista (ex.: "Em andamento", "Anteriores") com a contagem no título. */
export function Secao({ titulo, vazio, children }: { titulo: string; vazio?: string; children: ReactNode[] }) {
  return (
    <View style={{ gap: 10 }}>
      <Text accessibilityRole="header" style={estilos.titulo}>
        {titulo} ({children.length})
      </Text>
      {children.length ? children : vazio ? <Text style={tipo.legenda}>{vazio}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  titulo: { fontFamily: familia.semi, fontSize: 13, color: cores.textoSuave, textTransform: "uppercase", letterSpacing: 0.6 },
});
