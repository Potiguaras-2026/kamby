import { CircleAlert, CircleCheck, Eye, EyeOff, type LucideIcon } from "lucide-react-native";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { AccessibilityInfo, ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { cores, familia, raio, tipo, toqueMinimo } from "@/lib/tema";

export type PropsCampo = TextInputProps & {
  rotulo: string;
  /** Texto de apoio abaixo do campo. Some quando há erro, que ocupa o lugar. */
  ajuda?: string;
  erro?: string;
  icone?: LucideIcon;
  opcional?: boolean;
  carregando?: boolean;
  /** Mostra o visto verde: o valor foi conferido (ex.: CEP encontrado). */
  valido?: boolean;
};

/** Campo padrão do app: rótulo em cima, exemplo no placeholder, ajuda e erro embaixo. */
export function Campo({ rotulo, ajuda, erro, icone: Icone, opcional, carregando, valido, secureTextEntry, onFocus, onBlur, editable = true, ...props }: PropsCampo) {
  const [foco, setFoco] = useState(false);
  const [oculto, setOculto] = useState(true);
  const interno = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (erro) AccessibilityInfo.announceForAccessibility(`${rotulo}: ${erro}`);
  }, [erro, rotulo]);

  const corBorda = erro ? cores.erro : foco ? cores.primaria : cores.bordaCampo;
  const corIcone = erro ? cores.erro : foco ? cores.primaria : cores.textoSuave;

  return (
    <View style={estilos.grupo}>
      {/* Tocar no rótulo foca o campo, como o <label> da web. */}
      <Pressable onPress={() => interno.current?.focus()} accessible={false} style={estilos.topo}>
        <Text style={estilos.rotulo}>{rotulo}</Text>
        {opcional ? <Text style={estilos.opcional}>(opcional)</Text> : null}
      </Pressable>
      <View style={[estilos.caixa, { borderColor: corBorda }, foco && estilos.caixaFoco, erro ? estilos.caixaErro : null, !editable && estilos.caixaFixa]}>
        {Icone ? <Icone size={20} color={corIcone} strokeWidth={2} /> : null}
        <TextInput
          ref={interno}
          accessibilityLabel={opcional ? `${rotulo}, opcional` : rotulo}
          accessibilityHint={erro ?? ajuda}
          aria-invalid={!!erro}
          placeholderTextColor="#9A8F96"
          secureTextEntry={secureTextEntry && oculto}
          editable={editable}
          onFocus={(e) => {
            setFoco(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFoco(false);
            onBlur?.(e);
          }}
          style={[estilos.campo, props.multiline && estilos.multilinha]}
          {...props}
        />
        {carregando ? <ActivityIndicator color={cores.primaria} style={estilos.lado} /> : null}
        {!carregando && valido && !erro ? <CircleCheck size={20} color={cores.turquesaTexto} style={estilos.lado} /> : null}
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
      {erro ? (
        <View style={estilos.linhaErro}>
          <CircleAlert size={16} color={cores.erro} />
          <Text style={estilos.erro}>{erro}</Text>
        </View>
      ) : ajuda ? (
        <Text style={estilos.ajuda}>{ajuda}</Text>
      ) : null}
    </View>
  );
}

export const estilosCampo = StyleSheet.create({
  rotulo: { fontFamily: familia.medio, fontSize: 13, lineHeight: 18, color: cores.texto },
  caixa: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderRadius: raio.g,
    paddingLeft: 14,
    backgroundColor: cores.superficie,
  },
});

const estilos = StyleSheet.create({
  grupo: { gap: 6 },
  topo: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  rotulo: estilosCampo.rotulo,
  opcional: { fontFamily: familia.regular, fontSize: 13, color: cores.textoSuave },
  caixa: estilosCampo.caixa,
  caixaFoco: {
    borderWidth: 2,
    paddingLeft: 13.5,
    // Anel rosa claro em volta, no lugar da sombra difusa: lê melhor como "campo ativo".
    boxShadow: `0 0 0 4px ${cores.rosaSuave}`,
  },
  caixaErro: { backgroundColor: cores.erroSuave },
  caixaFixa: { backgroundColor: cores.desabilitado },
  // outlineWidth: o navegador desenha contorno próprio; a borda da caixa já marca o foco.
  // minWidth 0: na web o input tem largura mínima própria e empurra a caixa para fora da tela estreita.
  campo: { flex: 1, minWidth: 0, alignSelf: "stretch", fontFamily: familia.regular, fontSize: 16, color: cores.texto, paddingRight: 14, paddingVertical: 12, outlineWidth: 0, outlineColor: "transparent" },
  multilinha: { minHeight: 88, textAlignVertical: "top" },
  lado: { marginRight: 14 },
  olho: { width: toqueMinimo, height: toqueMinimo, alignItems: "center", justifyContent: "center" },
  linhaErro: { flexDirection: "row", alignItems: "center", gap: 6 },
  erro: { ...tipo.legenda, color: cores.erro, flex: 1 },
  ajuda: { ...tipo.legenda, fontSize: 13 },
});
