import { Image, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import Svg, { Path } from "react-native-svg";

import { cores, familia, raio } from "@/lib/tema";

import { Pressavel } from "./Pressavel";

const TONS = {
  rosa: { fundo: "#FBD0E7", cor: cores.primaria },
  turquesa: { fundo: "#C8F0EC", cor: cores.turquesaTexto },
  azul: { fundo: "#D6E3F8", cor: cores.azulTexto },
};

type Props = {
  titulo: string;
  texto?: string;
  tom: keyof typeof TONS;
  onPress?: () => void;
  /** Ilustração encaixada à direita, cortada pela borda de baixo. */
  imagem?: ImageSourcePropType;
  larguraImagem?: number;
  alturaImagem?: number;
  /** Versão menor, para três lado a lado. */
  compacto?: boolean;
};

/** Sem `onPress`, o cartão fica cinza e inativo. */
export function CartaoOnda({ titulo, texto, tom, onPress, imagem, larguraImagem = 120, alturaImagem = 96, compacto }: Props) {
  const ativo = !!onPress;
  const t = ativo ? TONS[tom] : { fundo: cores.desabilitado, cor: cores.textoSuave };
  return (
    <Pressavel
      accessibilityRole="button"
      accessibilityLabel={texto ? `${titulo}. ${texto}` : titulo}
      accessibilityState={{ disabled: !ativo }}
      disabled={!ativo}
      onPress={onPress}
      style={[estilos.cartao, compacto && estilos.compacto, { backgroundColor: t.fundo }]}
    >
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 200 120" preserveAspectRatio="none" pointerEvents="none">
        <Path d="M0 0H200V58C150 78 95 36 0 54Z" fill="#FFFFFF" opacity={0.3} />
      </Svg>
      {imagem ? (
        <Image
          source={imagem}
          resizeMode="contain"
          style={[estilos.imagem, { width: larguraImagem, height: alturaImagem }, !ativo && { opacity: 0.45 }]}
          accessibilityIgnoresInvertColors
        />
      ) : null}
      <View style={[estilos.texto, imagem ? { paddingRight: larguraImagem + 8 } : null]}>
        <Text numberOfLines={compacto ? 3 : 1} style={[compacto ? estilos.tituloCompacto : estilos.titulo, { color: t.cor }]}>
          {titulo}
        </Text>
        {texto ? <Text style={estilos.descricao}>{texto}</Text> : null}
      </View>
    </Pressavel>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    flex: 1,
    minHeight: 104,
    borderRadius: raio.g,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    paddingHorizontal: 18,
    justifyContent: "center",
    overflow: "hidden",
  },
  compacto: { minHeight: 84, paddingHorizontal: 12 },
  texto: { gap: 2, paddingVertical: 14 },
  imagem: { position: "absolute", right: 14, bottom: -10 },
  titulo: { fontFamily: familia.semi, fontSize: 19, lineHeight: 24 },
  tituloCompacto: { fontFamily: familia.semi, fontSize: 14, lineHeight: 18 },
  descricao: { fontFamily: familia.regular, fontSize: 13, lineHeight: 18, color: "#4A4048" },
});
