import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { HeartHandshake } from "lucide-react-native";
import { useState } from "react";
import { AccessibilityInfo, Image, StyleSheet, Text, View } from "react-native";

import { BotaoWhatsapp } from "@/components/BotaoWhatsapp";
import { Cartao } from "@/components/Cartao";
import { Celebracao } from "@/components/Celebracao";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Folha } from "@/components/Folha";
import { Pressavel } from "@/components/Pressavel";
import { Tela } from "@/components/Tela";
import { etapaAtual, Jornada } from "@/features/coleta/Jornada";
import { SimularDoacao } from "@/features/coleta/SimularDoacao";
import { IMAGENS } from "@/features/conteudo/imagens";
import { api, chamar, lerErro } from "@/lib/api";
import { useInicio, useTexto } from "@/lib/consultas";
import { diaRelativo, litros } from "@/lib/formato";
import { cores, raio, tipo, toqueMinimo } from "@/lib/tema";

export default function TelaMinhaDoacao() {
  const { nova } = useLocalSearchParams<{ nova?: string }>();
  const inicio = useInicio();
  const texto = useTexto();
  const queryClient = useQueryClient();
  const [confirmando, setConfirmando] = useState(false);

  const cancelar = useMutation({
    mutationFn: (id: string) =>
      chamar(api.POST("/api/v1/coletas/{coleta_id}/cancelar", { params: { path: { coleta_id: id } }, body: { motivo: "" } })),
    onSuccess: async () => {
      setConfirmando(false);
      await queryClient.invalidateQueries({ queryKey: ["inicio"] });
      AccessibilityInfo.announceForAccessibility("Coleta cancelada.");
      router.replace("/");
    },
  });

  if (!inicio.data) {
    return (
      <Tela voltar titulo="Minha doação">
        <Estado erro={inicio.error} tentarDeNovo={() => inicio.refetch()} />
      </Tela>
    );
  }

  const { coleta_ativa: coleta, ultima_coleta: ultima, jornada, impacto, banco } = inicio.data;
  const atual = etapaAtual(jornada);
  const podeCancelar = coleta?.status === "agendada" || coleta?.status === "confirmada";
  const chegou = !!ultima?.entregue_banco_em;
  const final = texto("jornada.final");

  return (
    <Tela voltar titulo={nova ? undefined : "Minha doação"} atualizar={{ atualizando: inicio.isRefetching, aoAtualizar: () => inicio.refetch() }}>
      {nova ? <Celebracao titulo="Coleta agendada!" texto="Obrigada por doar. Acompanhe cada etapa por aqui." /> : null}

      {coleta ? (
        <Entrada ordem={1}>
          <Cartao tom="turquesa" style={{ gap: 2 }}>
            <Text style={tipo.legenda}>Dia da coleta</Text>
            <Text style={[tipo.titulo, { color: cores.turquesaTexto }]}>{diaRelativo(coleta.data)}</Text>
            <Text style={tipo.corpo}>
              Das {coleta.horario_rotulo.replace(" - ", " às ")} · {coleta.quantidade_frascos} {coleta.quantidade_frascos === 1 ? "frasco" : "frascos"}
            </Text>
          </Cartao>
        </Entrada>
      ) : null}

      {chegou && ultima ? (
        <Entrada ordem={1}>
          <Cartao tom="rosa" style={{ gap: 10 }}>
            <View style={estilos.finalTopo}>
              <HeartHandshake size={28} color={cores.primaria} />
              <Text accessibilityRole="header" style={[tipo.subtitulo, { flex: 1, color: cores.primaria }]}>
                {final.titulo || "Seu leite chegou ao banco de leite"}
              </Text>
            </View>
            {ultima.volume_ml ? (
              <Text style={tipo.corpoForte}>
                {litros(ultima.volume_ml)} doados nesta coleta · {litros(impacto.volume_total_ml)} no total
              </Text>
            ) : null}
            <Text style={tipo.corpo}>{final.corpo}</Text>
          </Cartao>
        </Entrada>
      ) : null}

      <Entrada ordem={2}>
        <SimularDoacao />
      </Entrada>

      <Entrada ordem={2} style={{ gap: 10 }}>
        <View style={estilos.cabecalhoJornada}>
          <Text accessibilityRole="header" style={tipo.subtitulo}>
            Ciclo da doação
          </Text>
          {atual ? <Text style={estilos.contador}>Etapa {atual.numero} de {jornada.length}</Text> : null}
        </View>
        <Jornada etapas={jornada} />
      </Entrada>

      {coleta ? (
        <Entrada ordem={3}>
          <View style={estilos.foto}>
            <Image source={IMAGENS.bancoFrascos} style={estilos.fotoImagem} resizeMode="cover" accessibilityIgnoresInvertColors />
            <View style={estilos.fotoTexto}>
              <Text style={tipo.corpoForte}>Até a equipe chegar</Text>
              <Text style={tipo.legenda}>Mantenha os frascos fechados no congelador. Esta tela atualiza sozinha.</Text>
            </View>
          </View>
        </Entrada>
      ) : null}

      <Entrada ordem={4} style={{ gap: 4 }}>
        <BotaoWhatsapp telefone={banco.telefone} />
        {podeCancelar && coleta ? (
          <Pressavel accessibilityRole="button" onPress={() => setConfirmando(true)} style={estilos.cancelar}>
            <Text style={[tipo.corpoForte, { color: cores.erro }]}>Cancelar coleta</Text>
          </Pressavel>
        ) : null}
        {cancelar.error ? (
          <Text accessibilityRole="alert" style={[tipo.legenda, { color: cores.erro, textAlign: "center" }]}>
            {lerErro(cancelar.error).mensagem}
          </Text>
        ) : null}
      </Entrada>

      <Folha
        visivel={confirmando}
        aoFechar={() => setConfirmando(false)}
        perigo
        titulo="Cancelar esta coleta?"
        texto="A equipe não vai passar no dia marcado. Você pode agendar de novo quando quiser."
        confirmar="Cancelar coleta"
        manter="Manter coleta"
        carregando={cancelar.isPending}
        aoConfirmar={() => coleta && cancelar.mutate(String(coleta.id))}
      />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  finalTopo: { flexDirection: "row", alignItems: "center", gap: 10 },
  cabecalhoJornada: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  contador: { ...tipo.legenda, color: cores.turquesaTexto, fontSize: 13 },
  foto: { backgroundColor: cores.superficie, borderRadius: raio.g, borderWidth: 1, borderColor: cores.borda, overflow: "hidden" },
  fotoImagem: { width: "100%", height: 140 },
  fotoTexto: { padding: 16, gap: 2 },
  cancelar: { minHeight: toqueMinimo, alignItems: "center", justifyContent: "center" },
});
