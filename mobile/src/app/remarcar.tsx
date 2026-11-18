import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, Text } from "react-native";

import { Botao } from "@/components/Botao";
import { Entrada } from "@/components/Entrada";
import { Tela } from "@/components/Tela";
import { DiaHorario, useHorarios } from "@/features/coleta/DiaHorario";
import { api, chamar, lerErro } from "@/lib/api";
import { diaCurto } from "@/lib/formato";
import { haptico } from "@/lib/haptico";
import { cores, tipo } from "@/lib/tema";

/** Novo dia e horário para uma coleta (antes de a equipe sair) ou para a entrega de um kit (antes de entregue). */
export default function TelaRemarcar() {
  const { tipo: qual, id } = useLocalSearchParams<{ tipo: "coleta" | "kit"; id: string }>();
  const coleta = qual === "coleta";
  const [data, setData] = useState<string | null>(null);
  const [horario, setHorario] = useState<string | null>(null);
  const escolhido = useHorarios().data?.find((h) => h.id === horario);
  const queryClient = useQueryClient();

  const remarcar = useMutation({
    // Coleta e kit voltam com formatos diferentes; aqui só importa guardar no cache de cada um.
    mutationFn: (): Promise<unknown> => {
      const body = { data: data!, horario_id: horario! };
      return coleta
        ? chamar(api.POST("/api/v1/coletas/{coleta_id}/remarcar", { params: { path: { coleta_id: id } }, body }))
        : chamar(api.POST("/api/v1/kits/{kit_id}/remarcar", { params: { path: { kit_id: id } }, body }));
    },
    onSuccess: (novo) => {
      haptico.sucesso();
      queryClient.setQueryData([qual, id], novo);
      queryClient.invalidateQueries({ queryKey: ["inicio"] });
      queryClient.invalidateQueries({ queryKey: [coleta ? "coletas" : "kits"] });
      AccessibilityInfo.announceForAccessibility("Data remarcada.");
      if (router.canGoBack()) router.back();
      else router.replace({ pathname: coleta ? "/coleta/[id]" : "/pedidos/[id]", params: { id } });
    },
    onError: () => haptico.aviso(),
  });
  const erro = remarcar.error ? lerErro(remarcar.error) : null;

  return (
    <Tela
      voltar
      titulo={coleta ? "Remarcar coleta" : "Remarcar entrega do kit"}
      subtitulo={coleta ? "O banco de leite confirma o novo dia com você." : "A equipe entrega no novo dia e horário."}
    >
      <DiaHorario de={coleta ? "da coleta" : "da entrega"} data={data} horario={horario} mudarData={setData} mudarHorario={setHorario} ordem={1} />
      <Entrada ordem={3} style={{ gap: 10 }}>
        {erro ? (
          <Text accessibilityRole="alert" style={[tipo.legenda, { color: cores.erro, textAlign: "center" }]}>
            {erro.mensagem}
          </Text>
        ) : null}
        <Botao
          titulo={data && escolhido ? `Remarcar para ${diaCurto(data).semana}, ${diaCurto(data).dia} · ${escolhido.rotulo}` : "Escolha o novo dia e horário"}
          desabilitado={!data || !escolhido}
          carregando={remarcar.isPending}
          onPress={() => remarcar.mutate()}
        />
      </Entrada>
    </Tela>
  );
}
