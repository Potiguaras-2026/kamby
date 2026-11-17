import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { haptico } from "@/lib/haptico";
import { cores, familia, raio, tipo, toqueMinimo } from "@/lib/tema";

/** Barra do Figma: um traço por etapa, preenchido até a atual. */
export function Progresso({ etapa, total }: { etapa: number; total: number }) {
  return (
    <View style={{ gap: 6 }} accessible accessibilityRole="progressbar" accessibilityLabel={`Etapa ${etapa} de ${total}`}>
      <Text style={[tipo.legenda, { color: cores.primaria, fontFamily: familia.semi, textAlign: "right" }]}>
        Etapa {etapa} de {total}
      </Text>
      <View style={estilos.tracos}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[estilos.traco, i < etapa && { backgroundColor: cores.primaria }]} />
        ))}
      </View>
    </View>
  );
}

/** Sim/Não lado a lado. `null` é ainda sem resposta. */
export function SimNao({ rotulo, valor, onChange, erro }: { rotulo: string; valor: boolean | null; onChange: (v: boolean) => void; erro?: string }) {
  return (
    <View style={{ gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={rotulo}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <View style={estilos.linha}>
        {[true, false].map((opcao) => {
          const marcado = valor === opcao;
          return (
            <Pressable
              key={String(opcao)}
              accessibilityRole="radio"
              accessibilityState={{ checked: marcado }}
              accessibilityLabel={opcao ? "Sim" : "Não"}
              onPress={() => {
                haptico.selecao();
                onChange(opcao);
              }}
              style={[estilos.opcao, marcado && estilos.opcaoMarcada]}
            >
              {marcado ? <Check size={18} color={cores.sobrePrimaria} strokeWidth={3} /> : null}
              <Text style={[estilos.opcaoTexto, marcado && { color: cores.sobrePrimaria }]}>{opcao ? "Sim" : "Não"}</Text>
            </Pressable>
          );
        })}
      </View>
      {erro ? <Text style={[tipo.legenda, { color: cores.erro }]}>{erro}</Text> : null}
    </View>
  );
}

export function Concordo({ texto, marcado, onChange, erro }: { texto: string; marcado: boolean; onChange: (v: boolean) => void; erro?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={texto}
        accessibilityState={{ checked: marcado }}
        onPress={() => {
          haptico.selecao();
          onChange(!marcado);
        }}
        style={[estilos.concordo, erro ? { borderColor: cores.erro } : null]}
      >
        <View style={[estilos.caixa, marcado && estilos.caixaMarcada]}>{marcado ? <Check size={16} color={cores.sobrePrimaria} strokeWidth={3} /> : null}</View>
        <Text style={[tipo.corpo, { flex: 1 }]}>{texto}</Text>
      </Pressable>
      {erro ? <Text style={[tipo.legenda, { color: cores.erro }]}>{erro}</Text> : null}
    </View>
  );
}

/** Corpo de texto do admin: linha em branco separa blocos; num bloco com várias linhas, a primeira é o título. */
export function TextoLongo({ corpo }: { corpo: string }) {
  return (
    <View style={{ gap: 14 }}>
      {corpo.split(/\n\s*\n/).map((bloco) => {
        const [primeira, ...resto] = bloco.trim().split("\n");
        return (
          <View key={bloco} style={{ gap: 4 }}>
            {resto.length ? <Text style={tipo.corpoForte}>{primeira}</Text> : null}
            <Text style={tipo.corpo}>{resto.length ? resto.join("\n") : primeira}</Text>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  tracos: { flexDirection: "row", gap: 6 },
  traco: { flex: 1, height: 4, borderRadius: 2, backgroundColor: cores.rosaClaro },
  rotulo: { fontFamily: familia.medio, fontSize: 14, color: cores.texto },
  linha: { flexDirection: "row", gap: 12 },
  opcao: {
    flex: 1,
    minHeight: toqueMinimo + 4,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: raio.m,
    borderWidth: 1.5,
    borderColor: cores.borda,
    backgroundColor: cores.rosaSuave,
  },
  opcaoMarcada: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  opcaoTexto: { fontFamily: familia.semi, fontSize: 16, color: cores.primaria },
  concordo: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 14,
    minHeight: toqueMinimo,
    borderRadius: raio.g,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.rosaSuave,
  },
  caixa: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: cores.bordaCampo, alignItems: "center", justifyContent: "center" },
  caixaMarcada: { backgroundColor: cores.primaria, borderColor: cores.primaria },
});
