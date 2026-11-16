import { AtSign, CirclePlay, Mail, type LucideIcon } from "lucide-react-native";
import { Linking, StyleSheet, Text, View } from "react-native";

import { Cartao } from "@/components/Cartao";
import { Entrada } from "@/components/Entrada";
import { Pressavel } from "@/components/Pressavel";
import { Tela } from "@/components/Tela";
import { cores, familia, raio, tipo, toqueMinimo } from "@/lib/tema";

const CONTATOS: { rotulo: string; icone: LucideIcon; url: string }[] = [
  { rotulo: "ifrn_potiguaras", icone: AtSign, url: "https://instagram.com/ifrn_potiguaras" },
  { rotulo: "Potiguaras", icone: CirclePlay, url: "https://www.youtube.com/results?search_query=Potiguaras+IFRN" },
  { rotulo: "ifrn.potiguaras@gmail.com", icone: Mail, url: "mailto:ifrn.potiguaras@gmail.com" },
];

export default function TelaSobre() {
  return (
    <Tela voltar titulo="Por trás do Kamby">
      <Entrada ordem={1} style={{ gap: 6 }}>
        <Text style={tipo.subtitulo}>Tecnologia que conecta amor e vida</Text>
        <Text style={tipo.corpo}>
          O <Text style={{ color: cores.primaria, fontFamily: familia.medio }}>Kamby</Text> foi criado para facilitar a doação de leite materno,
          conectando mães doadoras a bebês que precisam, de forma simples, segura e acolhedora.
        </Text>
      </Entrada>

      <Entrada ordem={2}>
        <Cartao tom="turquesa" style={{ gap: 10 }}>
          <Text style={[tipo.subtitulo, { color: cores.turquesaTexto }]}>Quem somos</Text>
          <Text style={tipo.corpo}>
            Somos a equipe <Text style={estilos.forte}>Potiguaras</Text>, estudantes do curso de Informática para Internet do IFRN, Campus Natal
            Central. Unimos tecnologia e impacto social para transformar realidades.
          </Text>
          <Text style={tipo.legenda}>
            Equipe: <Text style={estilos.forte}>Amanda Lara, Caio Henrique, Clara Teodósio, Ermesson Andrade, Lucas Cássio e Heitor de França</Text>.
          </Text>
          <View style={estilos.fatos}>
            <Fato rotulo="Onde" valor="Natal, RN" />
            <Fato rotulo="Orientador" valor="Leonardo Minora" />
          </View>
        </Cartao>
      </Entrada>

      <Entrada ordem={3}>
        <Cartao style={{ gap: 10 }}>
          <Text style={[tipo.subtitulo, { color: cores.azulTexto }]}>Equipe Potiguaras</Text>
          <Text style={tipo.corpo}>
            Nosso nome homenageia os povos indígenas Potiguaras, originários do litoral potiguar: suas raízes, sua cultura e a força de um povo
            que cuida, protege e compartilha.
          </Text>
        </Cartao>
      </Entrada>

      <Entrada ordem={4}>
        <Cartao tom="rosa" style={{ gap: 12 }}>
          <Text style={[tipo.subtitulo, { color: cores.primaria }]}>Sobre o Kamby</Text>
          <Text style={tipo.corpo}>
            Acreditamos que doar leite materno é um gesto simples e poderoso, capaz de salvar vidas, principalmente de bebês prematuros.
          </Text>
          <View style={estilos.nome}>
            <Text style={tipo.corpo}>
              O nome <Text style={estilos.forte}>Kamby</Text> vem do tupi-guarani e significa <Text style={{ fontStyle: "italic" }}>leite, líquido do seio</Text>:
              nutrir, acolher e transformar realidades com pequenos gestos.
            </Text>
          </View>
        </Cartao>
      </Entrada>

      <Entrada ordem={5} style={estilos.contatos}>
        {CONTATOS.map(({ rotulo, icone: Icone, url }) => (
          <Pressavel key={rotulo} accessibilityRole="link" accessibilityLabel={rotulo} onPress={() => Linking.openURL(url)} style={estilos.contato}>
            <Icone size={16} color={cores.azulTexto} />
            <Text style={[tipo.legenda, { color: cores.texto }]}>{rotulo}</Text>
          </Pressavel>
        ))}
      </Entrada>
    </Tela>
  );
}

function Fato({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[tipo.legenda, { fontSize: 12, lineHeight: 16 }]}>{rotulo}</Text>
      <Text style={[estilos.forte, { fontSize: 14 }]}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  forte: { fontFamily: familia.semi, color: cores.texto },
  fatos: { flexDirection: "row", gap: 16, paddingTop: 4 },
  nome: { backgroundColor: cores.ambarSuave, borderRadius: raio.m, padding: 14, borderWidth: 1, borderColor: "#F5DFB6" },
  contatos: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  contato: {
    minHeight: toqueMinimo - 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: raio.pilula,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
  },
});
