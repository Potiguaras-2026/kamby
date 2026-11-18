import type { Schemas } from "@kamby/api";
import { router } from "expo-router";
import { ChevronRight, Package, Plus } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { Botao } from "@/components/Botao";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Pressavel } from "@/components/Pressavel";
import { Secao } from "@/components/Secao";
import { Selo, type TomSelo } from "@/components/Selo";
import { Tela } from "@/components/Tela";
import { useKits } from "@/lib/consultas";
import { entregaKit } from "@/lib/formato";
import { cores, familia, raio, tipo } from "@/lib/tema";

type Kit = Schemas["KitSaida"];

const aberto = (k: Kit) => k.status === "solicitado" || k.status === "em_preparo";
const SELO: Record<string, { texto: string; tom: TomSelo }> = {
  entregue: { texto: "Entregue", tom: "concluido" },
  cancelado: { texto: "Cancelado", tom: "cancelado" },
};

/** Histórico de pedidos de kit: em andamento primeiro, depois os anteriores. */
export default function TelaPedidos() {
  const kits = useKits();
  const itens = kits.data?.items ?? [];
  const andamento = itens.filter(aberto);
  const anteriores = itens.filter((k) => !aberto(k));

  return (
    <Tela voltar titulo="Meus pedidos de kit" atualizar={{ atualizando: kits.isRefetching, aoAtualizar: () => kits.refetch() }}>
      <Botao titulo="Novo pedido de kit" icone={Plus} variante="secundaria" onPress={() => router.push("/kit")} />
      {!kits.data ? (
        <Estado erro={kits.error} tentarDeNovo={() => kits.refetch()} />
      ) : itens.length === 0 ? (
        <Text style={[tipo.corpo, { textAlign: "center" }]}>Você ainda não pediu nenhum kit.</Text>
      ) : (
        <>
          <Secao titulo="Em andamento" vazio="Nenhum pedido em andamento.">
            {andamento.map((k, i) => (
              <Entrada key={k.id} ordem={Math.min(i, 6)}>
                <CartaoKit kit={k} />
              </Entrada>
            ))}
          </Secao>
          {anteriores.length ? (
            <Secao titulo="Anteriores">
              {anteriores.map((k, i) => (
                <Entrada key={k.id} ordem={Math.min(i + andamento.length, 6)}>
                  <CartaoKit kit={k} />
                </Entrada>
              ))}
            </Secao>
          ) : null}
        </>
      )}
    </Tela>
  );
}

function CartaoKit({ kit }: { kit: Kit }) {
  const ativo = aberto(kit);
  const selo = SELO[kit.status] ?? { texto: "Em andamento", tom: "andamento" };
  return (
    <Pressavel
      accessibilityRole="button"
      accessibilityLabel={`Kit para ${entregaKit(kit)}. ${selo.texto}. ${kit.status_rotulo}. Ver detalhes`}
      onPress={() => router.push({ pathname: "/pedidos/[id]", params: { id: String(kit.id) } })}
      style={[estilos.cartao, ativo ? estilos.ativo : estilos.passado]}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <View style={estilos.topo}>
          <Package size={14} color={ativo ? cores.primaria : cores.textoSuave} strokeWidth={2} />
          <Selo {...selo} />
        </View>
        <Text style={[estilos.quando, !ativo && { color: cores.texto }]}>{entregaKit(kit)}</Text>
        <Text style={[tipo.legenda, { fontSize: 12 }]}>
          {kit.status_rotulo} · {kit.quantidade_frascos} {kit.quantidade_frascos === 1 ? "kit" : "kits"}
        </Text>
      </View>
      <ChevronRight size={20} color={cores.textoSuave} />
    </Pressavel>
  );
}

const estilos = StyleSheet.create({
  cartao: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: raio.g, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14 },
  ativo: { backgroundColor: cores.superficie, borderColor: cores.rosaClaro, borderLeftWidth: 4, borderLeftColor: cores.rosa },
  passado: { backgroundColor: "transparent", borderColor: cores.borda },
  topo: { flexDirection: "row", alignItems: "center", gap: 6 },
  quando: { fontFamily: familia.semi, fontSize: 14, lineHeight: 18, color: cores.primaria },
});
