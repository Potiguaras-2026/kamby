import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { cores, fonte, toqueMinimo } from "@/lib/tema";

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: "primaria" | "secundaria";
  carregando?: boolean;
  desabilitado?: boolean;
};

export function Botao({ titulo, onPress, variante = "primaria", carregando, desabilitado }: Props) {
  const primaria = variante === "primaria";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: desabilitado || carregando, busy: carregando }}
      disabled={desabilitado || carregando}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.base,
        primaria ? estilos.primaria : estilos.secundaria,
        (pressed || desabilitado) && { opacity: 0.7 },
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={primaria ? cores.sobrePrimaria : cores.primaria} />
      ) : (
        <Text style={[estilos.texto, { color: primaria ? cores.sobrePrimaria : cores.primaria }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: toqueMinimo + 8,
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  primaria: { backgroundColor: cores.primaria },
  secundaria: { borderWidth: 2, borderColor: cores.primaria, backgroundColor: cores.superficie },
  texto: { fontSize: fonte.corpo, fontWeight: "600" },
});
