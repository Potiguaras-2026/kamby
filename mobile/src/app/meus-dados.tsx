import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Baby, Building2, CalendarDays, Hospital, User } from "lucide-react-native";
import { useState } from "react";
import { AccessibilityInfo, Text, View } from "react-native";

import { Botao } from "@/components/Botao";
import { Campo } from "@/components/Campo";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { SeletorBusca } from "@/components/SeletorBusca";
import { Tela } from "@/components/Tela";
import { SimNao } from "@/features/cadastro/partes";
import { api, chamar, lerErro } from "@/lib/api";
import { useEu } from "@/lib/consultas";
import { dataCompleta, dataIso, mascaraData } from "@/lib/formato";
import { haptico } from "@/lib/haptico";
import { cores, tipo } from "@/lib/tema";

type Eu = NonNullable<ReturnType<typeof useEu>["data"]>;

const LISTAS = 60 * 60_000;
const erroData = (v: string) => (v.length === 10 && !dataIso(v) ? "Confira a data. Use dia, mês e ano, como 05/04/1996." : undefined);

export default function TelaMeusDados() {
  const eu = useEu();
  if (!eu.data) {
    return (
      <Tela voltar titulo="Meus dados">
        <Estado erro={eu.error} tentarDeNovo={() => eu.refetch()} />
      </Tela>
    );
  }
  return <Formulario eu={eu.data} />;
}

function Formulario({ eu }: { eu: Eu }) {
  const queryClient = useQueryClient();
  const bancos = useQuery({ queryKey: ["bancos"], queryFn: () => chamar(api.GET("/api/v1/bancos")), staleTime: LISTAS });
  const maternidades = useQuery({ queryKey: ["maternidades"], queryFn: () => chamar(api.GET("/api/v1/bancos/maternidades")), staleTime: LISTAS });
  const [dados, setDados] = useState({
    nome_completo: eu.nome_completo,
    data_nascimento: dataCompleta(eu.data_nascimento),
    data_parto: dataCompleta(eu.data_parto),
    amamentando: eu.amamentando,
    bebe_prematuro: eu.bebe_prematuro,
    maternidade: eu.maternidade,
    banco_id: String(eu.banco.id),
  });
  const mudar = <K extends keyof typeof dados>(campo: K, valor: (typeof dados)[K]) => setDados((d) => ({ ...d, [campo]: valor }));

  const salvar = useMutation({
    mutationFn: () =>
      chamar(
        api.PUT("/api/v1/eu", {
          body: {
            ...dados,
            amamentando: !!dados.amamentando,
            bebe_prematuro: !!dados.bebe_prematuro,
            data_nascimento: dataIso(dados.data_nascimento)!,
            data_parto: dataIso(dados.data_parto)!,
          },
        }),
      ),
    onSuccess: async (novo) => {
      haptico.sucesso();
      queryClient.setQueryData(["eu"], novo);
      await queryClient.invalidateQueries({ queryKey: ["inicio"] });
      AccessibilityInfo.announceForAccessibility("Dados salvos.");
      if (router.canGoBack()) router.back();
      else router.replace("/perfil");
    },
    onError: () => haptico.aviso(),
  });
  const erro = salvar.error ? lerErro(salvar.error) : null;
  const erroCampo = (c: string) => erro?.campos[c]?.[0];
  const completo =
    dados.nome_completo.trim().length >= 3 &&
    !!dataIso(dados.data_nascimento) &&
    !!dataIso(dados.data_parto) &&
    dados.amamentando !== null &&
    dados.bebe_prematuro !== null;

  return (
    <Tela voltar titulo="Meus dados" subtitulo="Mantenha seus dados em dia para o banco de leite.">
      <Entrada ordem={1} style={{ gap: 14 }}>
        <Text accessibilityRole="header" style={tipo.subtitulo}>
          Você
        </Text>
        <Campo
          rotulo="Nome completo"
          icone={User}
          value={dados.nome_completo}
          onChangeText={(v) => mudar("nome_completo", v)}
          autoComplete="name"
          autoCapitalize="words"
          erro={erroCampo("nome_completo")}
        />
        <Campo
          rotulo="Sua data de nascimento"
          icone={CalendarDays}
          placeholder="dd/mm/aaaa"
          value={dados.data_nascimento}
          onChangeText={(v) => mudar("data_nascimento", mascaraData(v))}
          keyboardType="number-pad"
          maxLength={10}
          erro={erroCampo("data_nascimento") ?? erroData(dados.data_nascimento)}
        />
        <SimNao rotulo="Você está amamentando?" valor={dados.amamentando} onChange={(v) => mudar("amamentando", v)} erro={erroCampo("amamentando")} />
        <SeletorBusca
          rotulo="Banco de leite"
          placeholder="Escolha o banco"
          icone={Building2}
          opcoes={(bancos.data ?? []).map((b) => ({ valor: String(b.id), rotulo: b.nome, detalhe: b.endereco }))}
          valor={dados.banco_id}
          onChange={(v) => mudar("banco_id", v)}
          ajuda="Coletas já marcadas continuam com o banco de antes."
          erro={erroCampo("banco_id")}
        />
      </Entrada>

      <Entrada ordem={2} style={{ gap: 14 }}>
        <Text accessibilityRole="header" style={tipo.subtitulo}>
          Seu bebê
        </Text>
        <Campo
          rotulo="Data de nascimento do bebê"
          icone={Baby}
          placeholder="dd/mm/aaaa"
          value={dados.data_parto}
          onChangeText={(v) => mudar("data_parto", mascaraData(v))}
          keyboardType="number-pad"
          maxLength={10}
          erro={erroCampo("data_parto") ?? erroData(dados.data_parto)}
        />
        <SimNao rotulo="Seu bebê nasceu prematuro?" valor={dados.bebe_prematuro} onChange={(v) => mudar("bebe_prematuro", v)} erro={erroCampo("bebe_prematuro")} />
        <SeletorBusca
          rotulo="Maternidade onde o bebê nasceu"
          placeholder="Escolha na lista"
          icone={Hospital}
          opcional
          aceitaOutro
          opcoes={(maternidades.data ?? []).map((m) => ({ valor: m.nome, rotulo: m.nome, detalhe: m.cidade }))}
          valor={dados.maternidade}
          onChange={(v) => mudar("maternidade", v)}
          erro={erroCampo("maternidade")}
        />
      </Entrada>

      <Entrada ordem={3} style={{ gap: 10 }}>
        {erro ? (
          <Text accessibilityRole="alert" style={[tipo.legenda, { color: cores.erro, textAlign: "center" }]}>
            {erro.mensagem}
          </Text>
        ) : null}
        <Botao titulo="Salvar alterações" desabilitado={!completo} carregando={salvar.isPending} onPress={() => salvar.mutate()} />
        <View />
      </Entrada>
    </Tela>
  );
}
