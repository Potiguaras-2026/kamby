import { StyleSheet, Text, View } from "react-native";

import { iniciais } from "@/lib/formato";
import { cores, familia } from "@/lib/tema";

// shortcut: sem foto de perfil ainda (a API não guarda imagem); usa as iniciais.
export function Avatar({ nome, tamanho }: { nome?: string; tamanho: number }) {
  const anel = tamanho > 60 ? 3 : 1.5;
  return (
    <View
      style={[estilos.anel, { width: tamanho, height: tamanho, borderRadius: tamanho / 2, borderWidth: anel, padding: anel }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[estilos.miolo, { borderRadius: tamanho / 2 }]}>
        <Text style={[estilos.texto, { fontSize: tamanho * 0.34 }]}>{nome ? iniciais(nome) : ""}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  anel: { borderColor: cores.rosa, backgroundColor: cores.superficie },
  miolo: { flex: 1, backgroundColor: cores.rosaSuave, alignItems: "center", justifyContent: "center" },
  texto: { fontFamily: familia.semi, color: cores.primaria },
});
