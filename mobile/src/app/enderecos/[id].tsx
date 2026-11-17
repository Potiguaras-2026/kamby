import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native";

import { Botao } from "@/components/Botao";
import { Campo } from "@/components/Campo";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Tela } from "@/components/Tela";
import { CAMPOS_OBRIGATORIOS, CamposEndereco } from "@/features/enderecos/CamposEndereco";
import { api, chamar, lerErro } from "@/lib/api";
import { useEnderecos } from "@/lib/consultas";
import { mascaraCep } from "@/lib/formato";
import { haptico } from "@/lib/haptico";
import { cores, tipo } from "@/lib/tema";

const VAZIO = { apelido: "", cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "Natal", uf: "RN", referencia: "" };

type Dados = typeof VAZIO;

export default function TelaEndereco() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const novo = id === "novo";
  const enderecos = useEnderecos();
  const atual = enderecos.data?.find((e) => String(e.id) === id);

  if (!novo && !atual) {
    return (
      <Tela voltar titulo="Editar endereço">
        <Estado erro={enderecos.error ?? (enderecos.data ? { mensagem: "Endereço não encontrado." } : undefined)} tentarDeNovo={() => enderecos.refetch()} />
      </Tela>
    );
  }

  // key recria o formulário com os dados certos se a lista chegar depois.
  return <Formulario key={id} id={novo ? null : id} inicial={atual ? { ...VAZIO, ...atual, complemento: atual.complemento ?? "", referencia: atual.referencia ?? "", cep: mascaraCep(atual.cep) } : VAZIO} />;
}

function Formulario({ id, inicial }: { id: string | null; inicial: Dados }) {
  const [dados, setDados] = useState(inicial);
  const queryClient = useQueryClient();
  const mudar = (campo: keyof Dados) => (valor: string) => setDados((d) => ({ ...d, [campo]: valor }));

  const salvar = useMutation({
    mutationFn: () => {
      const body = { ...dados, apelido: dados.apelido.trim() || "Casa" };
      return id
        ? chamar(api.PUT("/api/v1/enderecos/{endereco_id}", { params: { path: { endereco_id: id } }, body }))
        : chamar(api.POST("/api/v1/enderecos", { body }));
    },
    onSuccess: async () => {
      haptico.sucesso();
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["enderecos"] }), queryClient.invalidateQueries({ queryKey: ["eu"] })]);
      AccessibilityInfo.announceForAccessibility("Endereço salvo.");
      router.back();
    },
    onError: () => haptico.aviso(),
  });
  const erro = salvar.error ? lerErro(salvar.error) : null;
  const campo = (c: keyof Dados) => erro?.campos[c]?.[0];
  const completo = CAMPOS_OBRIGATORIOS.every((c) => dados[c].trim());

  return (
    <Tela voltar titulo={id ? "Editar endereço" : "Novo endereço"}>
      <Entrada ordem={1} style={estilos.campos}>
        <Campo rotulo="Nome do endereço" placeholder="Casa, Trabalho, Casa da mãe..." value={dados.apelido} onChangeText={mudar("apelido")} erro={campo("apelido")} maxLength={40} />
        <CamposEndereco
          dados={dados}
          mudar={(c, v) => setDados((d) => ({ ...d, [c]: v }))}
          preencher={(e) => setDados((d) => ({ ...d, logradouro: e.logradouro || d.logradouro, bairro: e.bairro || d.bairro, cidade: e.cidade, uf: e.uf }))}
          erro={campo}
        />
      </Entrada>

      <Entrada ordem={2} style={{ gap: 10 }}>
        {erro && !Object.keys(erro.campos).length ? (
          <Text accessibilityRole="alert" style={[tipo.legenda, { color: cores.erro, textAlign: "center" }]}>
            {erro.mensagem}
          </Text>
        ) : null}
        <Botao titulo="Salvar endereço" desabilitado={!completo} carregando={salvar.isPending} onPress={() => salvar.mutate()} />
      </Entrada>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  campos: { gap: 14 },
});
