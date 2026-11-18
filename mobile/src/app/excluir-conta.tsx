import { useMutation } from "@tanstack/react-query";
import { LockKeyhole, TriangleAlert } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Botao } from "@/components/Botao";
import { Campo } from "@/components/Campo";
import { Cartao } from "@/components/Cartao";
import { Entrada } from "@/components/Entrada";
import { Tela } from "@/components/Tela";
import { api, chamar, lerErro } from "@/lib/api";
import { salvarTokens } from "@/lib/sessao";
import { cores, familia, tipo } from "@/lib/tema";

/** Excluir de verdade: some a conta e tudo que a mãe informou. A senha evita exclusão por engano ou com o celular de outra pessoa. */
export default function TelaExcluirConta() {
  const [senha, setSenha] = useState("");
  const excluir = useMutation({
    mutationFn: () => chamar(api.POST("/api/v1/eu/excluir", { body: { senha } })),
    onSuccess: () => salvarTokens(null),
  });
  const erro = excluir.error ? lerErro(excluir.error) : null;

  return (
    <Tela voltar titulo="Excluir minha conta">
      <Entrada ordem={1}>
        <Cartao tom="rosa" style={{ gap: 10 }}>
          <View style={estilos.topo}>
            <TriangleAlert size={22} color={cores.erro} />
            <Text style={[tipo.corpoForte, { flex: 1, color: cores.erro, fontFamily: familia.semi }]}>Essa ação não pode ser desfeita</Text>
          </View>
          <Text style={tipo.corpo}>
            Vamos apagar seu cadastro, endereços, respostas de saúde, pedidos de kit e o histórico de coletas. Coletas marcadas deixam de acontecer.
          </Text>
          <Text style={tipo.legenda}>Se quiser só fazer uma pausa nas doações, não precisa excluir: basta não agendar novas coletas.</Text>
        </Cartao>
      </Entrada>
      <Entrada ordem={2} style={{ gap: 14 }}>
        <Campo
          rotulo="Digite sua senha para confirmar"
          icone={LockKeyhole}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          erro={erro?.campos.senha?.[0] ?? (erro ? erro.mensagem : undefined)}
        />
        <Botao titulo="Excluir minha conta" variante="perigo" desabilitado={!senha} carregando={excluir.isPending} onPress={() => excluir.mutate()} />
      </Entrada>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: { flexDirection: "row", alignItems: "center", gap: 8 },
});
