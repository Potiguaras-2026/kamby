import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { LockKeyhole, Phone } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { Botao } from "@/components/Botao";
import { Campo } from "@/components/Campo";
import { Logo } from "@/components/Marca";
import { api, chamar, lerErro } from "@/lib/api";
import { mascaraTelefone } from "@/lib/formato";
import { haptico } from "@/lib/haptico";
import { salvarTokens } from "@/lib/sessao";
import { cores, espaco, familia, gradiente, tipo } from "@/lib/tema";

export default function TelaEntrar() {
  const { top, bottom } = useSafeAreaInsets();
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const entrar = useMutation({
    mutationFn: () => chamar(api.POST("/api/v1/auth/entrar", { body: { telefone, senha } })),
    onSuccess: (tokens) => {
      haptico.sucesso();
      salvarTokens(tokens);
    },
    onError: () => haptico.aviso(),
  });
  const erro = entrar.error ? lerErro(entrar.error) : null;
  const pronto = telefone.replace(/\D/g, "").length >= 10 && senha.length > 0;

  return (
    <View style={estilos.raiz}>
      <LinearGradient colors={gradiente.marca} style={StyleSheet.absoluteFill} />
      <Ondas />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
          <Animated.View entering={FadeIn.duration(400)} style={[estilos.marca, { paddingTop: top + 48 }]}>
            <Logo largura={150} branca />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(350)} style={[estilos.folha, { paddingBottom: bottom + espaco.g }]}>
            <Animated.View entering={FadeIn.delay(300)} style={{ gap: 4 }}>
              <Text accessibilityRole="header" style={tipo.titulo}>
                Que bom ter você aqui
              </Text>
              <Text style={[tipo.corpo, { color: cores.textoSuave }]}>Entre para acompanhar suas doações.</Text>
            </Animated.View>
            <Campo
              rotulo="Telefone com DDD"
              icone={Phone}
              value={telefone}
              onChangeText={(v) => setTelefone(mascaraTelefone(v))}
              placeholder="(84) 91234-5678"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              erro={erro?.campos.telefone?.[0]}
            />
            <Campo
              rotulo="Senha"
              icone={LockKeyhole}
              placeholder="Digite sua senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              textContentType="password"
              autoComplete="current-password"
              returnKeyType="go"
              onSubmitEditing={() => pronto && entrar.mutate()}
              erro={erro?.campos.senha?.[0]}
            />
            {erro && !Object.keys(erro.campos).length ? (
              <Text accessibilityRole="alert" style={[tipo.legenda, { color: cores.erro }]}>
                {erro.mensagem}
              </Text>
            ) : null}
            <Botao titulo="Entrar" desabilitado={!pronto} onPress={() => entrar.mutate()} carregando={entrar.isPending} />
            <Text style={[tipo.legenda, { textAlign: "center" }]}>
              Ainda não tem conta?{" "}
              <Text accessibilityRole="link" onPress={() => router.push("/cadastro")} style={{ color: cores.primaria, fontFamily: familia.semi }}>
                Quero ser doadora
              </Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Ondas() {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 860" preserveAspectRatio="xMidYMin slice" pointerEvents="none">
      <Path d="M0 0H400V40C330 20 250 120 160 150C90 172 40 175 0 190Z" fill="#FFFFFF" opacity={0.18} />
      <Path d="M0 380C70 360 140 400 210 470C280 540 340 580 400 580V860H0Z" fill="#000000" opacity={0.12} />
    </Svg>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.splash },
  marca: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: espaco.gg, minHeight: 240 },
  folha: {
    backgroundColor: cores.fundo,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: espaco.g,
    paddingTop: 28,
    gap: espaco.m,
  },
});
