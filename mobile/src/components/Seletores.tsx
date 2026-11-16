import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useRef, useState, type ComponentRef, type ReactNode } from "react";
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { haptico } from "@/lib/haptico";
import { cores, familia, raio, sombra, tipo, toqueMinimo } from "@/lib/tema";

type Ancora = { x: number; y: number; largura: number; altura: number };

function useAncora() {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [ancora, setAncora] = useState<Ancora | null>(null);
  const abrir = () => ref.current?.measureInWindow((x, y, largura, altura) => setAncora({ x, y, largura, altura }));
  return { ref, ancora, abrir, fechar: () => setAncora(null) };
}

function Popover({ ancora, alturaEstimada, largura, fechar, children }: { ancora: Ancora | null; alturaEstimada: number; largura?: number; fechar: () => void; children: ReactNode }) {
  if (!ancora) return null;
  const cabeEmbaixo = ancora.y + ancora.altura + alturaEstimada + 16 < Dimensions.get("window").height;
  const w = largura ?? ancora.largura;
  return (
    <Modal transparent visible animationType="none" onRequestClose={fechar} statusBarTranslucent>
      <Pressable style={StyleSheet.absoluteFill} onPress={fechar} accessibilityRole="button" accessibilityLabel="Fechar" />
      <Animated.View
        entering={FadeIn.duration(140)}
        accessibilityViewIsModal
        style={[
          estilos.popover,
          { left: ancora.x + ancora.largura - w, width: w },
          cabeEmbaixo ? { top: ancora.y + ancora.altura + 6 } : { top: Math.max(16, ancora.y - alturaEstimada - 6) },
        ]}
      >
        {children}
      </Animated.View>
    </Modal>
  );
}

type Opcao = { valor: string; rotulo: string };

export function Seletor({ rotulo, opcoes, selecionado, onChange }: { rotulo: string; opcoes: Opcao[]; selecionado: string | null; onChange: (v: string) => void }) {
  const { ref, ancora, abrir, fechar } = useAncora();
  const atual = opcoes.find((o) => o.valor === selecionado);
  return (
    <View style={estilos.linha}>
      <Text style={[tipo.corpo, estilos.rotulo]}>{rotulo}</Text>
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}: ${atual ? atual.rotulo : "não escolhido"}`}
        accessibilityState={{ expanded: !!ancora }}
        onPress={abrir}
        style={[estilos.caixa, !!ancora && { borderColor: cores.primaria }]}
      >
        <Text style={[estilos.valor, !atual && { color: cores.textoSuave }]}>{atual ? atual.rotulo : "Escolher"}</Text>
        <ChevronDown size={18} color={cores.texto} />
      </Pressable>
      <Popover ancora={ancora} alturaEstimada={opcoes.length * 44} fechar={fechar}>
        {opcoes.map((o, i) => {
          const marcado = o.valor === selecionado;
          return (
            <Pressable
              key={o.valor}
              accessibilityRole="radio"
              accessibilityState={{ checked: marcado }}
              onPress={() => {
                haptico.selecao();
                onChange(o.valor);
                fechar();
              }}
              style={({ pressed }) => [estilos.opcao, i > 0 && estilos.opcaoDivisoria, (marcado || pressed) && { backgroundColor: marcado ? cores.rosaClaro : cores.rosaSuave }]}
            >
              <Text numberOfLines={1} style={[estilos.valor, marcado && { fontFamily: familia.semi }]}>{o.rotulo}</Text>
            </Pressable>
          );
        })}
      </Popover>
    </View>
  );
}

const SEMANA = ["Se", "Te", "Qu", "Qu", "Se", "Sa", "Do"];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const paraData = (s: string) => new Date(`${s}T12:00:00`);

/** Só os dias que o banco aceita podem ser escolhidos. */
export function SeletorData({ rotulo, dias, selecionado, onChange }: { rotulo: string; dias: string[]; selecionado: string | null; onChange: (d: string) => void }) {
  const { ref, ancora, abrir, fechar } = useAncora();
  const validos = new Set(dias);
  const primeiro = selecionado ? paraData(selecionado) : dias.length ? paraData(dias[0]) : new Date();
  const [mes, setMes] = useState(new Date(primeiro.getFullYear(), primeiro.getMonth(), 1, 12));

  const meses = dias.map((d) => d.slice(0, 7));
  const chave = iso(mes).slice(0, 7);
  const podeVoltar = meses.some((m) => m < chave);
  const podeAvancar = meses.some((m) => m > chave);
  const mudarMes = (delta: number) => setMes(new Date(mes.getFullYear(), mes.getMonth() + delta, 1, 12));

  const deslocamento = (mes.getDay() + 6) % 7;
  const total = Math.ceil((deslocamento + new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()) / 7) * 7;
  const celulas = Array.from({ length: total }, (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i - deslocamento + 1, 12));

  const tituloMes = mes.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).replace(" de ", " ");
  const escolhido = selecionado ? paraData(selecionado) : null;

  return (
    <View style={estilos.linha}>
      <Text style={[tipo.corpo, estilos.rotulo]}>{rotulo}</Text>
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}: ${escolhido ? escolhido.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }) : "não escolhida"}`}
        onPress={abrir}
        style={estilos.data}
      >
        {escolhido ? (
          <Text style={estilos.valor}>
            {escolhido.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}, {escolhido.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
          </Text>
        ) : null}
        <CalendarDays size={24} color={cores.rosa} strokeWidth={1.8} />
      </Pressable>
      <Popover ancora={ancora} alturaEstimada={330} largura={Math.min(300, Dimensions.get("window").width - 40)} fechar={fechar}>
        <View style={estilos.calendario}>
          <View style={estilos.cabecalhoMes}>
            <BotaoMes icone="voltar" desabilitado={!podeVoltar} onPress={() => mudarMes(-1)} />
            <Text style={[tipo.corpoForte, { textTransform: "capitalize" }]} accessibilityLiveRegion="polite">
              {tituloMes}
            </Text>
            <BotaoMes icone="avancar" desabilitado={!podeAvancar} onPress={() => mudarMes(1)} />
          </View>
          <View style={estilos.grade}>
            {SEMANA.map((s, i) => (
              <Text key={i} style={estilos.diaSemana}>
                {s}
              </Text>
            ))}
            {celulas.map((d) => {
              const chaveDia = iso(d);
              const doMes = d.getMonth() === mes.getMonth();
              const valido = validos.has(chaveDia);
              const marcado = chaveDia === selecionado;
              return (
                <View key={chaveDia} style={estilos.celula}>
                  <Pressable
                    disabled={!valido}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !valido, selected: marcado }}
                    accessibilityLabel={d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                    onPress={() => {
                      haptico.selecao();
                      onChange(chaveDia);
                      fechar();
                    }}
                    style={[estilos.dia, valido && estilos.diaValido, marcado && estilos.diaMarcado]}
                  >
                    <Text
                      style={[
                        estilos.diaTexto,
                        !doMes && { opacity: 0.35 },
                        !valido && { color: cores.textoSuave },
                        marcado && { color: cores.sobrePrimaria },
                      ]}
                    >
                      {d.getDate()}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      </Popover>
    </View>
  );
}

function BotaoMes({ icone, desabilitado, onPress }: { icone: "voltar" | "avancar"; desabilitado: boolean; onPress: () => void }) {
  const Icone = icone === "voltar" ? ChevronLeft : ChevronRight;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={icone === "voltar" ? "Mês anterior" : "Próximo mês"}
      disabled={desabilitado}
      onPress={onPress}
      style={[estilos.botaoMes, desabilitado && { opacity: 0.3 }]}
    >
      <Icone size={18} color={cores.texto} strokeWidth={2.4} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  rotulo: { flex: 1, fontSize: 15, lineHeight: 22 },
  linha: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: toqueMinimo },
  caixa: {
    minHeight: 40,
    // Largura fixa: a caixa não pula quando o valor troca, e a lista cabe "08h00 - 09h30".
    minWidth: 148,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: cores.rosaClaro,
    borderRadius: 10,
    backgroundColor: cores.superficie,
  },
  valor: { fontFamily: familia.regular, fontSize: 15, color: cores.texto, fontVariant: ["tabular-nums"] },
  data: { minHeight: toqueMinimo, flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 8 },
  popover: {
    position: "absolute",
    backgroundColor: cores.superficie,
    borderRadius: raio.g,
    borderWidth: 1,
    borderColor: cores.rosaClaro,
    overflow: "hidden",
    ...sombra.media,
  },
  opcao: { minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  opcaoDivisoria: { borderTopWidth: 1, borderTopColor: cores.rosaClaro },
  calendario: { padding: 14, gap: 10, backgroundColor: "#F5F3F4" },
  cabecalhoMes: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  botaoMes: { width: 36, height: 36, borderRadius: 18, backgroundColor: cores.superficie, alignItems: "center", justifyContent: "center" },
  grade: { flexDirection: "row", flexWrap: "wrap" },
  diaSemana: { width: `${100 / 7}%`, textAlign: "center", fontFamily: familia.semi, fontSize: 12, color: cores.texto, paddingVertical: 6 },
  celula: { width: `${100 / 7}%`, padding: 2 },
  dia: { height: 34, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  diaValido: { backgroundColor: cores.superficie },
  // primaria (não rosa) para o número branco ter contraste.
  diaMarcado: { backgroundColor: cores.primaria },
  diaTexto: { fontFamily: familia.medio, fontSize: 13, color: cores.texto },
});
