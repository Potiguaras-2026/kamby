import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { Text } from "react-native";

import { Botao } from "@/components/Botao";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Secao } from "@/components/Secao";
import { Tela } from "@/components/Tela";
import { CartaoColeta, emAndamento } from "@/features/coleta/CartaoColeta";
import { useColetas } from "@/lib/consultas";
import { tipo } from "@/lib/tema";

/** Histórico: em andamento primeiro, depois as anteriores, da mais recente para a mais antiga. */
export default function TelaMinhasDoacoes() {
  const coletas = useColetas();
  const itens = coletas.data?.items ?? [];
  const andamento = itens.filter(emAndamento);
  const anteriores = itens.filter((c) => !emAndamento(c));

  return (
    <Tela voltar titulo="Minhas doações" atualizar={{ atualizando: coletas.isRefetching, aoAtualizar: () => coletas.refetch() }}>
      <Botao titulo="Nova doação" icone={Plus} variante="secundaria" onPress={() => router.push("/coleta/agendar")} />
      {!coletas.data ? (
        <Estado erro={coletas.error} tentarDeNovo={() => coletas.refetch()} />
      ) : itens.length === 0 ? (
        <Text style={[tipo.corpo, { textAlign: "center" }]}>Você ainda não agendou nenhuma coleta.</Text>
      ) : (
        <>
          <Secao titulo="Em andamento" vazio="Nenhuma coleta em andamento.">
            {andamento.map((c, i) => (
              <Entrada key={c.id} ordem={Math.min(i, 6)}>
                <CartaoColeta coleta={c} />
              </Entrada>
            ))}
          </Secao>
          {anteriores.length ? (
            <Secao titulo="Anteriores">
              {anteriores.map((c, i) => (
                <Entrada key={c.id} ordem={Math.min(i + andamento.length, 6)}>
                  <CartaoColeta coleta={c} />
                </Entrada>
              ))}
            </Secao>
          ) : null}
        </>
      )}
    </Tela>
  );
}
