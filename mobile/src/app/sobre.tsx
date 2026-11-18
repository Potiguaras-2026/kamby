import { ExternalLink, Globe } from "lucide-react-native";
import { Image, Linking, StyleSheet, Text, View } from "react-native";

import { Cartao } from "@/components/Cartao";
import { Entrada } from "@/components/Entrada";
import { IconeMarca, type Marca } from "@/components/IconeMarca";
import { Estado } from "@/components/Estado";
import { Pressavel } from "@/components/Pressavel";
import { Tela } from "@/components/Tela";
import { IMAGENS } from "@/features/conteudo/imagens";
import { useTextos } from "@/lib/consultas";
import { cores, raio, tipo, toqueMinimo } from "@/lib/tema";

// Os blocos vêm do admin (chaves sobre.1, sobre.2...); o visual de cada posição segue o protótipo.
const ESTILO_BLOCO: { tom?: "turquesa" | "rosa"; cor: string }[] = [
  { cor: cores.texto },
  { tom: "turquesa", cor: cores.turquesaTexto },
  { cor: cores.azulTexto },
  { tom: "rosa", cor: cores.primaria },
];

// O ícone sai do endereço: o admin só escreve "rótulo | url".
const marca = (url: string): Marca | null =>
  url.startsWith("mailto:") ? "gmail" : url.includes("instagram") ? "instagram" : url.includes("youtube") ? "youtube" : url.includes("wa.me") ? "whatsapp" : null;

function Icone({ url }: { url: string }) {
  const m = marca(url);
  return m ? <IconeMarca marca={m} tamanho={22} /> : <Globe size={22} color={cores.azulTexto} />;
}

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

      <Entrada ordem={blocos.length + 1}>
        <Cartao style={estilos.equipe}>
          {/* Proporção na caixa, não na imagem: na web a Image ignora aspectRatio e usa a altura original, sobrando branco. */}
          <View style={estilos.foto}>
            <Image source={IMAGENS.equipe} style={{ width: "100%", height: "100%" }} resizeMode="contain" accessibilityLabel="Foto da equipe Potiguaras, seis estudantes do IFRN sorrindo" />
          </View>
          <Image source={IMAGENS.potiguaras} style={estilos.logo} resizeMode="contain" accessibilityLabel="Logo Potiguaras" />
          <Text style={[tipo.legenda, { textAlign: "center" }]}>Feito pela equipe Potiguaras, do IFRN, em Natal.</Text>
        </Cartao>
      </Entrada>

      {contatos.length ? (
        <Entrada ordem={blocos.length + 2} style={estilos.contatos}>
          {contatos.map(([rotulo, url]) => (
            <Pressavel key={url} accessibilityRole="link" accessibilityLabel={`${rotulo}, abre fora do app`} onPress={() => Linking.openURL(url)} style={estilos.contato}>
              <Icone url={url} />
              <Text style={[tipo.corpoForte, { flex: 1, fontSize: 14 }]} numberOfLines={1}>
                {rotulo}
              </Text>
              <ExternalLink size={16} color={cores.textoSuave} />
            </Pressavel>
          ))}
        </Entrada>
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  equipe: { alignItems: "center", gap: 10, paddingTop: 12 },
  foto: { width: "100%", aspectRatio: 551 / 407 },
  logo: { width: 104, height: 65 },
  contatos: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  contato: {
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: toqueMinimo + 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: raio.g,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
  },
});
