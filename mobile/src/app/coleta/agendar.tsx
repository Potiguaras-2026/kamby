import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, Text } from "react-native";

import { Botao } from "@/components/Botao";
import { Contador } from "@/components/Contador";
import { Entrada } from "@/components/Entrada";
import { Tela } from "@/components/Tela";
import { Concordo } from "@/features/cadastro/partes";
import { DiaHorario, useHorarios } from "@/features/coleta/DiaHorario";
import { api, chamar, lerErro } from "@/lib/api";
import { useEu, useInicio } from "@/lib/consultas";
import { diaCurto, linhaEndereco } from "@/lib/formato";
import { haptico } from "@/lib/haptico";
import { cores, familia, tipo } from "@/lib/tema";

export default function TelaAgendarColeta() {
  const [frascos, setFrascos] = useState(1);
  const [data, setData] = useState<string | null>(null);
  const [horario, setHorario] = useState<string | null>(null);
  const [comKit, setComKit] = useState(false);
  const queryClient = useQueryClient();
  const eu = useEu();
  const kitAberto = useInicio().data?.kit_aberto;
  const horarios = useHorarios();

  const agendar = useMutation({
    mutationFn: () =>
      chamar(api.POST("/api/v1/coletas", { body: { data: data!, horario_id: horario!, quantidade_frascos: frascos, com_kit: comKit && !kitAberto } })),
    onSuccess: async () => {
      haptico.sucesso();
      await queryClient.invalidateQueries({ queryKey: ["inicio"] });
      AccessibilityInfo.announceForAccessibility(comKit ? "Coleta e kit agendados." : "Coleta agendada.");
      router.replace({ pathname: "/coleta", params: { nova: comKit ? "kit" : "1" } });
    },
    onError: () => haptico.aviso(),
  });
  const erro = agendar.error ? lerErro(agendar.error) : null;
  const escolhido = horarios.data?.find((h) => h.id === horario);
  const completo = !!data && !!escolhido;

  return (
    <Tela voltar titulo="Agendar coleta" subtitulo="Os Bombeiros Amigos vão até o seu endereço cadastrado buscar os frascos.">
      <Entrada ordem={1}>
        <Contador rotulo="Quantidade de frascos" valor={frascos} min={1} max={20} onChange={setFrascos} />
      </Entrada>

      <DiaHorario de="da coleta" data={data} horario={horario} mudarData={setData} mudarHorario={setHorario} />

      {/* Com um pedido de kit em andamento a API recusa outro; aí a opção nem aparece. */}
      {!kitAberto ? (
        <Entrada ordem={4} style={{ gap: 6 }}>
          <Concordo texto="Quero receber um kit novo de frascos no mesmo dia" marcado={comKit} onChange={setComKit} />
          <Text style={[tipo.legenda, { fontSize: 13, paddingHorizontal: 4 }]}>
            A equipe leva os frascos vazios quando for buscar o leite{frascos > 10 ? " (até 10 por kit)" : ""}.
          </Text>
        </Entrada>
      ) : null}

      <Entrada ordem={5} style={{ gap: 14 }}>
        {eu.data?.endereco_ativo ? (
          <Text style={[tipo.legenda, { textAlign: "center" }]}>
            {eu.data.endereco_ativo.apelido}:{" "}
            <Text style={{ fontFamily: familia.medio, color: cores.texto }}>{linhaEndereco(eu.data.endereco_ativo)}</Text>
            {"  "}
            <Text accessibilityRole="link" onPress={() => router.push("/enderecos")} style={{ fontFamily: familia.semi, color: cores.primaria }}>
              Trocar
            </Text>
          </Text>
        ) : null}
        {erro ? (
          <Text accessibilityRole="alert" style={[tipo.legenda, { color: cores.erro, textAlign: "center" }]}>
            {erro.mensagem}
          </Text>
        ) : null}
        <Botao
          titulo={completo ? `Agendar ${diaCurto(data).semana}, ${diaCurto(data).dia} · ${escolhido.rotulo}` : "Solicitar coleta de leite"}
          desabilitado={!completo}
          carregando={agendar.isPending}
          onPress={() => agendar.mutate()}
        />
        {!completo ? (
          <Text style={[tipo.legenda, { textAlign: "center", fontSize: 13 }]}>{!data ? "Escolha a data e o horário." : "Escolha o horário."}</Text>
        ) : null}
      </Entrada>
    </Tela>
  );
}
