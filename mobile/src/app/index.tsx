import { useQuery } from "@tanstack/react-query";
import { router, type Href } from "expo-router";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Botao } from "@/components/Botao";
import { ACOES } from "@/features/inicio/acoes";
import { api, chamar, lerErro } from "@/lib/api";
import { salvarTokens } from "@/lib/sessao";
import { cores, espaco, fonte, toqueMinimo } from "@/lib/tema";

function formatarData(data: string) {
  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
}

export default function TelaInicio() {
  const inicio = useQuery({
    queryKey: ["inicio"],
    queryFn: () => chamar(api.GET("/api/v1/inicio")),
    refetchInterval: 15_000,
  });

  if (inicio.isPending) {
    return (
      <SafeAreaView style={estilos.centro}>
        <ActivityIndicator size="large" color={cores.primaria} accessibilityLabel="Carregando" />
      </SafeAreaView>
    );
  }

  if (inicio.isError) {
    return (
      <SafeAreaView style={[estilos.centro, { padding: espaco.g, gap: espaco.m }]}>
        <Text style={estilos.corpo}>{lerErro(inicio.error).mensagem}</Text>
        <Botao titulo="Tentar de novo" onPress={() => inicio.refetch()} />
      </SafeAreaView>
    );
  }

  const { doadora, proxima_acao, coleta_ativa, kit_aberto, impacto, banco } = inicio.data;
  const acao = ACOES[proxima_acao];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <View style={estilos.topo}>
          <Text accessibilityRole="header" style={estilos.titulo}>
            Olá, {doadora.nome_completo.split(" ")[0]}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => salvarTokens(null)} hitSlop={12} style={estilos.sair}>
            <Text style={estilos.link}>Sair</Text>
          </Pressable>
        </View>

        <Text style={estilos.status}>{doadora.status_rotulo}</Text>
        <Text style={estilos.corpo}>{acao.texto}</Text>

        {coleta_ativa ? (
          <View style={estilos.cartao}>
            <Text style={estilos.subtitulo}>Sua coleta</Text>
            <Text style={estilos.corpo}>
              {formatarData(coleta_ativa.data)}, {coleta_ativa.janela_rotulo.toLowerCase()}
            </Text>
            <Text style={estilos.status}>{coleta_ativa.status_rotulo}</Text>
          </View>
        ) : null}

        {kit_aberto ? (
          <View style={estilos.cartao}>
            <Text style={estilos.subtitulo}>Seus frascos</Text>
            <Text style={estilos.status}>{kit_aberto.status_rotulo}</Text>
          </View>
        ) : null}

        <View style={estilos.cartao}>
          <Text style={estilos.subtitulo}>Sua doação</Text>
          <Text style={estilos.corpo}>
            {impacto.coletas
              ? `Seu leite pode alimentar até ${impacto.recem_nascidos_dia} recém-nascidos por um dia. ${(impacto.volume_total_ml / 1000).toLocaleString("pt-BR")} L em ${impacto.coletas} coletas.`
              : "Sua primeira coleta vai aparecer aqui."}
          </Text>
        </View>

        <View style={estilos.cartao}>
          <Text style={estilos.subtitulo}>{banco.nome}</Text>
          <Botao titulo="Ligar para o banco de leite" variante="secundaria" onPress={() => Linking.openURL(`tel:${banco.telefone}`)} />
        </View>
      </ScrollView>

      {acao.botao && acao.rota ? (
        <View style={estilos.rodape}>
          <Botao titulo={acao.botao} onPress={() => router.push(acao.rota as Href)} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: "center", justifyContent: "center" },
  conteudo: { padding: espaco.g, gap: espaco.m },
  topo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  titulo: { fontSize: fonte.titulo, fontWeight: "700", color: cores.texto, flexShrink: 1 },
  subtitulo: { fontSize: fonte.subtitulo, fontWeight: "600", color: cores.texto },
  corpo: { fontSize: fonte.corpo, color: cores.texto, lineHeight: 24 },
  status: { fontSize: fonte.corpo, fontWeight: "700", color: cores.primaria },
  link: { fontSize: fonte.corpo, color: cores.primaria, fontWeight: "600" },
  sair: { minHeight: toqueMinimo, justifyContent: "center" },
  cartao: { backgroundColor: cores.superficie, borderRadius: 12, padding: espaco.m, gap: espaco.p },
  rodape: { padding: espaco.m, borderTopWidth: 1, borderTopColor: cores.borda, backgroundColor: cores.fundo },
});
