import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, StyleSheet, Text } from "react-native";

import { Botao } from "@/components/Botao";
import { Cartao } from "@/components/Cartao";
import { Contador } from "@/components/Contador";
import { Entrada } from "@/components/Entrada";
import { Esqueleto } from "@/components/Esqueleto";
import { Estado } from "@/components/Estado";
import { Seletor, SeletorData } from "@/components/Seletores";
import { Tela } from "@/components/Tela";
import { api, chamar, lerErro } from "@/lib/api";
import { useEu } from "@/lib/consultas";
import { diaCurto, linhaEndereco } from "@/lib/formato";
import { haptico } from "@/lib/haptico";
import { cores, familia, tipo } from "@/lib/tema";

export default function TelaAgendarColeta() {
  const [frascos, setFrascos] = useState(1);
  const [data, setData] = useState<string | null>(null);
  const [horario, setHorario] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const eu = useEu();
  const dias = useQuery({ queryKey: ["dias-disponiveis"], queryFn: () => chamar(api.GET("/api/v1/coletas/dias-disponiveis")) });
  const horarios = useQuery({ queryKey: ["horarios"], queryFn: () => chamar(api.GET("/api/v1/coletas/horarios")) });

  const agendar = useMutation({
    mutationFn: () => chamar(api.POST("/api/v1/coletas", { body: { data: data!, horario_id: horario!, quantidade_frascos: frascos } })),
    onSuccess: async () => {
      haptico.sucesso();
      await queryClient.invalidateQueries({ queryKey: ["inicio"] });
      AccessibilityInfo.announceForAccessibility("Coleta agendada.");
      router.replace({ pathname: "/coleta", params: { nova: "1" } });
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

      <Entrada ordem={2}>
        <Cartao style={estilos.linha}>
          {dias.data ? (
            dias.data.length ? (
              <SeletorData rotulo="Data da coleta" dias={dias.data} selecionado={data} onChange={setData} />
            ) : (
              <Text style={tipo.legenda}>Nenhum dia disponível agora. Ligue para o banco de leite.</Text>
            )
          ) : dias.error ? (
            <Estado erro={dias.error} tentarDeNovo={() => dias.refetch()} />
          ) : (
            <Esqueleto altura={40} />
          )}
        </Cartao>
      </Entrada>

      <Entrada ordem={3}>
        <Cartao style={estilos.linha}>
          {horarios.data ? (
            horarios.data.length ? (
              <Seletor
                rotulo="Horário da coleta"
                opcoes={horarios.data.map((h) => ({ valor: h.id, rotulo: h.rotulo }))}
                selecionado={horario}
                onChange={setHorario}
              />
            ) : (
              <Text style={tipo.legenda}>O banco de leite ainda não abriu horários. Tente mais tarde ou ligue para o banco.</Text>
            )
          ) : horarios.error ? (
            <Estado erro={horarios.error} tentarDeNovo={() => horarios.refetch()} />
          ) : (
            <Esqueleto altura={40} />
          )}
        </Cartao>
      </Entrada>

      <Entrada ordem={4} style={{ gap: 14 }}>
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
  linha: { paddingVertical: 6, paddingHorizontal: 16 },
});
