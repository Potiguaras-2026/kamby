import { Eye, EyeOff, type LucideIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { cores, familia, raio, tipo, toqueMinimo } from "@/lib/tema";

type Props = TextInputProps & { rotulo: string; erro?: string; icone?: LucideIcon };

export function Campo({ rotulo, erro, icone: Icone, secureTextEntry, onFocus, onBlur, ...props }: Props) {
  const [foco, setFoco] = useState(false);
  const [oculto, setOculto] = useState(true);

  useEffect(() => {
    if (erro) AccessibilityInfo.announceForAccessibility(`${rotulo}: ${erro}`);
  }, [erro, rotulo]);

  const corBorda = erro ? cores.erro : foco ? cores.primaria : cores.bordaCampo;

  return (
    <View style={estilos.grupo}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <View style={[estilos.caixa, { borderColor: corBorda }, foco && estilos.caixaFoco]}>
        {Icone ? <Icone size={20} color={foco ? cores.primaria : cores.textoSuave} strokeWidth={2} /> : null}
        <TextInput
          accessibilityLabel={rotulo}
          placeholderTextColor={cores.textoSuave}
          secureTextEntry={secureTextEntry && oculto}
          onFocus={(e) => {
            setFoco(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFoco(false);
            onBlur?.(e);
          }}
          style={estilos.campo}
          {...props}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={oculto ? "Mostrar senha" : "Esconder senha"}
            onPress={() => setOculto(!oculto)}
            style={estilos.olho}
          >
            {oculto ? <Eye size={20} color={cores.textoSuave} /> : <EyeOff size={20} color={cores.textoSuave} />}
          </Pressable>
        ) : null}
      </View>
      {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: 6 },
  rotulo: { fontFamily: familia.medio, fontSize: 14, color: cores.texto },
  caixa: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderRadius: raio.m,
    paddingLeft: 16,
    backgroundColor: cores.superficie,
  },
  caixaFoco: { shadowColor: cores.primaria, shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
  // outlineWidth: o navegador desenha contorno próprio; a borda da caixa já marca o foco.
  campo: { flex: 1, alignSelf: "stretch", fontFamily: familia.regular, fontSize: 16, color: cores.texto, paddingRight: 16, outlineWidth: 0 },
  olho: { width: toqueMinimo, height: toqueMinimo, alignItems: "center", justifyContent: "center" },
  erro: { ...tipo.legenda, color: cores.erro },
});
