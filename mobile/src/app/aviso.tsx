import { router } from "expo-router";
import { CalendarClock, FlaskConical } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { Botao } from "@/components/Botao";
import { Cartao } from "@/components/Cartao";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Tela } from "@/components/Tela";
import { TextoLongo } from "@/features/cadastro/partes";
import { useInicio } from "@/lib/consultas";
import { diaRelativo } from "@/lib/formato";
import { cores, tipo } from "@/lib/tema";

/** Exceção da última coleta (ninguém em casa, ajuste no frasco). Textos vêm do admin; aqui só o layout e a ação. */
export default function TelaAviso() {
  const inicio = useInicio();

  if (!inicio.data) {
    return (
      <Tela voltar>
        <Estado erro={inicio.error} tentarDeNovo={() => inicio.refetch()} />
      </Tela>
    );
  }

  const aviso = inicio.data.aviso;
  if (!aviso) {
    return (
      <Tela voltar titulo="Tudo certo" subtitulo="Não há nenhum aviso sobre suas coletas agora.">
        <Botao titulo="Voltar ao início" onPress={() => router.replace("/")} />
      </Tela>
    );
  }

  const ausente = aviso.tipo === "ausente";
  const Icone = ausente ? CalendarClock : FlaskConical;
  const pedirFrascos = aviso.tipo === "ajuste.fora_do_padrao" && !inicio.data.kit_aberto;

  return (
    <Tela voltar titulo={aviso.titulo || (ausente ? "Não encontramos ninguém em casa" : "Ajuste no seu frasco")}>
      <Entrada ordem={1}>
        <Cartao tom={ausente ? "turquesa" : "rosa"} style={{ gap: 12 }}>
          <View style={estilos.topo}>
            <Icone size={26} color={ausente ? cores.turquesaTexto : cores.primaria} />
            <Text style={tipo.legenda}>
              Coleta de {diaRelativo(aviso.coleta.data).toLowerCase()} · {aviso.coleta.quantidade_frascos}{" "}
              {aviso.coleta.quantidade_frascos === 1 ? "frasco" : "frascos"}
            </Text>
          </View>
          <TextoLongo corpo={aviso.corpo} />
        </Cartao>
      </Entrada>

      <Entrada ordem={2} style={{ gap: 10 }}>
        {ausente ? <Botao titulo="Agendar nova coleta" onPress={() => router.replace("/coleta/agendar")} /> : null}
        {pedirFrascos ? <Botao titulo="Pedir frascos prontos" onPress={() => router.replace("/kit")} /> : null}
        {!ausente ? (
          <Botao
            titulo="Ver como preparar os frascos"
            variante={pedirFrascos ? "secundaria" : "primaria"}
            onPress={() => router.push({ pathname: "/dica/[id]", params: { id: "frascos" } })}
          />
        ) : null}
        <Botao titulo="Voltar ao início" variante="suave" onPress={() => router.replace("/")} />
      </Entrada>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: { flexDirection: "row", alignItems: "center", gap: 10 },
});
