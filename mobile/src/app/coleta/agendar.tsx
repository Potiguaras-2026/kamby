import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { PackageCheck } from "lucide-react-native";
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native";

import { Botao } from "@/components/Botao";
import { Cartao } from "@/components/Cartao";
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
  const inicio = useInicio().data;
  // Sem nenhum kit entregue nem pedido, a primeira doação leva o kit junto: sem frascos não há o que coletar.
  const primeiroKit = inicio?.proxima_acao === "pedir_kit";
  const levarKit = primeiroKit || comKit;
  const horarios = useHorarios();

  const agendar = useMutation({
    mutationFn: () =>
      chamar(api.POST("/api/v1/coletas", { body: { data: data!, horario_id: horario!, quantidade_frascos: frascos, com_kit: levarKit } })),
    onSuccess: async (coleta) => {
      haptico.sucesso();
      await queryClient.invalidateQueries({ queryKey: ["inicio"] });
      await queryClient.invalidateQueries({ queryKey: ["coletas"] });
      AccessibilityInfo.announceForAccessibility(levarKit ? "Coleta e kit agendados." : "Coleta agendada.");
      router.replace({ pathname: "/coleta/[id]", params: { id: String(coleta.id), nova: levarKit ? "kit" : "1" } });
    },
    onError: () => haptico.aviso(),
  });
  const erro = agendar.error ? lerErro(agendar.error) : null;
  const escolhido = horarios.data?.find((h) => h.id === horario);
  const completo = !!data && !!escolhido;

  return (
    <Tela voltar titulo="Agendar coleta" subtitulo="A equipe do banco de leite busca os frascos no seu endereço cadastrado.">
      <Entrada ordem={1}>
        <Contador rotulo="Quantidade de frascos" valor={frascos} min={1} max={20} onChange={setFrascos} />
      </Entrada>

      <DiaHorario de="da coleta" data={data} horario={horario} mudarData={setData} mudarHorario={setHorario} />

      {primeiroKit ? (
        <Entrada ordem={4}>
          <Cartao tom="turquesa" style={estilos.primeiro}>
            <PackageCheck size={24} color={cores.turquesaTexto} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[tipo.corpoForte, { color: cores.turquesaTexto }]}>Seu primeiro kit vai junto</Text>
              <Text style={[tipo.legenda, { fontSize: 13 }]}>A equipe leva os frascos esterilizados nesse dia e explica como usar.</Text>
            </View>
          </Cartao>
        </Entrada>
      ) : (
        <Entrada ordem={4} style={{ gap: 6 }}>
          <Concordo texto="Quero receber um kit novo de frascos no mesmo dia" marcado={comKit} onChange={setComKit} />
          <Text style={[tipo.legenda, { fontSize: 13, paddingHorizontal: 4 }]}>
            A equipe leva os frascos vazios quando for buscar o leite{frascos > 10 ? " (até 10 por kit)" : ""}.
          </Text>
        </Entrada>
      )}

      <Entrada ordem={5} style={{ gap: 14 }}>
        {inicio ? (
          <Text style={[tipo.legenda, { textAlign: "center" }]}>
            Seu leite vai para <Text style={{ fontFamily: familia.medio, color: cores.texto }}>{inicio.banco.nome}</Text>
          </Text>
        ) : null}
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

const estilos = StyleSheet.create({
  primeiro: { flexDirection: "row", alignItems: "center", gap: 12 },
});
