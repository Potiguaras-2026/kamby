import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, StyleSheet, Text } from "react-native";

import { cores, familia, gradiente, raio, sombra, toqueMinimo } from "@/lib/tema";

import { Pressavel } from "./Pressavel";

type Variante = "primaria" | "secundaria" | "suave" | "perigo";

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  carregando?: boolean;
  desabilitado?: boolean;
  compacto?: boolean;
};

const COR_TEXTO: Record<Variante, string> = {
  primaria: cores.sobrePrimaria,
  secundaria: cores.primaria,
  suave: cores.primaria,
  perigo: cores.erro,
};

export function Botao({ titulo, onPress, variante = "primaria", carregando, desabilitado, compacto }: Props) {
  const inativo = desabilitado || carregando;
  const corTexto = desabilitado ? cores.textoSuave : COR_TEXTO[variante];
  const comGradiente = variante === "primaria" && !desabilitado;

  return (
    <Pressavel
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: inativo, busy: carregando }}
      disabled={inativo}
      onPress={onPress}
      style={[
        estilos.base,
        compacto && estilos.compacto,
        comGradiente && sombra.botao,
        variante === "secundaria" && estilos.secundaria,
        variante === "suave" && { backgroundColor: cores.rosaSuave },
        variante === "perigo" && { backgroundColor: cores.erroSuave },
        desabilitado && { backgroundColor: cores.desabilitado, borderColor: cores.desabilitado },
      ]}
    >
      {comGradiente ? (
        <LinearGradient
          colors={gradiente.primaria}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: raio.pilula }]}
        />
      ) : null}
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <Text style={[estilos.texto, { color: corTexto }, compacto && { fontSize: 15 }]}>{titulo}</Text>
      )}
    </Pressavel>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: raio.pilula,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  compacto: { minHeight: toqueMinimo, paddingHorizontal: 18 },
  secundaria: { backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.rosaClaro },
  texto: { fontFamily: familia.semi, fontSize: 16, letterSpacing: 0.1 },
});
