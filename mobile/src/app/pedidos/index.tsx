import { router } from "expo-router";
import { ChevronRight, Package } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { Botao } from "@/components/Botao";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Pressavel } from "@/components/Pressavel";
import { Tela } from "@/components/Tela";
import { useKits } from "@/lib/consultas";
import { entregaKit } from "@/lib/formato";
import { cores, familia, raio, tipo } from "@/lib/tema";

/** Histórico de pedidos de kit, do mais recente para o mais antigo. */
export default function TelaPedidos() {
  const kits = useKits();

  return (
    <Tela voltar titulo="Meus pedidos de kit" atualizar={{ atualizando: kits.isRefetching, aoAtualizar: () => kits.refetch() }}>
      {!kits.data ? (
        <Estado erro={kits.error} tentarDeNovo={() => kits.refetch()} />
      ) : kits.data.items.length === 0 ? (
        <Entrada style={{ gap: 14 }}>
          <Text style={[tipo.corpo, { textAlign: "center" }]}>Você ainda não pediu nenhum kit.</Text>
          <Botao titulo="Solicitar kit" onPress={() => router.push("/kit")} />
        </Entrada>
      ) : (
        <View style={{ gap: 10 }}>
          <Botao titulo="Novo pedido de kit" variante="secundaria" onPress={() => router.push("/kit")} />
          {kits.data.items.map((kit, i) => (
            <Entrada key={kit.id} ordem={Math.min(i, 6)}>
              <Pressavel
                accessibilityRole="button"
                accessibilityLabel={`Kit para ${entregaKit(kit)}. ${kit.status_rotulo}. Ver detalhes`}
                onPress={() => router.push({ pathname: "/pedidos/[id]", params: { id: String(kit.id) } })}
                style={estilos.cartao}
              >
                <View style={estilos.icone}>
                  <Package size={22} color={cores.primaria} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={estilos.quando}>{entregaKit(kit)}</Text>
                  <Text style={tipo.corpoForte}>{kit.status_rotulo}</Text>
                  <Text style={tipo.legenda}>
                    {kit.quantidade_frascos} {kit.quantidade_frascos === 1 ? "kit" : "kits"}
                  </Text>
                </View>
                <ChevronRight size={22} color={cores.textoSuave} />
              </Pressavel>
            </Entrada>
          ))}
        </View>
      )}
    </Tela>
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
  icone: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: cores.rosaClaro,
    backgroundColor: cores.rosaSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  quando: { fontFamily: familia.semi, fontSize: 15, lineHeight: 20, color: cores.primaria },
});
