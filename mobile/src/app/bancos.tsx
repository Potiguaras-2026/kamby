import { useQuery } from "@tanstack/react-query";
import { Linking, StyleSheet, Text, View } from "react-native";

import { Botao } from "@/components/Botao";
import { BotaoWhatsapp } from "@/components/BotaoWhatsapp";
import { Cartao } from "@/components/Cartao";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Tela } from "@/components/Tela";
import { api, chamar } from "@/lib/api";
import { telefone } from "@/lib/formato";
import { cores, familia, tipo } from "@/lib/tema";

// shortcut: lista simples sem distância. "Pontos próximos" do Figma precisa da localização dos bancos e da mãe.
export default function TelaBancos() {
  const bancos = useQuery({ queryKey: ["bancos"], queryFn: () => chamar(api.GET("/api/v1/bancos")) });

  return (
    <Tela voltar titulo="Bancos de leite" subtitulo="Onde entregar ou tirar dúvidas sobre a doação.">
      {!bancos.data ? (
        <Estado erro={bancos.error} tentarDeNovo={() => bancos.refetch()} />
      ) : (
        bancos.data.map((b, i) => (
          <Entrada key={b.id} ordem={i + 1}>
            <Cartao style={{ gap: 4 }}>
              <Text style={[tipo.corpoForte, { color: cores.turquesaTexto, fontFamily: familia.semi }]}>{b.nome}</Text>
              <Text style={tipo.legenda}>
                {b.endereco}, {b.cidade}
              </Text>
              <Text style={tipo.legenda}>{telefone(b.telefone)}</Text>
              <View style={estilos.botoes}>
                <View style={{ flex: 1 }}>
                  <BotaoWhatsapp telefone={b.telefone} titulo="WhatsApp" compacto />
                </View>
                <View style={{ flex: 1 }}>
                  <Botao
                    titulo="Ver no mapa"
                    variante="suave"
                    compacto
                    onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.endereco}, ${b.cidade}`)}`)}
                  />
                </View>
              </View>
            </Cartao>
          </Entrada>
        ))
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  botoes: { flexDirection: "row", gap: 10, marginTop: 10 },
});
