import { AtSign, CirclePlay, Link, Mail, type LucideIcon } from "lucide-react-native";
import { Linking, StyleSheet, Text, View } from "react-native";

import { Cartao } from "@/components/Cartao";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Pressavel } from "@/components/Pressavel";
import { Tela } from "@/components/Tela";
import { useTextos } from "@/lib/consultas";
import { cores, raio, tipo, toqueMinimo } from "@/lib/tema";

// Os blocos vêm do admin (chaves sobre.1, sobre.2...); o visual de cada posição segue o protótipo.
const ESTILO_BLOCO: { tom?: "turquesa" | "rosa"; cor: string }[] = [
  { cor: cores.texto },
  { tom: "turquesa", cor: cores.turquesaTexto },
  { cor: cores.azulTexto },
  { tom: "rosa", cor: cores.primaria },
];

const icone = (url: string): LucideIcon =>
  url.startsWith("mailto:") ? Mail : url.includes("instagram") ? AtSign : url.includes("youtube") ? CirclePlay : Link;

export default function TelaSobre() {
  const textos = useTextos();

  if (!textos.data) {
    return (
      <Tela voltar titulo="Por trás do Kamby">
        <Estado erro={textos.error} tentarDeNovo={() => textos.refetch()} />
      </Tela>
    );
  }

  const blocos = Object.keys(textos.data)
    .filter((c) => /^sobre\.\d+$/.test(c))
    .sort((a, b) => Number(a.split(".")[1]) - Number(b.split(".")[1]))
    .map((c) => textos.data[c]);
  const contatos = (textos.data["sobre.contatos"]?.corpo ?? "")
    .split("\n")
    .map((l) => l.split("|").map((p) => p.trim()))
    .filter(([rotulo, url]) => rotulo && url);

  return (
    <Tela voltar titulo="Por trás do Kamby">
      {blocos.map((b, i) => {
        const estilo = ESTILO_BLOCO[i % ESTILO_BLOCO.length];
        const conteudo = (
          <>
            {b.titulo ? <Text style={[tipo.subtitulo, { color: estilo.cor }]}>{b.titulo}</Text> : null}
            {b.corpo.split(/\n\s*\n/).map((p) => (
              <Text key={p} style={tipo.corpo}>
                {p.trim()}
              </Text>
            ))}
          </>
        );
        return (
          <Entrada key={b.titulo + i} ordem={i + 1}>
            {i === 0 ? <View style={{ gap: 6 }}>{conteudo}</View> : <Cartao tom={estilo.tom} style={{ gap: 10 }}>{conteudo}</Cartao>}
          </Entrada>
        );
      })}

      {contatos.length ? (
        <Entrada ordem={blocos.length + 1} style={estilos.contatos}>
          {contatos.map(([rotulo, url]) => {
            const Icone = icone(url);
            return (
              <Pressavel key={url} accessibilityRole="link" accessibilityLabel={rotulo} onPress={() => Linking.openURL(url)} style={estilos.contato}>
                <Icone size={16} color={cores.azulTexto} />
                <Text style={[tipo.legenda, { color: cores.texto }]}>{rotulo}</Text>
              </Pressavel>
            );
          })}
        </Entrada>
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
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
