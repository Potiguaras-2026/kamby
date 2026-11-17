import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlaskConical } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native";

import { Botao } from "@/components/Botao";
import { api, chamar, lerErro } from "@/lib/api";
import { useInicio } from "@/lib/consultas";
import { haptico } from "@/lib/haptico";
import { cores, familia, raio, tipo } from "@/lib/tema";

import { etapaAtual } from "./Jornada";

const INTERVALO_MS = 2200;

/**
 * Só no modo demonstração (a API diz em `demo`): a mãe faz o papel da equipe do banco
 * e vê a doação andar, uma etapa por toque ou todas em sequência.
 */
export function SimularDoacao() {
  const inicio = useInicio();
  const queryClient = useQueryClient();
  const [automatico, setAutomatico] = useState(false);
  const rodando = useRef(false);

  const avancar = useMutation({
    mutationFn: () => chamar(api.POST("/api/v1/demo/proxima-etapa")),
    onSuccess: (dados) => {
      queryClient.setQueryData(["inicio"], dados);
      haptico.sucesso();
      const atual = etapaAtual(dados.jornada);
      AccessibilityInfo.announceForAccessibility(atual ? `Agora: ${atual.etapa.rotulo}` : "Doação concluída");
    },
  });

  // Sai da tela: a sequência para.
  useEffect(() => () => void (rodando.current = false), []);

  async function simularTudo() {
    rodando.current = true;
    setAutomatico(true);
    while (rodando.current) {
      try {
        const dados = await avancar.mutateAsync();
        if (!etapaAtual(dados.jornada)) break;
      } catch {
        break;
      }
      await new Promise((r) => setTimeout(r, INTERVALO_MS));
    }
    rodando.current = false;
    setAutomatico(false);
  }

  function parar() {
    rodando.current = false;
    setAutomatico(false);
  }

  if (!inicio.data?.demo) return null;
  const atual = etapaAtual(inicio.data.jornada);

  return (
    <View style={estilos.caixa}>
      <View style={estilos.topo}>
        <FlaskConical size={18} color={cores.azulTexto} />
        <Text style={estilos.selo}>Modo demonstração</Text>
      </View>
      <Text style={tipo.legenda}>
        Faça o papel da equipe do banco e veja a doação andar.{" "}
        <Text style={{ color: cores.texto, fontFamily: familia.medio }}>{atual ? `Próxima: ${atual.etapa.rotulo}.` : "Ciclo completo: avance para começar outra coleta."}</Text>
      </Text>
      <View style={estilos.botoes}>
        <View style={{ flex: 1 }}>
          <Botao titulo="Avançar etapa" compacto carregando={avancar.isPending && !automatico} desabilitado={automatico} onPress={() => avancar.mutate()} />
        </View>
        <View style={{ flex: 1 }}>
          <Botao titulo={automatico ? "Parar" : "Simular tudo"} variante="secundaria" compacto onPress={automatico ? parar : simularTudo} />
        </View>
      </View>
      {avancar.error ? (
        <Text accessibilityRole="alert" style={[tipo.legenda, { color: cores.erro }]}>
          {lerErro(avancar.error).mensagem}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: {
    gap: 10,
    padding: 16,
    borderRadius: raio.g,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#A9BEE0",
    backgroundColor: "#F2F6FC",
  },
  topo: { flexDirection: "row", alignItems: "center", gap: 6 },
  selo: { fontFamily: familia.semi, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", color: cores.azulTexto },
  botoes: { flexDirection: "row", gap: 10 },
});
