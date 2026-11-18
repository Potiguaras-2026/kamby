import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, Image, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { Botao } from "@/components/Botao";
import { Contador } from "@/components/Contador";
import { Entrada } from "@/components/Entrada";
import { Pressavel } from "@/components/Pressavel";
import { Tela } from "@/components/Tela";
import { DiaHorario, useHorarios } from "@/features/coleta/DiaHorario";
import { IMAGENS } from "@/features/conteudo/imagens";
import { api, chamar, lerErro } from "@/lib/api";
import { useInicio } from "@/lib/consultas";
import { haptico } from "@/lib/haptico";
import { diaCurto, diaRelativo } from "@/lib/formato";
import { cores, familia, raio, tipo } from "@/lib/tema";

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

  const pedir = useMutation({
    // Cada kit tem um frasco, então a quantidade de kits é a de frascos.
    mutationFn: () => chamar(api.POST("/api/v1/kits", { body: { quantidade_frascos: kits, data: data!, horario_id: horario! } })),
    onSuccess: async (kit) => {
      haptico.sucesso();
      await queryClient.invalidateQueries({ queryKey: ["inicio"] });
      await queryClient.invalidateQueries({ queryKey: ["kits"] });
      AccessibilityInfo.announceForAccessibility("Pedido de kit enviado.");
      router.replace({ pathname: "/pedidos/[id]", params: { id: String(kit.id), nova: "1" } });
    },
    onError: () => haptico.aviso(),
  });
  const erro = pedir.error ? lerErro(pedir.error) : null;

  return (
    <Tela voltar titulo="Solicitar kit" subtitulo="O kit contém luva, touca, etiqueta e recipiente de vidro esterilizado.">
      <ItensDoKit />
      {aberto ? (
        <Pressavel accessibilityRole="link" onPress={() => router.push("/pedidos")} style={estilos.aviso}>
          <Text style={[tipo.legenda, { flex: 1, color: cores.texto }]}>
            Você já tem um pedido: {aberto.status_rotulo.toLowerCase()}
            {aberto.data_entrega ? `, entrega ${diaRelativo(aberto.data_entrega).toLowerCase()}` : ""}.
          </Text>
          <Text style={estilos.avisoLink}>Ver pedidos</Text>
        </Pressavel>
      ) : null}
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
  aviso: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: raio.g, backgroundColor: cores.rosaSuave, borderWidth: 1, borderColor: cores.rosaClaro },
  avisoLink: { fontFamily: familia.semi, fontSize: 13, color: cores.primaria },
});
