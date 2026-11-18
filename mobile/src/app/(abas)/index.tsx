import type { Schemas } from "@kamby/api";
import { router } from "expo-router";
import { ChevronRight, Heart, MapPin, TriangleAlert } from "lucide-react-native";
import { Image, StyleSheet, Text, View } from "react-native";

import { Botao } from "@/components/Botao";
import { BotaoWhatsapp } from "@/components/BotaoWhatsapp";
import { Cartao } from "@/components/Cartao";
import { CartaoOnda } from "@/components/CartaoOnda";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Mascote } from "@/components/Mascote";
import { Pressavel } from "@/components/Pressavel";
import { Tela } from "@/components/Tela";
import { CartaoColeta } from "@/features/coleta/CartaoColeta";
import { AtalhosGuias } from "@/features/conteudo/AtalhosGuias";
import { IMAGENS } from "@/features/conteudo/imagens";
import { EmAnalise } from "@/features/inicio/EmAnalise";
import { Historico } from "@/features/inicio/Historico";
import { useInicio, useTexto } from "@/lib/consultas";
import { diaRelativo, primeiroNome } from "@/lib/formato";
import { cores, familia, raio, tipo, toqueMinimo } from "@/lib/tema";

type Inicio = Schemas["InicioSaida"];
type Rota = "/kit" | "/coleta/agendar";

const APTA: Inicio["proxima_acao"][] = ["pedir_kit", "aguardar_kit", "agendar_coleta"];

export default function TelaInicio() {
  const inicio = useInicio();
  const texto = useTexto();

  if (!inicio.data) {
    return (
      <Tela comAbas>
        <Estado erro={inicio.error} tentarDeNovo={() => inicio.refetch()} />
      </Tela>
    );
  }

  const { doadora, proxima_acao, coletas_andamento, kit_aberto, banco, historico, aviso } = inicio.data;

  return (
    <Tela comAbas atualizar={{ atualizando: inicio.isRefetching, aoAtualizar: () => inicio.refetch() }}>
      <Entrada>
        <Text accessibilityRole="header" style={estilos.boasVindas}>
          Bem-vinda, <Text style={{ color: cores.primaria }}>{primeiroNome(doadora.nome_completo)}</Text>!
        </Text>
      </Entrada>

      {aviso ? (
        <Entrada ordem={1}>
          <Aviso titulo={aviso.titulo || "Temos um aviso sobre sua coleta"} />
        </Entrada>
      ) : null}

      <Entrada ordem={1}>
        <Destaque texto={texto("inicio.destaque", "Seu leite leva cuidado e esperança para quem mais precisa").corpo} />
      </Entrada>

      <Entrada ordem={2}>
        {proxima_acao === "pedir_kit" ? (
          <DoarLeite />
        ) : APTA.includes(proxima_acao) ? (
          <Atalhos kit={kit_aberto} />
        ) : proxima_acao === "aguardar_analise" ? (
          <EmAnalise texto={texto("inicio.aguardar_analise", "Recebemos seu cadastro. O banco de leite responde em até 2 dias úteis.").corpo} />
        ) : (
          <Cartao style={{ gap: 10 }}>
            <Text style={[tipo.subtitulo, { color: cores.primaria }]}>{doadora.status_rotulo}</Text>
            <Text style={tipo.corpo}>{texto(`inicio.${proxima_acao}`).corpo}</Text>
            {proxima_acao === "contatar_banco" ? (
              <BotaoWhatsapp telefone={banco.telefone} banco={banco.nome} />
            ) : null}
          </Cartao>
        )}
      </Entrada>

      {coletas_andamento.length ? (
        <Entrada ordem={3} style={{ gap: 10 }}>
          <Text accessibilityRole="header" style={estilos.secao}>
            {coletas_andamento.length === 1 ? "Doação em andamento" : `${coletas_andamento.length} doações em andamento`}
          </Text>
          {coletas_andamento.map((coleta) => (
            <CartaoColeta key={coleta.id} coleta={coleta} />
          ))}
        </Entrada>
      ) : null}

      <Entrada ordem={4} style={{ gap: 10 }}>
        <View style={estilos.linhaSecao}>
          <Text accessibilityRole="header" style={estilos.secao}>
            Seu histórico de doações
          </Text>
          <Pressavel accessibilityRole="link" onPress={() => router.push("/coleta")} style={estilos.verTodas}>
            <Text style={estilos.verTodasTexto}>Ver todas</Text>
          </Pressavel>
        </View>
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

/** Primeiro passo de quem acabou de ser aprovada: um botão só, que leva à tela de doação (coleta com o kit junto). */
function DoarLeite() {
  return (
    <Cartao tom="rosa" style={estilos.doar}>
      <Mascote tamanho={64} />
      <View style={{ alignItems: "center", gap: 2 }}>
        <Text accessibilityRole="header" style={[tipo.subtitulo, { color: cores.primaria }]}>
          Tudo pronto para começar!
        </Text>
        <Text style={[tipo.legenda, { textAlign: "center" }]}>Escolha o dia da coleta. Seu kit de frascos vai junto.</Text>
      </View>
      <View style={{ alignSelf: "stretch" }}>
        <Botao titulo="Doar leite" onPress={() => router.push("/coleta/agendar")} />
      </View>
    </Cartao>
  );
}

/** Sem fundo, borda nem toque: é mensagem, não botão. */
function Destaque({ texto }: { texto: string }) {
  return (
    <View style={estilos.destaque}>
      <View style={estilos.coracaoFora} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={estilos.coracaoDentro}>
          <Heart size={24} color={cores.rosa} fill={cores.rosa} />
        </View>
      </View>
      <Text style={estilos.destaqueTexto}>{texto}</Text>
      <Image source={IMAGENS.maeBebe} style={estilos.ilustracao} resizeMode="contain" accessibilityIgnoresInvertColors />
    </View>
  );
}

function Atalhos({ kit }: { kit: Inicio["kit_aberto"] }) {
  const coleta: { texto: string; rota: Rota } = { texto: "Agende a retirada do seu leite", rota: "/coleta/agendar" };
  const pedido: { texto: string; rota?: Rota } = kit
    ? { texto: kit.data_entrega ? `Entrega ${diaRelativo(kit.data_entrega).toLowerCase()}` : kit.status_rotulo, rota: "/kit" }
    : { texto: "Peça seu kit de coleta", rota: "/kit" };

  return (
    <View style={estilos.atalhos}>
      <CartaoOnda
        titulo="Agendar coleta"
        texto={coleta.texto}
        tom="turquesa"
        imagem={IMAGENS.poteLeite}
        larguraImagem={92}
        alturaImagem={96}
        onPress={() => router.push(coleta.rota)}
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

function Aviso({ titulo }: { titulo: string }) {
  return (
    <Pressavel accessibilityRole="button" accessibilityLabel={`${titulo}. Ver o que fazer`} onPress={() => router.push("/aviso")} style={estilos.aviso}>
      <TriangleAlert size={24} color={cores.primaria} />
      <View style={{ flex: 1 }}>
        <Text style={[tipo.corpoForte, { color: cores.primaria }]}>{titulo}</Text>
        <Text style={[tipo.legenda, { fontSize: 13 }]}>Toque para ver o que fazer</Text>
      </View>
      <ChevronRight size={22} color={cores.primaria} />
    </Pressavel>
  );
}

const estilos = StyleSheet.create({
  doar: { alignItems: "center", gap: 12, paddingVertical: 20 },
  boasVindas: { fontFamily: familia.semi, fontSize: 17, lineHeight: 26, color: cores.texto },
  secao: { fontFamily: familia.medio, fontSize: 14, color: cores.texto },
  linhaSecao: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  verTodas: { minHeight: toqueMinimo, justifyContent: "center", paddingHorizontal: 4 },
  verTodasTexto: { fontFamily: familia.semi, fontSize: 13, color: cores.primaria },
  destaque: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 112,
  },
  coracaoFora: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#FAD9EA", alignItems: "center", justifyContent: "center" },
  coracaoDentro: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F6C3DF", alignItems: "center", justifyContent: "center" },
  destaqueTexto: { flex: 1, fontFamily: familia.regular, fontSize: 14, lineHeight: 19, color: cores.textoSuave },
  ilustracao: { width: 104, height: 108, marginRight: 2 },
  atalhos: { gap: 10 },
  aviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: cores.rosaSuave,
    borderRadius: raio.g,
    borderWidth: 1.5,
    borderColor: cores.rosaClaro,
    padding: 16,
  },
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
