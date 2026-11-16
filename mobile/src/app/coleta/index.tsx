import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Check } from "lucide-react-native";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Image, Linking, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming, ZoomIn } from "react-native-reanimated";

import { Botao } from "@/components/Botao";
import { Cartao } from "@/components/Cartao";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Folha } from "@/components/Folha";
import { Pressavel } from "@/components/Pressavel";
import { Tela } from "@/components/Tela";
import { ETAPAS, indiceEtapa } from "@/features/coleta/etapas";
import { IMAGENS } from "@/features/conteudo/imagens";
import { api, chamar, lerErro } from "@/lib/api";
import { useInicio } from "@/lib/consultas";
import { diaRelativo } from "@/lib/formato";
import { haptico } from "@/lib/haptico";
import { cores, familia, raio, tipo, toqueMinimo } from "@/lib/tema";

export default function TelaColeta() {
  const { nova } = useLocalSearchParams<{ nova?: string }>();
  const inicio = useInicio();
  const queryClient = useQueryClient();
  const [confirmando, setConfirmando] = useState(false);
  const coleta = inicio.data?.coleta_ativa;

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
      <Tela voltar titulo="Sua coleta">
        <Estado erro={inicio.error} tentarDeNovo={() => inicio.refetch()} />
      </Tela>
    );
  }

  if (!coleta) {
    return (
      <Tela voltar titulo="Sua coleta" subtitulo="Você não tem coleta marcada agora.">
        <Botao titulo="Voltar ao início" onPress={() => router.replace("/")} />
      </Tela>
    );
  }

  const atual = indiceEtapa(coleta.status);
  const podeCancelar = coleta.status === "agendada" || coleta.status === "confirmada";

  return (
    <Tela voltar titulo={nova ? undefined : "Sua coleta"} atualizar={{ atualizando: inicio.isRefetching, aoAtualizar: () => inicio.refetch() }}>
      {nova ? <Celebracao /> : null}

      <Entrada ordem={1}>
        <Cartao tom="turquesa" style={{ gap: 2 }}>
          <Text style={tipo.legenda}>Dia da coleta</Text>
          <Text style={[tipo.titulo, { color: cores.turquesaTexto }]}>{diaRelativo(coleta.data)}</Text>
          <Text style={tipo.corpo}>
            Das {coleta.horario_rotulo.replace(" - ", " às ")} · {coleta.quantidade_frascos} {coleta.quantidade_frascos === 1 ? "frasco" : "frascos"}
          </Text>
        </Cartao>
      </Entrada>

      <Entrada ordem={2}>
        <Cartao>
          {ETAPAS.map((etapa, i) => {
            const feita = i < atual;
            const agora = i === atual;
            const ultima = i === ETAPAS.length - 1;
            return (
              <View
                key={etapa.status}
                style={estilos.etapa}
                accessible
                accessibilityLabel={`${etapa.rotulo}: ${feita ? "concluída" : agora ? "etapa atual" : "pendente"}`}
              >
                <View style={{ alignItems: "center" }}>
                  <View style={[estilos.ponto, (feita || agora) && estilos.pontoFeito]}>
                    {feita || agora ? <Check size={12} color={cores.sobrePrimaria} strokeWidth={3.2} /> : null}
                  </View>
                  {!ultima ? <View style={[estilos.linha, feita && { backgroundColor: cores.turquesaTexto }]} /> : null}
                </View>
                <View style={[{ flex: 1, gap: 2 }, !ultima && { paddingBottom: 18 }]}>
                  <Text style={[tipo.corpoForte, !feita && !agora && { color: cores.textoSuave, fontFamily: familia.regular }, agora && { color: cores.turquesaTexto }]}>
                    {etapa.rotulo}
                  </Text>
                  {agora ? <Text style={tipo.legenda}>{etapa.detalhe}</Text> : null}
                </View>
              </View>
            );
          })}
        </Cartao>
      </Entrada>

      <Entrada ordem={3}>
        <View style={estilos.foto}>
          <Image source={IMAGENS.bancoFrascos} style={estilos.fotoImagem} resizeMode="cover" accessibilityIgnoresInvertColors />
          <View style={estilos.fotoTexto}>
            <Text style={tipo.corpoForte}>Até a equipe chegar</Text>
            <Text style={tipo.legenda}>Mantenha os frascos fechados no congelador. Esta tela atualiza sozinha.</Text>
          </View>
        </View>
      </Entrada>

      <Entrada ordem={4} style={{ gap: 4 }}>
        <Botao titulo="Ligar para o banco de leite" variante="secundaria" onPress={() => Linking.openURL(`tel:${inicio.data.banco.telefone}`)} />
        {podeCancelar ? (
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
        aoConfirmar={() => cancelar.mutate(String(coleta.id))}
      />
    </Tela>
  );
}

function Celebracao() {
  const anel = useSharedValue(0);
  useEffect(() => {
    haptico.sucesso();
    anel.value = withDelay(250, withTiming(1, { duration: 1200 }));
  }, [anel]);
  const anelEstilo = useAnimatedStyle(() => ({ transform: [{ scale: 1 + anel.value * 0.6 }], opacity: 0.45 * (1 - anel.value) }));

  return (
    <View style={estilos.celebracao} accessible accessibilityLabel="Coleta agendada">
      <View style={estilos.seloCaixa}>
        <Animated.View style={[estilos.anel, anelEstilo]} />
        <Animated.View entering={ZoomIn.duration(300)} style={estilos.selo}>
          <Check size={36} color={cores.sobrePrimaria} strokeWidth={3} />
        </Animated.View>
      </View>
      <Entrada style={{ alignItems: "center", gap: 2 }}>
        <Text accessibilityRole="header" style={tipo.titulo}>
          Coleta agendada!
        </Text>
        <Text style={[tipo.corpo, { color: cores.textoSuave, textAlign: "center" }]}>Obrigada por doar. Acompanhe cada etapa por aqui.</Text>
      </Entrada>
    </View>
  );
}

const estilos = StyleSheet.create({
  etapa: { flexDirection: "row", gap: 14 },
  ponto: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: cores.bordaCampo,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  pontoFeito: { backgroundColor: cores.turquesaTexto, borderColor: cores.turquesaTexto },
  linha: { flex: 1, width: 1.5, minHeight: 14, backgroundColor: cores.linha, marginVertical: 4 },
  foto: { backgroundColor: cores.superficie, borderRadius: raio.g, borderWidth: 1, borderColor: cores.borda, overflow: "hidden" },
  fotoImagem: { width: "100%", height: 140 },
  fotoTexto: { padding: 16, gap: 2 },
  cancelar: { minHeight: toqueMinimo, alignItems: "center", justifyContent: "center" },
  celebracao: { alignItems: "center", gap: 14, paddingVertical: 4 },
  seloCaixa: { width: 88, height: 88, alignItems: "center", justifyContent: "center" },
  anel: { position: "absolute", width: 88, height: 88, borderRadius: 44, backgroundColor: cores.turquesa },
  selo: { width: 76, height: 76, borderRadius: 38, backgroundColor: cores.turquesaTexto, alignItems: "center", justifyContent: "center" },
});
