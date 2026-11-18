import type { Schemas } from "@kamby/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlaskConical } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native";

import { Botao } from "@/components/Botao";
import { api, chamar, lerErro } from "@/lib/api";
import { useInicio } from "@/lib/consultas";
import { haptico } from "@/lib/haptico";
import { cores, demo, familia, raio, tipo } from "@/lib/tema";

import { etapaAtual } from "./Jornada";

const INTERVALO_MS = 2200;

const proxima = (etapas: Schemas["EtapaSaida"][]) => etapas.find((e) => e.estado === "pendente");

/**
 * Só no modo demonstração (a API diz em `demo`): a mãe faz o papel da equipe do banco
 * e vê esta coleta andar, uma etapa por toque ou todas em sequência.
 */
export function SimularDoacao({ coleta }: { coleta: Schemas["ColetaSaida"] }) {
  const inicio = useInicio();
  const id = String(coleta.id);
  const queryClient = useQueryClient();
  const [automatico, setAutomatico] = useState(false);
  const rodando = useRef(false);

  const avancar = useMutation({
    mutationFn: () => chamar(api.POST("/api/v1/demo/coletas/{coleta_id}/avancar", { params: { path: { coleta_id: id } } })),
    onSuccess: (dados) => {
      queryClient.setQueryData(["coleta", id], dados);
      queryClient.invalidateQueries({ queryKey: ["inicio"] });
      queryClient.invalidateQueries({ queryKey: ["coletas"] });
      haptico.sucesso();
      const atual = etapaAtual(dados.etapas);
      AccessibilityInfo.announceForAccessibility(atual ? `Agora: ${atual.etapa.rotulo}` : "Leite entregue ao banco");
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
        if (!proxima(dados.etapas)) break;
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

  const seguinte = proxima(coleta.etapas);
  // Cancelada, sem ninguém em casa ou já no banco: não há o que simular.
  if (!inicio.data?.demo || !seguinte || coleta.status === "cancelada" || coleta.status === "ausente") return null;

  return (
    <View style={estilos.caixa}>
      <View style={estilos.topo}>
        <FlaskConical size={16} color={demo.texto} />
        <Text style={estilos.selo}>Modo demonstração</Text>
      </View>
      <Text style={tipo.legenda}>
        Nada aqui é uma coleta real. Faça o papel da equipe do banco e veja a doação andar.{" "}
        <Text style={{ color: cores.texto, fontFamily: familia.medio }}>Próxima: {seguinte.rotulo}.</Text>
      </Text>
      <View style={estilos.botoes}>
        <View style={{ flex: 1 }}>
          <Botao titulo="Avançar etapa" variante="demo" compacto carregando={avancar.isPending && !automatico} desabilitado={automatico} onPress={() => avancar.mutate()} />
        </View>
        <View style={{ flex: 1 }}>
          <Botao titulo={automatico ? "Parar" : "Simular tudo"} variante="demoContorno" compacto onPress={automatico ? parar : simularTudo} />
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
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: demo.borda,
    backgroundColor: demo.fundo,
  },
  topo: { flexDirection: "row", alignItems: "center", gap: 6 },
  selo: { fontFamily: familia.semi, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", color: demo.texto },
  botoes: { flexDirection: "row", gap: 10 },
});
