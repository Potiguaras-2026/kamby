import type { Schemas } from "@kamby/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { MapPinPlus, Pencil, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from "react-native";

import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Folha, MenuAcoes } from "@/components/Folha";
import { Pressavel } from "@/components/Pressavel";
import { Tela } from "@/components/Tela";
import { api, chamar, lerErro } from "@/lib/api";
import { useEnderecos } from "@/lib/consultas";
import { linhaEndereco } from "@/lib/formato";
import { haptico } from "@/lib/haptico";
import { cores, familia, raio, tipo, toqueMinimo } from "@/lib/tema";

type Endereco = Schemas["EnderecoSaida"];

export default function TelaEnderecos() {
  const enderecos = useEnderecos();
  const queryClient = useQueryClient();
  const [aberto, setAberto] = useState<Endereco | null>(null);
  const [excluindo, setExcluindo] = useState<Endereco | null>(null);

  const atualizar = () => Promise.all([queryClient.invalidateQueries({ queryKey: ["enderecos"] }), queryClient.invalidateQueries({ queryKey: ["eu"] })]);

  const ativar = useMutation({
    mutationFn: (id: string) => chamar(api.POST("/api/v1/enderecos/{endereco_id}/ativar", { params: { path: { endereco_id: id } } })),
    onSuccess: async (e) => {
      haptico.sucesso();
      await atualizar();
      AccessibilityInfo.announceForAccessibility(`${e.apelido} agora é o endereço ativo.`);
    },
  });
  const excluir = useMutation({
    mutationFn: (id: string) => chamar(api.DELETE("/api/v1/enderecos/{endereco_id}", { params: { path: { endereco_id: id } } })),
    onSuccess: async () => {
      setExcluindo(null);
      await atualizar();
      AccessibilityInfo.announceForAccessibility("Endereço excluído.");
    },
  });
  const erro = ativar.error ?? excluir.error;
  const lista = enderecos.data ?? [];

  return (
    <Tela voltar titulo="Endereços cadastrados">
      {!enderecos.data ? (
        <Estado erro={enderecos.error} tentarDeNovo={() => enderecos.refetch()} />
      ) : (
        <>
          {lista.map((e, i) => (
            <Entrada key={String(e.id)} ordem={i + 1}>
              <CartaoEndereco
                endereco={e}
                onPress={() => setAberto(e)}
                onAtivar={() => ativar.mutate(String(e.id))}
                ativando={ativar.isPending && ativar.variables === String(e.id)}
              />
            </Entrada>
          ))}

          <Entrada ordem={lista.length + 1}>
            <Pressavel accessibilityRole="button" onPress={() => router.push({ pathname: "/enderecos/[id]", params: { id: "novo" } })} style={estilos.adicionar}>
              <Text style={[tipo.corpo, { color: cores.primaria }]}>Adicionar endereço</Text>
              <MapPinPlus size={22} color={cores.primaria} strokeWidth={1.8} />
            </Pressavel>
          </Entrada>

          {erro ? (
            <Text accessibilityRole="alert" style={[tipo.legenda, { color: cores.erro, textAlign: "center" }]}>
              {lerErro(erro).mensagem}
            </Text>
          ) : null}
          <Text style={[tipo.legenda, { textAlign: "center", fontSize: 13 }]}>A equipe busca o leite no endereço ativo. Toque num endereço para editar ou excluir.</Text>
        </>
      )}

      <MenuAcoes
        visivel={!!aberto}
        aoFechar={() => setAberto(null)}
        titulo={aberto?.apelido ?? ""}
        subtitulo={aberto ? linhaEndereco(aberto) : undefined}
        acoes={[
          {
            rotulo: "Editar endereço",
            icone: Pencil,
            onPress: () => {
              const id = String(aberto?.id);
              setAberto(null);
              router.push({ pathname: "/enderecos/[id]", params: { id } });
            },
          },
          // O último endereço não pode sair: a equipe precisa de um lugar para buscar o leite.
          ...(lista.length > 1
            ? [
                {
                  rotulo: "Excluir endereço",
                  icone: Trash2,
                  perigo: true,
                  onPress: () => {
                    setExcluindo(aberto);
                    setAberto(null);
                  },
                },
              ]
            : []),
        ]}
      />

      <Folha
        visivel={!!excluindo}
        aoFechar={() => setExcluindo(null)}
        perigo
        titulo={`Excluir "${excluindo?.apelido ?? ""}"?`}
        texto={excluindo?.ativo ? "É o endereço ativo. O próximo da lista passa a ser usado nas coletas." : "Coletas já agendadas não mudam de endereço."}
        confirmar="Excluir"
        manter="Manter"
        carregando={excluir.isPending}
        aoConfirmar={() => excluindo && excluir.mutate(String(excluindo.id))}
      />
    </Tela>
  );
}

function CartaoEndereco({ endereco: e, onPress, onAtivar, ativando }: { endereco: Endereco; onPress: () => void; onAtivar: () => void; ativando: boolean }) {
  return (
    // Topo e rodapé são botões separados: botão dentro de botão some para leitores de tela.
    <View style={[estilos.cartao, e.ativo && estilos.cartaoAtivo]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${e.apelido}${e.ativo ? ", endereço ativo" : ""}. ${linhaEndereco(e)}. Editar ou excluir`}
        onPress={onPress}
        style={({ pressed }) => [estilos.topo, pressed && { opacity: 0.7 }]}
      >
        <Text style={[estilos.apelido, e.ativo && { color: cores.primaria }]}>{e.apelido}</Text>
        <Text style={estilos.linha}>{linhaEndereco(e)}</Text>
      </Pressable>
      <View style={[estilos.divisoria, e.ativo && { backgroundColor: cores.rosaClaro }]} />
      <View style={estilos.rodape}>
        {e.ativo ? (
          <Text style={estilos.ativo}>ATIVO</Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Definir ${e.apelido} como ativo`}
            onPress={onAtivar}
            disabled={ativando}
            style={({ pressed }) => [estilos.definir, (pressed || ativando) && { backgroundColor: cores.rosaSuave }]}
          >
            <Text style={estilos.definirTexto}>{ativando ? "Salvando..." : "Definir como ativo"}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: { backgroundColor: cores.superficie, borderRadius: raio.g, borderWidth: 1, borderColor: cores.borda, paddingHorizontal: 18, paddingBottom: 12 },
  topo: { paddingTop: 18, paddingBottom: 16 },
  cartaoAtivo: { backgroundColor: cores.rosaSuave, borderColor: cores.rosaClaro },
  apelido: { fontFamily: familia.medio, fontSize: 18, lineHeight: 26, color: cores.texto },
  linha: { fontFamily: familia.regular, fontSize: 14, lineHeight: 20, color: cores.texto, marginTop: 4 },
  divisoria: { height: 1, backgroundColor: cores.linha, marginBottom: 10 },
  rodape: { flexDirection: "row", justifyContent: "flex-end", minHeight: toqueMinimo - 8, alignItems: "center" },
  ativo: { fontFamily: familia.semi, fontSize: 13, letterSpacing: 0.6, color: cores.turquesaTexto, paddingHorizontal: 12 },
  definir: { minHeight: toqueMinimo - 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: cores.rosaClaro, justifyContent: "center" },
  definirTexto: { fontFamily: familia.medio, fontSize: 13, color: cores.primaria },
  adicionar: {
    minHeight: toqueMinimo + 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: cores.superficie,
    borderRadius: raio.g,
    borderWidth: 1,
    borderColor: cores.borda,
    paddingHorizontal: 18,
  },
});
