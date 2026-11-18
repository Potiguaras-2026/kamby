import type { Schemas } from "@kamby/api";
import { router } from "expo-router";
import { CalendarDays, ChevronRight } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { Pressavel } from "@/components/Pressavel";
import { diaRelativo, litros } from "@/lib/formato";
import { cores, familia, raio, tipo } from "@/lib/tema";

import { etapaAtual } from "./Jornada";

type Coleta = Schemas["ColetaSaida"];

/** Status de uma coleta numa frase: etapa atual, exceção do banco ou o volume que chegou. */
export function resumo(coleta: Coleta) {
  if (coleta.status === "cancelada" || coleta.status === "ausente") return coleta.status_rotulo;
  const atual = etapaAtual(coleta.etapas);
  if (atual) return `Etapa ${atual.numero} de ${coleta.etapas.length}: ${atual.etapa.rotulo}`;
  return coleta.volume_ml ? `Entregue ao banco · ${litros(coleta.volume_ml)}` : "Entregue ao banco";
}

/** Uma coleta na Início ou no histórico. Toque abre o acompanhamento. */
export function CartaoColeta({ coleta }: { coleta: Coleta }) {
  const quando = `${diaRelativo(coleta.data)} • ${coleta.horario_rotulo}`;
  const status = resumo(coleta);
  return (
    <Pressavel
      accessibilityRole="button"
      accessibilityLabel={`Coleta ${quando}. ${status}. ${coleta.banco_nome}. Ver detalhes`}
      onPress={() => router.push({ pathname: "/coleta/[id]", params: { id: String(coleta.id) } })}
      style={estilos.cartao}
    >
      <View style={estilos.calendario}>
        <CalendarDays size={22} color={cores.turquesaTexto} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={estilos.quando}>{quando}</Text>
        <Text style={[tipo.corpoForte, { fontSize: 14 }]}>{status}</Text>
        <Text style={[tipo.legenda, { fontSize: 13 }]}>{coleta.banco_nome}</Text>
      </View>
      <ChevronRight size={22} color={cores.textoSuave} />
    </Pressavel>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: cores.superficie,
    borderRadius: raio.g,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: 16,
  },
  calendario: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: cores.turquesa,
    backgroundColor: cores.turquesaSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  quando: { fontFamily: familia.semi, fontSize: 15, lineHeight: 20, color: cores.turquesaTexto },
});
