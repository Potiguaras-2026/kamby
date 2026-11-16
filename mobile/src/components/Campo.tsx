import { useEffect } from "react";
import { AccessibilityInfo, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { cores, fonte, toqueMinimo } from "@/lib/tema";

type Props = TextInputProps & { rotulo: string; erro?: string };

export function Campo({ rotulo, erro, style, ...props }: Props) {
  useEffect(() => {
    if (erro) AccessibilityInfo.announceForAccessibility(`${rotulo}: ${erro}`);
  }, [erro, rotulo]);

  return (
    <View style={estilos.grupo}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <TextInput
        accessibilityLabel={rotulo}
        placeholderTextColor={cores.textoSuave}
        style={[estilos.campo, erro ? { borderColor: cores.erro } : null, style]}
        {...props}
      />
      {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: 6 },
  rotulo: { fontSize: fonte.pequeno, fontWeight: "600", color: cores.texto },
  campo: {
    minHeight: toqueMinimo,
    borderWidth: 1.5,
    borderColor: cores.borda,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: fonte.corpo,
    color: cores.texto,
    backgroundColor: cores.superficie,
  },
  erro: { fontSize: fonte.pequeno, color: cores.erro },
});
