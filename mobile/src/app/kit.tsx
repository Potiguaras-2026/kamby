import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, Image, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { Botao } from "@/components/Botao";
import { Celebracao } from "@/components/Celebracao";
import { Cartao } from "@/components/Cartao";
import { Contador } from "@/components/Contador";
import { Entrada } from "@/components/Entrada";
import { Tela } from "@/components/Tela";
import { DiaHorario, useHorarios } from "@/features/coleta/DiaHorario";
import { IMAGENS } from "@/features/conteudo/imagens";
import { api, chamar, lerErro } from "@/lib/api";
import { useInicio, useTexto } from "@/lib/consultas";
import { haptico } from "@/lib/haptico";
import { diaCurto, diaRelativo } from "@/lib/formato";
import { cores, familia, tipo } from "@/lib/tema";

const ITENS = [
  { rotulo: "Luvas", imagem: IMAGENS.kitLuva },
  { rotulo: "Touca", imagem: IMAGENS.kitTouca },
  { rotulo: "Pote de vidro", imagem: IMAGENS.kitPote },
];

function ItensDoKit() {
  return (
    <View style={estilos.itens} accessible accessibilityLabel="O kit tem luvas, touca, etiqueta e pote de vidro esterilizado">
      {ITENS.map((item, i) => (
        <Animated.View key={item.rotulo} entering={FadeIn.delay(80 + i * 60).duration(300)} style={estilos.item}>
          <Image source={item.imagem} style={estilos.itemImagem} resizeMode="contain" />
          <Text style={estilos.itemRotulo}>{item.rotulo}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

export default function TelaKit() {
  const [kits, setKits] = useState(1);
  const [data, setData] = useState<string | null>(null);
  const [horario, setHorario] = useState<string | null>(null);
  const escolhido = useHorarios().data?.find((h) => h.id === horario);
  const completo = !!data && !!escolhido;
  const queryClient = useQueryClient();
  const aberto = useInicio().data?.kit_aberto;
  const texto = useTexto();

  const pedir = useMutation({
    // Cada kit tem um frasco, então a quantidade de kits é a de frascos.
    mutationFn: () => chamar(api.POST("/api/v1/kits", { body: { quantidade_frascos: kits, data: data!, horario_id: horario! } })),
    onSuccess: async () => {
      haptico.sucesso();
      await queryClient.invalidateQueries({ queryKey: ["inicio"] });
      AccessibilityInfo.announceForAccessibility("Pedido de kit enviado.");
    },
    onError: () => haptico.aviso(),
  });
  const erro = pedir.error ? lerErro(pedir.error) : null;

  if (aberto) {
    return (
      <Tela voltar titulo={pedir.isSuccess ? undefined : "Kit a caminho"} subtitulo={pedir.isSuccess ? undefined : "A equipe do banco entrega no dia e horário que você escolheu."}>
        {pedir.isSuccess ? (
          <Celebracao
            titulo={texto("kit.resumo").titulo || "Pedido recebido!"}
            texto={texto("kit.resumo", "O banco de leite prepara seus frascos e a equipe entrega no dia marcado.").corpo}
          />
        ) : null}
        <ItensDoKit />
        <Entrada ordem={2}>
          <Cartao tom="rosa" style={{ gap: 4, alignItems: "center" }}>
            <Text style={[tipo.subtitulo, { color: cores.primaria }]}>{aberto.status_rotulo}</Text>
            {aberto.data_entrega ? (
              <Text style={tipo.corpoForte}>
                Entrega {diaRelativo(aberto.data_entrega).toLowerCase()} · {aberto.horario_rotulo}
              </Text>
            ) : null}
            <Text style={tipo.legenda}>
              {aberto.quantidade_frascos} {aberto.quantidade_frascos === 1 ? "kit pedido" : "kits pedidos"}
            </Text>
          </Cartao>
        </Entrada>
        <Botao titulo="Voltar ao início" variante="secundaria" onPress={() => router.replace("/")} />
      </Tela>
    );
  }

  return (
    <Tela voltar titulo="Solicitar kit" subtitulo="O kit contém luva, touca, etiqueta e recipiente de vidro esterilizado.">
      <ItensDoKit />
      <Entrada ordem={2}>
        <Contador rotulo="Quantidade de kits" valor={kits} min={1} max={10} onChange={setKits} />
      </Entrada>
      <DiaHorario de="da entrega" data={data} horario={horario} mudarData={setData} mudarHorario={setHorario} ordem={3} />
      <Entrada ordem={5} style={{ gap: 14 }}>
        <Text style={[tipo.legenda, { textAlign: "center" }]}>Cada kit tem um pote. A equipe entrega no endereço cadastrado.</Text>
        {erro ? (
          <Text accessibilityRole="alert" style={[tipo.legenda, { color: cores.erro, textAlign: "center" }]}>
            {erro.mensagem}
          </Text>
        ) : null}
        <Botao
          titulo={completo ? `Receber ${diaCurto(data).semana}, ${diaCurto(data).dia} · ${escolhido.rotulo}` : "Solicitar kit"}
          desabilitado={!completo}
          carregando={pedir.isPending}
          onPress={() => pedir.mutate()}
        />
        {!completo ? (
          <Text style={[tipo.legenda, { textAlign: "center", fontSize: 13 }]}>{!data ? "Escolha a data e o horário da entrega." : "Escolha o horário."}</Text>
        ) : null}
      </Entrada>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  itens: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingVertical: 8, gap: 8 },
  item: { flex: 1, alignItems: "center", gap: 8 },
  itemImagem: { width: "100%", height: 92 },
  itemRotulo: { fontFamily: familia.medio, fontSize: 13, color: cores.textoSuave },
});
