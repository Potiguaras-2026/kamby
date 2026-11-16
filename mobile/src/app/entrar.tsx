import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Botao } from "@/components/Botao";
import { Campo } from "@/components/Campo";
import { api, chamar, lerErro } from "@/lib/api";
import { salvarTokens } from "@/lib/sessao";
import { cores, espaco, fonte } from "@/lib/tema";

export default function TelaEntrar() {
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const entrar = useMutation({
    mutationFn: () => chamar(api.POST("/api/v1/auth/entrar", { body: { telefone, senha } })),
    onSuccess: salvarTokens,
  });
  const erro = entrar.error ? lerErro(entrar.error) : null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={estilos.titulo}>
          Entrar
        </Text>
        <Campo
          rotulo="Telefone com DDD"
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          erro={erro?.campos.telefone?.[0]}
        />
        <Campo
          rotulo="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          textContentType="password"
          autoComplete="current-password"
          erro={erro?.campos.senha?.[0]}
        />
        {erro ? (
          <Text accessibilityRole="alert" style={estilos.erro}>
            {erro.mensagem}
          </Text>
        ) : null}
        <Botao titulo="Entrar" onPress={() => entrar.mutate()} carregando={entrar.isPending} />
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: espaco.g, gap: espaco.m },
  titulo: { fontSize: fonte.titulo, fontWeight: "700", color: cores.texto },
  erro: { fontSize: fonte.corpo, color: cores.erro },
});
