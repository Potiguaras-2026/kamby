import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { CalendarClock, HeartHandshake, Hospital } from "lucide-react-native";
import { useState } from "react";
import { AccessibilityInfo, Image, StyleSheet, Text, View } from "react-native";

import { Botao } from "@/components/Botao";
import { BotaoWhatsapp } from "@/components/BotaoWhatsapp";
import { Cartao } from "@/components/Cartao";
import { Celebracao } from "@/components/Celebracao";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Folha } from "@/components/Folha";
import { Pressavel } from "@/components/Pressavel";
import { Tela } from "@/components/Tela";
import { etapaAtual, Jornada } from "@/features/coleta/Jornada";
import { podeMudar } from "@/features/coleta/CartaoColeta";
import { SimularDoacao } from "@/features/coleta/SimularDoacao";
import { IMAGENS } from "@/features/conteudo/imagens";
import { api, chamar, lerErro } from "@/lib/api";
import { useColeta, useTexto } from "@/lib/consultas";
import { diaRelativo, litros } from "@/lib/formato";
import { cores, raio, tipo, toqueMinimo } from "@/lib/tema";

const ATIVAS = ["agendada", "confirmada", "a_caminho"];

export default function TelaColeta() {
  const { id, nova } = useLocalSearchParams<{ id: string; nova?: string }>();
  const consulta = useColeta(id);
  const texto = useTexto();
  const queryClient = useQueryClient();
  const [confirmando, setConfirmando] = useState(false);

  const cancelar = useMutation({
    mutationFn: () => chamar(api.POST("/api/v1/coletas/{coleta_id}/cancelar", { params: { path: { coleta_id: id } }, body: { motivo: "" } })),
    onSuccess: async () => {
      setConfirmando(false);
      await queryClient.invalidateQueries({ queryKey: ["inicio"] });
      await queryClient.invalidateQueries({ queryKey: ["coletas"] });
      AccessibilityInfo.announceForAccessibility("Coleta cancelada.");
      router.replace("/");
    },
  });

  const coleta = consulta.data;
  if (!coleta) {
    return (
      <Tela voltar titulo="Minha doação">
        <Estado erro={consulta.error} tentarDeNovo={() => consulta.refetch()} />
      </Tela>
    );
  }

  const atual = etapaAtual(coleta.etapas);
  const ativa = ATIVAS.includes(coleta.status);
  const podeCancelar = podeMudar(coleta);
  const final = texto("jornada.final");

  return (
    <Tela voltar titulo={nova ? undefined : "Minha doação"} atualizar={{ atualizando: consulta.isRefetching, aoAtualizar: () => consulta.refetch() }}>
      {nova ? (
        <Celebracao
          titulo="Coleta agendada!"
          texto={nova === "kit" ? "A equipe leva seu kit novo no mesmo dia. Acompanhe cada etapa por aqui." : "Obrigada por doar. Acompanhe cada etapa por aqui."}
        />
      ) : null}

      <Entrada ordem={1}>
        <Cartao tom="turquesa" style={{ gap: 2 }}>
          <Text style={tipo.legenda}>Dia da coleta</Text>
          <Text style={[tipo.titulo, { color: cores.turquesaTexto }]}>{diaRelativo(coleta.data)}</Text>
          <Text style={tipo.corpo}>
            Das {coleta.horario_rotulo.replace(" - ", " às ")} · {coleta.quantidade_frascos} {coleta.quantidade_frascos === 1 ? "frasco" : "frascos"}
          </Text>
          <View style={estilos.banco}>
            <Hospital size={18} color={cores.turquesaTexto} />
            <Text style={[tipo.legenda, { flex: 1 }]}>
              Seu leite vai para <Text style={tipo.corpoForte}>{coleta.banco_nome}</Text>
            </Text>
          </View>
        </Cartao>
      </Entrada>

      {coleta.entregue_banco_em ? (
        <Entrada ordem={1}>
          <Cartao tom="rosa" style={{ gap: 10 }}>
            <View style={estilos.finalTopo}>
              <HeartHandshake size={28} color={cores.primaria} />
              <Text accessibilityRole="header" style={[tipo.subtitulo, { flex: 1, color: cores.primaria }]}>
                {final.titulo || "Seu leite chegou ao banco de leite"}
              </Text>
            </View>
            {coleta.volume_ml ? <Text style={tipo.corpoForte}>{litros(coleta.volume_ml)} doados nesta coleta</Text> : null}
            <Text style={tipo.corpo}>{final.corpo}</Text>
          </Cartao>
        </Entrada>
      ) : null}

      <Entrada ordem={2}>
        <SimularDoacao coleta={coleta} />
      </Entrada>

      <Entrada ordem={2} style={{ gap: 10 }}>
        <View style={estilos.cabecalhoJornada}>
          <Text accessibilityRole="header" style={tipo.subtitulo}>
            Status da doação
          </Text>
          {coleta.status === "cancelada" || coleta.status === "ausente" ? (
            <Text style={estilos.contador}>{coleta.status_rotulo}</Text>
          ) : atual ? (
            <Text style={estilos.contador}>Etapa {atual.numero} de {coleta.etapas.length}</Text>
          ) : null}
        </View>
        <Jornada etapas={coleta.etapas} />
      </Entrada>

      {ativa ? (
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

      <Entrada ordem={4} style={{ gap: 10 }}>
        {podeCancelar ? (
          <Botao titulo="Remarcar coleta" icone={CalendarClock} variante="secundaria" onPress={() => router.push({ pathname: "/remarcar", params: { tipo: "coleta", id } })} />
        ) : null}
        <BotaoWhatsapp telefone={coleta.banco_telefone} banco={coleta.banco_nome} />
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
        aoConfirmar={() => cancelar.mutate()}
      />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  banco: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  finalTopo: { flexDirection: "row", alignItems: "center", gap: 10 },
  cabecalhoJornada: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  contador: { ...tipo.legenda, color: cores.turquesaTexto, fontSize: 13 },
  foto: { backgroundColor: cores.superficie, borderRadius: raio.g, borderWidth: 1, borderColor: cores.borda, overflow: "hidden" },
  fotoImagem: { width: "100%", height: 140 },
  fotoTexto: { padding: 16, gap: 2 },
  // Borda vermelha discreta: dá para achar, mas não chama mais atenção que remarcar.
  cancelar: { minHeight: toqueMinimo, alignItems: "center", justifyContent: "center", borderRadius: raio.pilula, borderWidth: 1, borderColor: "#EBC2BE" },
});
