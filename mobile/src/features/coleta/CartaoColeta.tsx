import type { Schemas } from "@kamby/api";
import { router } from "expo-router";
import { CalendarDays, ChevronRight } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { Pressavel } from "@/components/Pressavel";
import { Selo, type TomSelo } from "@/components/Selo";
import { diaRelativo, litros } from "@/lib/formato";
import { cores, familia, raio, tipo } from "@/lib/tema";

import { etapaAtual } from "./Jornada";

type Coleta = Schemas["ColetaSaida"];

const ATIVAS = ["agendada", "confirmada", "a_caminho"];

/** Mesma regra de "em andamento" da API (selectors.coletas_andamento): do agendamento até chegar ao banco. */
export const emAndamento = (c: Coleta) => ATIVAS.includes(c.status) || (c.status === "coletada" && !c.entregue_banco_em && !c.ajuste);

export const podeMudar = (c: Coleta) => c.status === "agendada" || c.status === "confirmada";

export function situacao(c: Coleta): { texto: string; tom: TomSelo } {
  if (c.status === "cancelada") return { texto: "Cancelada", tom: "cancelado" };
  if (c.status === "ausente") return { texto: "Ninguém em casa", tom: "atencao" };
  if (c.ajuste) return { texto: "Ajuste no frasco", tom: "atencao" };
  if (c.entregue_banco_em) return { texto: "Concluída", tom: "concluido" };
  return { texto: "Em andamento", tom: "andamento" };
}

/** Status de uma coleta numa frase: etapa atual, exceção do banco ou o volume que chegou. */
export function resumo(coleta: Coleta) {
  if (coleta.status === "cancelada" || coleta.status === "ausente") return coleta.status_rotulo;
  const atual = etapaAtual(coleta.etapas);
  if (atual) return `Etapa ${atual.numero} de ${coleta.etapas.length}: ${atual.etapa.rotulo}`;
  return coleta.volume_ml ? `Entregue ao banco · ${litros(coleta.volume_ml)}` : "Entregue ao banco";
}

/** Uma coleta na Início ou no histórico. As anteriores ficam apagadas; as em andamento, destacadas. */
export function CartaoColeta({ coleta }: { coleta: Coleta }) {
  const quando = `${diaRelativo(coleta.data)} • ${coleta.horario_rotulo}`;
  const status = resumo(coleta);
  const selo = situacao(coleta);
  const ativa = emAndamento(coleta);
  return (
    <Pressavel
      accessibilityRole="button"
      accessibilityLabel={`Coleta ${quando}. ${selo.texto}. ${status}. ${coleta.banco_nome}. Ver detalhes`}
      onPress={() => router.push({ pathname: "/coleta/[id]", params: { id: String(coleta.id) } })}
      style={[estilos.cartao, ativa ? estilos.ativa : estilos.passada]}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <View style={estilos.topo}>
          <CalendarDays size={14} color={ativa ? cores.turquesaTexto : cores.textoSuave} strokeWidth={2} />
          <Selo {...selo} />
        </View>
        <Text style={[estilos.quando, !ativa && { color: cores.texto }]}>{quando}</Text>
        <Text style={[tipo.corpoForte, { fontSize: 13 }]}>{status}</Text>
        <Text numberOfLines={1} style={[tipo.legenda, { fontSize: 12 }]}>
          {coleta.banco_nome}
        </Text>
      </View>
      <ChevronRight size={20} color={cores.textoSuave} />
    </Pressavel>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: raio.g,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  // Em andamento: cartão branco com faixa turquesa. Anterior: sem fundo, para não competir.
  ativa: { backgroundColor: cores.superficie, borderColor: cores.bordaTurquesa, borderLeftWidth: 4, borderLeftColor: cores.turquesa },
  passada: { backgroundColor: "transparent", borderColor: cores.borda },
  topo: { flexDirection: "row", alignItems: "center", gap: 6 },
  quando: { fontFamily: familia.semi, fontSize: 14, lineHeight: 18, color: cores.turquesaTexto },
});
