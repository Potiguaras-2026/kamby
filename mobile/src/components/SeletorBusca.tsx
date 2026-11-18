import { Check, ChevronDown, type LucideIcon, Plus, Search, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { haptico } from "@/lib/haptico";
import { cores, familia, raio, tipo, toqueMinimo } from "@/lib/tema";

import { Campo, estilosCampo } from "./Campo";

export type OpcaoBusca = { valor: string; rotulo: string; detalhe?: string };

type Props = {
  rotulo: string;
  placeholder: string;
  opcoes: OpcaoBusca[];
  valor: string;
  onChange: (valor: string) => void;
  icone?: LucideIcon;
  opcional?: boolean;
  ajuda?: string;
  erro?: string;
  /** Deixa usar o que foi digitado quando não está na lista. */
  aceitaOutro?: boolean;
};

// Busca sem acento e sem maiúscula: "januario" acha "Januário".
const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Campo de escolha com busca, para listas longas (maternidades, bairros). Abre uma folha com a lista. */
export function SeletorBusca({ rotulo, placeholder, opcoes, valor, onChange, icone: Icone, opcional, ajuda, erro, aceitaOutro }: Props) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const insets = useSafeAreaInsets();

  const filtradas = useMemo(() => {
    const termo = normalizar(busca);
    return termo ? opcoes.filter((o) => normalizar(`${o.rotulo} ${o.detalhe ?? ""}`).includes(termo)) : opcoes;
  }, [busca, opcoes]);
  const exato = opcoes.some((o) => normalizar(o.rotulo) === normalizar(busca));
  const escolhida = opcoes.find((o) => o.valor === valor);

  function escolher(v: string) {
    haptico.selecao();
    onChange(v);
    setAberto(false);
    setBusca("");
  }

  return (
    <View style={{ gap: 6 }}>
      <View style={estilos.topo}>
        <Text style={estilosCampo.rotulo}>{rotulo}</Text>
        {opcional ? <Text style={estilos.opcional}>(opcional)</Text> : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}: ${valor || "nenhuma escolhida"}. Toque para escolher`}
        onPress={() => setAberto(true)}
        style={[estilosCampo.caixa, { borderColor: erro ? cores.erro : cores.bordaCampo, paddingRight: 14 }]}
      >
        {Icone ? <Icone size={20} color={cores.textoSuave} strokeWidth={2} /> : null}
        <Text numberOfLines={1} style={[estilos.valor, !valor && { color: "#9A8F96" }]}>
          {escolhida?.rotulo ?? (valor || placeholder)}
        </Text>
        <ChevronDown size={20} color={cores.textoSuave} />
      </Pressable>
      {erro ? <Text style={[tipo.legenda, { color: cores.erro }]}>{erro}</Text> : ajuda ? <Text style={[tipo.legenda, { fontSize: 13 }]}>{ajuda}</Text> : null}

      <Modal visible={aberto} animationType="slide" transparent onRequestClose={() => setAberto(false)} statusBarTranslucent>
        <Pressable style={estilos.fundo} onPress={() => setAberto(false)} accessibilityRole="button" accessibilityLabel="Fechar lista" />
        <View style={[estilos.folha, { paddingBottom: insets.bottom + 16 }]} accessibilityViewIsModal>
          <View style={estilos.alca} />
          <View style={estilos.cabecalho}>
            <Text accessibilityRole="header" style={[tipo.subtitulo, { flex: 1 }]}>
              {rotulo}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={() => setAberto(false)} style={estilos.fechar}>
              <X size={22} color={cores.texto} />
            </Pressable>
          </View>
          <Campo rotulo="Buscar" icone={Search} placeholder="Digite o nome" value={busca} onChangeText={setBusca} autoFocus autoCorrect={false} returnKeyType="search" />
          <FlatList
            data={filtradas}
            keyExtractor={(o) => o.valor}
            keyboardShouldPersistTaps="handled"
            style={{ flexGrow: 0 }}
            ListEmptyComponent={<Text style={[tipo.legenda, { paddingVertical: 12 }]}>Nada encontrado com esse nome.</Text>}
            renderItem={({ item }) => {
              const marcada = item.valor === valor;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: marcada }}
                  onPress={() => escolher(item.valor)}
                  style={({ pressed }) => [estilos.item, marcada && estilos.itemMarcado, pressed && { opacity: 0.7 }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[tipo.corpo, marcada && { color: cores.primaria, fontFamily: familia.semi }]}>{item.rotulo}</Text>
                    {item.detalhe ? <Text style={[tipo.legenda, { fontSize: 13 }]}>{item.detalhe}</Text> : null}
                  </View>
                  {marcada ? <Check size={20} color={cores.primaria} strokeWidth={2.6} /> : null}
                </Pressable>
              );
            }}
            ListFooterComponent={
              aceitaOutro && busca.trim() && !exato ? (
                <Pressable accessibilityRole="button" onPress={() => escolher(busca.trim())} style={estilos.outro}>
                  <Plus size={20} color={cores.primaria} />
                  <Text style={[tipo.corpoForte, { color: cores.primaria, flex: 1 }]}>Usar “{busca.trim()}”</Text>
                </Pressable>
              ) : undefined
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  topo: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  opcional: { fontFamily: familia.regular, fontSize: 13, color: cores.textoSuave },
  valor: { flex: 1, fontFamily: familia.regular, fontSize: 16, color: cores.texto },
  fundo: { flex: 1, backgroundColor: "rgba(36, 27, 34, 0.4)" },
  folha: {
    maxHeight: "85%",
    // Na web o app fica numa moldura de celular (440px); sem isso a lista ocupa a janela toda.
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    backgroundColor: cores.fundo,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
  },
  alca: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: cores.rosaClaro },
  cabecalho: { flexDirection: "row", alignItems: "center" },
  fechar: { width: toqueMinimo, height: toqueMinimo, alignItems: "center", justifyContent: "center", marginRight: -12 },
  item: {
    minHeight: toqueMinimo + 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: raio.g,
  },
  itemMarcado: { backgroundColor: cores.rosaSuave },
  outro: { minHeight: toqueMinimo, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, marginTop: 4 },
});
