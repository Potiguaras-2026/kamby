import { Linking, StyleSheet, Text } from "react-native";

import { useTexto } from "@/lib/consultas";
import { familia, raio, toqueMinimo } from "@/lib/tema";

import { IconeMarca } from "./IconeMarca";
import { Pressavel } from "./Pressavel";

// Verde escuro no texto (7:1 sobre o fundo claro); o verde da marca fica só no ícone.
const VERDE_TEXTO = "#0B6B3A";

/** Abre a conversa com o banco de leite no WhatsApp, já com uma mensagem pronta (editável no admin). */
export function BotaoWhatsapp({ telefone, titulo = "Conversar no WhatsApp", compacto }: { telefone: string; titulo?: string; compacto?: boolean }) {
  const mensagem = useTexto()("contato.whatsapp", "Olá! Sou doadora pelo Kamby e queria tirar uma dúvida.").corpo;
  const digitos = telefone.replace(/\D/g, "");
  const numero = digitos.startsWith("55") && digitos.length > 11 ? digitos : `55${digitos}`;

  return (
    <Pressavel
      accessibilityRole="link"
      accessibilityLabel={`${titulo} com o banco de leite`}
      onPress={() => Linking.openURL(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`)}
      style={[estilos.botao, compacto && estilos.compacto]}
    >
      <IconeMarca marca="whatsapp" tamanho={compacto ? 18 : 22} />
      <Text style={[estilos.texto, compacto && { fontSize: 14 }]}>{titulo}</Text>
    </Pressavel>
  );
}

const estilos = StyleSheet.create({
  botao: {
    minHeight: toqueMinimo + 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 18,
    borderRadius: raio.pilula,
    borderWidth: 1.5,
    borderColor: "#9BE3B6",
    backgroundColor: "#EAF9F0",
  },
  compacto: { minHeight: toqueMinimo - 4, paddingHorizontal: 12, gap: 6 },
  texto: { fontFamily: familia.semi, fontSize: 16, color: VERDE_TEXTO },
});
