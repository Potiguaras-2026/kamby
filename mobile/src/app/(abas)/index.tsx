import type { Schemas } from "@kamby/api";
import { router } from "expo-router";
import { CalendarDays, ChevronRight, Heart, MapPin } from "lucide-react-native";
import { Image, Linking, StyleSheet, Text, View } from "react-native";

import { Botao } from "@/components/Botao";
import { Cartao } from "@/components/Cartao";
import { CartaoOnda } from "@/components/CartaoOnda";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Pressavel } from "@/components/Pressavel";
import { Tela } from "@/components/Tela";
import { AtalhosGuias } from "@/features/conteudo/AtalhosGuias";
import { IMAGENS } from "@/features/conteudo/imagens";
import { ACOES, estaApta } from "@/features/inicio/acoes";
import { Historico } from "@/features/inicio/Historico";
import { useInicio } from "@/lib/consultas";
import { diaRelativo, primeiroNome } from "@/lib/formato";
import { cores, familia, raio, tipo } from "@/lib/tema";

type Inicio = Schemas["InicioSaida"];
type Rota = "/kit" | "/coleta" | "/coleta/agendar";

export default function TelaInicio() {
  const inicio = useInicio();

  if (!inicio.data) {
    return (
      <Tela comAbas>
        <Estado erro={inicio.error} tentarDeNovo={() => inicio.refetch()} />
      </Tela>
    );
  }

  const { doadora, proxima_acao, coleta_ativa, kit_aberto, banco, historico } = inicio.data;

  return (
    <Tela comAbas atualizar={{ atualizando: inicio.isRefetching, aoAtualizar: () => inicio.refetch() }}>
      <Entrada>
        <Text accessibilityRole="header" style={estilos.boasVindas}>
          Bem-vinda, <Text style={{ color: cores.rosa }}>{primeiroNome(doadora.nome_completo)}</Text>!
        </Text>
      </Entrada>

      <Entrada ordem={1}>
        <Destaque />
      </Entrada>

      <Entrada ordem={2}>
        {estaApta(proxima_acao) ? (
          <Atalhos acao={proxima_acao} kit={kit_aberto} />
        ) : (
          <Cartao style={{ gap: 10 }}>
            <Text style={[tipo.subtitulo, { color: cores.primaria }]}>{doadora.status_rotulo}</Text>
            <Text style={tipo.corpo}>{ACOES[proxima_acao]}</Text>
            {proxima_acao === "contatar_banco" ? (
              <Botao titulo="Ligar para o banco de leite" variante="secundaria" onPress={() => Linking.openURL(`tel:${banco.telefone}`)} />
            ) : null}
          </Cartao>
        )}
      </Entrada>

      {coleta_ativa ? (
        <Entrada ordem={3}>
          <ProximaColeta coleta={coleta_ativa} />
        </Entrada>
      ) : null}

      <Entrada ordem={4} style={{ gap: 10 }}>
        <Text accessibilityRole="header" style={estilos.secao}>
          Seu histórico de doações
        </Text>
        <Historico meses={historico} />
      </Entrada>

      <Entrada ordem={5}>
        <Pressavel accessibilityRole="button" onPress={() => router.push("/bancos")} style={estilos.bancos}>
          <MapPin size={30} color={cores.turquesaTexto} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Text style={[tipo.corpoForte, { color: cores.turquesaTexto, fontFamily: familia.semi }]}>Ver bancos de leite</Text>
            <Text style={[tipo.legenda, { fontSize: 13 }]}>Endereço e telefone para tirar dúvidas</Text>
          </View>
          <ChevronRight size={24} color={cores.turquesaTexto} />
        </Pressavel>
      </Entrada>

      <Entrada ordem={6}>
        <AtalhosGuias />
      </Entrada>
    </Tela>
  );
}

/** Sem fundo, borda nem toque: é mensagem, não botão. */
function Destaque() {
  return (
    <View style={estilos.destaque}>
      <View style={estilos.coracaoFora} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={estilos.coracaoDentro}>
          <Heart size={24} color={cores.rosa} fill={cores.rosa} />
        </View>
      </View>
      <Text style={estilos.destaqueTexto}>Seu leite leva cuidado e esperança para quem mais precisa</Text>
      <Image source={IMAGENS.maeBebe} style={estilos.ilustracao} resizeMode="contain" accessibilityIgnoresInvertColors />
    </View>
  );
}

function Atalhos({ acao, kit }: { acao: Inicio["proxima_acao"]; kit: Inicio["kit_aberto"] }) {
  const coleta: { texto: string; rota?: Rota } =
    acao === "agendar_coleta"
      ? { texto: "Agende a retirada do seu leite", rota: "/coleta/agendar" }
      : acao === "acompanhar_coleta"
        ? { texto: "Você já tem uma coleta marcada", rota: "/coleta" }
        : { texto: "Disponível quando o kit chegar" };
  const pedido: { texto: string; rota?: Rota } = kit ? { texto: kit.status_rotulo } : { texto: "Peça seu kit de coleta", rota: "/kit" };

  return (
    <View style={estilos.atalhos}>
      <CartaoOnda
        titulo="Agendar coleta"
        texto={coleta.texto}
        tom="turquesa"
        imagem={IMAGENS.poteLeite}
        larguraImagem={92}
        alturaImagem={96}
        onPress={coleta.rota && (() => router.push(coleta.rota!))}
      />
      <CartaoOnda
        titulo="Solicitar kit"
        texto={pedido.texto}
        tom="rosa"
        imagem={IMAGENS.kitGrupo}
        larguraImagem={150}
        alturaImagem={95}
        onPress={pedido.rota && (() => router.push(pedido.rota!))}
      />
    </View>
  );
}

function ProximaColeta({ coleta }: { coleta: NonNullable<Inicio["coleta_ativa"]> }) {
  return (
    <Pressavel
      accessibilityRole="button"
      accessibilityLabel={`Próxima coleta: ${diaRelativo(coleta.data)}, das ${coleta.horario_rotulo.replace(" - ", " às ")}. ${coleta.status_rotulo}. Ver detalhes`}
      onPress={() => router.push("/coleta")}
      style={estilos.proxima}
    >
      <View style={estilos.calendario}>
        <CalendarDays size={22} color={cores.turquesaTexto} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[tipo.legenda, { fontSize: 13 }]}>Próxima coleta</Text>
        <Text style={estilos.proximaData}>
          {diaRelativo(coleta.data)} <Text style={{ color: cores.textoSuave }}>•</Text> {coleta.horario_rotulo}
        </Text>
        <Text style={[tipo.legenda, { fontSize: 13 }]}>{coleta.status_rotulo}</Text>
      </View>
      <ChevronRight size={22} color={cores.textoSuave} />
    </Pressavel>
  );
}

const estilos = StyleSheet.create({
  // Rosa da marca no nome só passa no contraste como texto grande: não descer de 24px.
  boasVindas: { fontFamily: familia.assinatura, fontSize: 24, lineHeight: 34, color: cores.texto },
  secao: { fontFamily: familia.medio, fontSize: 17, color: cores.texto },
  destaque: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 112,
  },
  coracaoFora: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#FAD9EA", alignItems: "center", justifyContent: "center" },
  coracaoDentro: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F6C3DF", alignItems: "center", justifyContent: "center" },
  destaqueTexto: { flex: 1, fontFamily: familia.regular, fontSize: 15, lineHeight: 21, color: cores.textoSuave },
  ilustracao: { width: 104, height: 108, marginRight: 2 },
  atalhos: { gap: 10 },
  proxima: {
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
  proximaData: { fontFamily: familia.semi, fontSize: 18, lineHeight: 24, color: cores.turquesaTexto },
  bancos: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: cores.turquesaSuave,
    borderRadius: raio.g,
    borderWidth: 1,
    borderColor: cores.bordaTurquesa,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
});
