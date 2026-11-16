import { router } from "expo-router";
import { Building2, Droplet, Heart, LogOut, MapPin, Package, Phone, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/Avatar";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Folha } from "@/components/Folha";
import { NumeroAnimado } from "@/components/NumeroAnimado";
import { Pressavel } from "@/components/Pressavel";
import { Tela } from "@/components/Tela";
import { useEu, useInicio } from "@/lib/consultas";
import { dataCompleta, litros, telefone } from "@/lib/formato";
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
          <Text accessibilityRole="header" style={[tipo.titulo, { fontSize: 20, lineHeight: 26 }]}>
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

      {/* shortcut: "Editar perfil" fica para quando a API aceitar alteração de dados. */}
      <Entrada ordem={2} style={{ gap: 10, marginTop: 8 }}>
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
  numeros: { flexDirection: "row", gap: 12 },
  numero: { flex: 1, borderRadius: raio.m, borderWidth: 1, paddingVertical: 18, alignItems: "center", gap: 6 },
  numeroLinha: { flexDirection: "row", alignItems: "center", gap: 8 },
  numeroValor: { fontFamily: familia.medio, fontSize: 28, lineHeight: 34 },
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
