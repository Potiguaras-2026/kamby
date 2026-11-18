import { router } from "expo-router";
import { Text, View } from "react-native";

import { Botao } from "@/components/Botao";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Tela } from "@/components/Tela";
import { CartaoColeta } from "@/features/coleta/CartaoColeta";
import { useColetas } from "@/lib/consultas";
import { tipo } from "@/lib/tema";

/** Histórico: todas as coletas da doadora, da mais recente para a mais antiga. */
export default function TelaMinhasDoacoes() {
  const coletas = useColetas();

  return (
    <Tela voltar titulo="Minhas doações" atualizar={{ atualizando: coletas.isRefetching, aoAtualizar: () => coletas.refetch() }}>
      {!coletas.data ? (
        <Estado erro={coletas.error} tentarDeNovo={() => coletas.refetch()} />
      ) : coletas.data.items.length === 0 ? (
        <Entrada style={{ gap: 14 }}>
          <Text style={[tipo.corpo, { textAlign: "center" }]}>Você ainda não agendou nenhuma coleta.</Text>
          <Botao titulo="Doar leite" onPress={() => router.push("/coleta/agendar")} />
        </Entrada>
      ) : (
        <View style={{ gap: 10 }}>
          {coletas.data.items.map((coleta, i) => (
            <Entrada key={coleta.id} ordem={Math.min(i, 6)}>
              <CartaoColeta coleta={coleta} />
            </Entrada>
          ))}
        </View>
      )}
    </Tela>
  );
}
