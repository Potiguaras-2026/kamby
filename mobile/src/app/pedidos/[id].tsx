import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native";

import { BotaoWhatsapp } from "@/components/BotaoWhatsapp";
import { Cartao } from "@/components/Cartao";
import { Celebracao } from "@/components/Celebracao";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Folha } from "@/components/Folha";
import { Pressavel } from "@/components/Pressavel";
import { Tela } from "@/components/Tela";
import { api, chamar, lerErro } from "@/lib/api";
import { useEu, useKit, useTexto } from "@/lib/consultas";
import { dataCompleta, entregaKit } from "@/lib/formato";
import { cores, tipo, toqueMinimo } from "@/lib/tema";

const ABERTOS = ["solicitado", "em_preparo"];

export default function TelaPedido() {
  const { id, nova } = useLocalSearchParams<{ id: string; nova?: string }>();
  const consulta = useKit(id);
  const banco = useEu().data?.banco;
  const texto = useTexto();
  const queryClient = useQueryClient();
  const [confirmando, setConfirmando] = useState(false);

  const cancelar = useMutation({
    mutationFn: () => chamar(api.POST("/api/v1/kits/{kit_id}/cancelar", { params: { path: { kit_id: id } } })),
    onSuccess: (kit) => {
      setConfirmando(false);
      queryClient.setQueryData(["kit", id], kit);
      queryClient.invalidateQueries({ queryKey: ["kits"] });
      queryClient.invalidateQueries({ queryKey: ["inicio"] });
      AccessibilityInfo.announceForAccessibility("Pedido cancelado.");
    },
  });

  const kit = consulta.data;
  if (!kit) {
    return (
      <Tela voltar titulo="Pedido de kit">
        <Estado erro={consulta.error} tentarDeNovo={() => consulta.refetch()} />
      </Tela>
    );
  }

  const aberto = ABERTOS.includes(kit.status);

  return (
    <Tela voltar titulo={nova ? undefined : "Pedido de kit"} atualizar={{ atualizando: consulta.isRefetching, aoAtualizar: () => consulta.refetch() }}>
      {nova ? (
        <Celebracao
          titulo={texto("kit.resumo").titulo || "Pedido recebido!"}
          texto={texto("kit.resumo", "O banco de leite prepara seus frascos e a equipe entrega no dia marcado.").corpo}
        />
      ) : null}

      <Entrada ordem={1}>
        <Cartao tom="rosa" style={{ gap: 12 }}>
          <Text accessibilityRole="header" style={[tipo.subtitulo, { color: cores.primaria }]}>
            {kit.status_rotulo}
          </Text>
          <Linha rotulo="Entrega" valor={kit.data_entrega ? entregaKit(kit) : "A combinar com o banco"} />
          <Linha rotulo="Quantidade" valor={`${kit.quantidade_frascos} ${kit.quantidade_frascos === 1 ? "kit" : "kits"}`} />
          <Linha rotulo="Pedido em" valor={dataCompleta(kit.criado_em)} />
          {banco ? <Linha rotulo="Banco de leite" valor={banco.nome} /> : null}
        </Cartao>
      </Entrada>

      <Entrada ordem={2} style={{ gap: 4 }}>
        {banco ? <BotaoWhatsapp telefone={banco.telefone} /> : null}
        {aberto ? (
          <Pressavel accessibilityRole="button" onPress={() => setConfirmando(true)} style={estilos.cancelar}>
            <Text style={[tipo.corpoForte, { color: cores.erro }]}>Cancelar pedido</Text>
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
        titulo="Cancelar este pedido?"
        texto="A equipe não vai entregar este kit. Você pode pedir outro quando quiser."
        confirmar="Cancelar pedido"
        manter="Manter pedido"
        carregando={cancelar.isPending}
        aoConfirmar={() => cancelar.mutate()}
      />
    </Tela>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.linha} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <Text style={tipo.legenda}>{rotulo}</Text>
      <Text style={[tipo.corpoForte, { flexShrink: 1, textAlign: "right" }]}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 12 },
  cancelar: { minHeight: toqueMinimo, alignItems: "center", justifyContent: "center" },
});
