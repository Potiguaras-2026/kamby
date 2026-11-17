import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text } from "react-native";

import { Cartao } from "@/components/Cartao";
import { Entrada } from "@/components/Entrada";
import { Esqueleto } from "@/components/Esqueleto";
import { Estado } from "@/components/Estado";
import { Seletor, SeletorData } from "@/components/Seletores";
import { api, chamar } from "@/lib/api";
import { tipo } from "@/lib/tema";

export const useHorarios = () => useQuery({ queryKey: ["horarios"], queryFn: () => chamar(api.GET("/api/v1/coletas/horarios")) });

type Props = {
  /** "da coleta", "da entrega": completa os rótulos. */
  de: string;
  data: string | null;
  horario: string | null;
  mudarData: (d: string) => void;
  mudarHorario: (h: string) => void;
  ordem?: number;
};

/** Dia útil e faixa de horário do banco. Mesma regra para a entrega do kit e para a coleta. */
export function DiaHorario({ de, data, horario, mudarData, mudarHorario, ordem = 2 }: Props) {
  const dias = useQuery({ queryKey: ["dias-disponiveis"], queryFn: () => chamar(api.GET("/api/v1/coletas/dias-disponiveis")) });
  const horarios = useHorarios();

  return (
    <>
      <Entrada ordem={ordem}>
        <Cartao style={estilos.linha}>
          {dias.data ? (
            dias.data.length ? (
              <SeletorData rotulo={`Data ${de}`} dias={dias.data} selecionado={data} onChange={mudarData} />
            ) : (
              <Text style={tipo.legenda}>Nenhum dia disponível agora. Fale com o banco de leite.</Text>
            )
          ) : dias.error ? (
            <Estado erro={dias.error} tentarDeNovo={() => dias.refetch()} />
          ) : (
            <Esqueleto altura={40} />
          )}
        </Cartao>
      </Entrada>

      <Entrada ordem={ordem + 1}>
        <Cartao style={estilos.linha}>
          {horarios.data ? (
            horarios.data.length ? (
              <Seletor
                rotulo={`Horário ${de}`}
                opcoes={horarios.data.map((h) => ({ valor: h.id, rotulo: h.rotulo }))}
                selecionado={horario}
                onChange={mudarHorario}
              />
            ) : (
              <Text style={tipo.legenda}>O banco de leite ainda não abriu horários. Tente mais tarde ou fale com o banco.</Text>
            )
          ) : horarios.error ? (
            <Estado erro={horarios.error} tentarDeNovo={() => horarios.refetch()} />
          ) : (
            <Esqueleto altura={40} />
          )}
        </Cartao>
      </Entrada>
    </>
  );
}

const estilos = StyleSheet.create({
  linha: { paddingVertical: 6, paddingHorizontal: 16 },
});
