import { router } from "expo-router";
import { Baby, Building2, ClipboardList, Droplet, Heart, History, LogOut, MapPin, Package, Pencil, Phone, UserRound, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/Avatar";
import { Cartao } from "@/components/Cartao";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Folha } from "@/components/Folha";
import { NumeroAnimado } from "@/components/NumeroAnimado";
import { Pressavel } from "@/components/Pressavel";
import { Tela } from "@/components/Tela";
import { useEu, useInicio } from "@/lib/consultas";
import { dataCompleta, linhaEndereco, litros, telefone } from "@/lib/formato";
import { salvarTokens } from "@/lib/sessao";
import { cores, familia, raio, tipo, toqueMinimo } from "@/lib/tema";

export default function TelaPerfil() {
  const eu = useEu();
  const impacto = useInicio().data?.impacto;
  const [saindo, setSaindo] = useState(false);

  if (!eu.data) {
    return (
      <Tela comAbas>
        <Estado erro={eu.error} tentarDeNovo={() => eu.refetch()} />
      </Tela>
    );
  }

  return (
    <Tela comAbas>
      <Entrada style={estilos.topo}>
        <Avatar nome={eu.data.nome_completo} tamanho={104} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text accessibilityRole="header" style={[tipo.titulo, { fontSize: 16, lineHeight: 22 }]}>
            {eu.data.nome_completo}
          </Text>
          <Text style={[tipo.legenda, { color: cores.texto }]}>Doadora desde {dataCompleta(eu.data.criado_em)}</Text>
          <View style={estilos.telefone}>
            <Phone size={14} color={cores.texto} />
            <Text style={[tipo.legenda, { color: cores.texto }]}>{telefone(eu.data.telefone)}</Text>
          </View>
        </View>
      </Entrada>

      {/* Figma mostra "kits solicitados"; volume doado diz mais para a mãe. */}
      <Entrada ordem={1} style={estilos.numeros}>
        <Numero rotulo="Leite doado" icone={Droplet} tom="rosa" valor={impacto?.volume_total_ml ?? 0} formatar={litros} />
        <Numero rotulo="Coletas realizadas" icone={Package} tom="turquesa" valor={impacto?.coletas ?? 0} formatar={(n) => String(Math.round(n))} />
      </Entrada>

      <Entrada ordem={2} style={estilos.numeros}>
        <Atalho rotulo="Minhas doações" icone={History} onPress={() => router.push("/coleta")} />
        <Atalho rotulo="Meus pedidos de kit" icone={ClipboardList} onPress={() => router.push("/pedidos")} />
      </Entrada>

      <Entrada ordem={3} style={{ gap: 12 }}>
        <Bloco titulo="Você" icone={UserRound} editar>
          <Dado rotulo="Nascimento" valor={dataCompleta(eu.data.data_nascimento)} />
          <Dado rotulo="Situação" valor={eu.data.status_rotulo} />
          <Dado rotulo="Banco de leite" valor={eu.data.banco.nome} />
        </Bloco>
        <Bloco titulo="Seu bebê" icone={Baby} tom="turquesa" editar>
          <Dado rotulo="Nascimento" valor={dataCompleta(eu.data.data_parto)} />
          <Dado rotulo="Prematuro" valor={simNao(eu.data.bebe_prematuro)} />
          <Dado rotulo="Amamentando" valor={simNao(eu.data.amamentando)} />
          <Dado rotulo="Maternidade" valor={eu.data.maternidade || "Não informada"} />
        </Bloco>
        {eu.data.endereco_ativo ? (
          <Bloco titulo="Endereço da coleta" icone={MapPin} editar="/enderecos">
            <Text style={tipo.corpo}>{linhaEndereco(eu.data.endereco_ativo)}</Text>
            {eu.data.endereco_ativo.referencia ? <Text style={tipo.legenda}>Ref.: {eu.data.endereco_ativo.referencia}</Text> : null}
          </Bloco>
        ) : null}
      </Entrada>

      <Entrada ordem={4} style={{ gap: 10, marginTop: 8 }}>
        <ItemMenu rotulo="Editar meus dados" icone={Pencil} onPress={() => router.push("/meus-dados")} />
        <ItemMenu rotulo="Endereços cadastrados" icone={MapPin} onPress={() => router.push("/enderecos")} />
        <ItemMenu rotulo="Bancos de leite" icone={Building2} onPress={() => router.push("/bancos")} />
        <ItemMenu rotulo="Por trás do Kamby" icone={Heart} tom="azul" onPress={() => router.push("/sobre")} />
        <ItemMenu rotulo="Sair" icone={LogOut} tom="erro" onPress={() => setSaindo(true)} />
      </Entrada>

      <Folha
        visivel={saindo}
        aoFechar={() => setSaindo(false)}
        titulo="Sair do Kamby?"
        texto="Para entrar de novo, você vai precisar do seu telefone e da senha."
        confirmar="Sair"
        manter="Ficar"
        aoConfirmar={() => {
          setSaindo(false);
          salvarTokens(null);
        }}
      />
    </Tela>
  );
}

function Numero({ rotulo, icone: Icone, tom, valor, formatar }: { rotulo: string; icone: LucideIcon; tom: "rosa" | "turquesa"; valor: number; formatar: (n: number) => string }) {
  const cor = tom === "rosa" ? cores.primaria : cores.turquesaTexto;
  return (
    <View
      style={[estilos.numero, tom === "rosa" ? { backgroundColor: cores.rosaSuave, borderColor: cores.borda } : { backgroundColor: cores.turquesaSuave, borderColor: cores.bordaTurquesa }]}
      accessible
      accessibilityLabel={`${rotulo}: ${formatar(valor)}`}
    >
      <Text style={[tipo.legenda, { color: cor }]}>{rotulo}</Text>
      <View style={estilos.numeroLinha}>
        <Icone size={24} color={cor} strokeWidth={1.8} />
        <NumeroAnimado valor={valor} formatar={formatar} style={[estilos.numeroValor, { color: cor }]} />
      </View>
    </View>
  );
}

const simNao = (v: boolean | null) => (v === null ? "Não informado" : v ? "Sim" : "Não");

type BlocoProps = {
  titulo: string;
  icone: LucideIcon;
  tom?: "rosa" | "turquesa";
  /** true abre "Meus dados"; um caminho abre outra tela. */
  editar?: true | "/enderecos";
  children: React.ReactNode;
};

function Bloco({ titulo, icone: Icone, tom = "rosa", editar, children }: BlocoProps) {
  const cor = tom === "rosa" ? cores.primaria : cores.turquesaTexto;
  return (
    <Cartao style={{ gap: 8 }}>
      <View style={estilos.blocoTopo}>
        <Icone size={20} color={cor} strokeWidth={2} />
        <Text accessibilityRole="header" style={[tipo.corpoForte, { flex: 1, color: cor, fontFamily: familia.semi }]}>
          {titulo}
        </Text>
        {editar ? (
          <Pressavel
            accessibilityRole="button"
            accessibilityLabel={`Editar ${titulo.toLowerCase()}`}
            onPress={() => router.push(editar === true ? "/meus-dados" : editar)}
            style={estilos.editar}
          >
            <Pencil size={18} color={cor} strokeWidth={2} />
          </Pressavel>
        ) : null}
      </View>
      {children}
    </Cartao>
  );
}

function Atalho({ rotulo, icone: Icone, onPress }: { rotulo: string; icone: LucideIcon; onPress: () => void }) {
  return (
    <Pressavel accessibilityRole="button" onPress={onPress} escala={0.97} style={estilos.atalho}>
      <Icone size={22} color={cores.primaria} strokeWidth={1.8} />
      <Text style={[tipo.corpoForte, { textAlign: "center", fontSize: 13 }]}>{rotulo}</Text>
    </Pressavel>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.dado} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <Text style={[tipo.legenda, { flexShrink: 0 }]}>{rotulo}</Text>
      <Text style={[tipo.corpoForte, { flexShrink: 1, textAlign: "right" }]}>{valor}</Text>
    </View>
  );
}

const TONS_MENU = {
  rosa: { cor: cores.primaria, borda: cores.rosaClaro },
  azul: { cor: cores.azulTexto, borda: "#B9CBEA" },
  erro: { cor: cores.erro, borda: "#E9B4B0" },
};

function ItemMenu({ rotulo, icone: Icone, tom = "rosa", onPress }: { rotulo: string; icone: LucideIcon; tom?: keyof typeof TONS_MENU; onPress: () => void }) {
  const t = TONS_MENU[tom];
  return (
    <Pressavel accessibilityRole="button" onPress={onPress} escala={0.98} style={[estilos.item, { borderColor: t.borda }]}>
      <Text style={[tipo.corpo, { color: tom === "azul" ? cores.texto : t.cor }]}>{rotulo}</Text>
      <Icone size={20} color={t.cor} strokeWidth={1.8} />
    </Pressavel>
  );
}

const estilos = StyleSheet.create({
  topo: { flexDirection: "row", alignItems: "center", gap: 18, paddingVertical: 4 },
  telefone: { flexDirection: "row", alignItems: "center", gap: 6 },
  blocoTopo: { flexDirection: "row", alignItems: "center", gap: 8 },
  editar: { minHeight: toqueMinimo, minWidth: toqueMinimo, alignItems: "flex-end", justifyContent: "center", marginVertical: -12 },
  atalho: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: cores.superficie,
    borderRadius: raio.m,
    borderWidth: 1,
    borderColor: cores.rosaClaro,
  },
  dado: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 12 },
  numeros: { flexDirection: "row", gap: 12 },
  numero: { flex: 1, borderRadius: raio.m, borderWidth: 1, paddingVertical: 18, alignItems: "center", gap: 6 },
  numeroLinha: { flexDirection: "row", alignItems: "center", gap: 8 },
  numeroValor: { fontFamily: familia.medio, fontSize: 19, lineHeight: 26 },
  item: {
    minHeight: toqueMinimo + 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: cores.superficie,
    borderRadius: raio.m,
    borderWidth: 1,
    paddingHorizontal: 20,
  },
});
