import type { Schemas } from "@kamby/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Baby, Building2, CalendarDays, ChevronDown, ChevronUp, HeartPulse, Hospital, House, LockKeyhole, Phone, ShieldCheck, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { AccessibilityInfo, BackHandler, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Botao } from "@/components/Botao";
import { Campo } from "@/components/Campo";
import { Cartao } from "@/components/Cartao";
import { Celebracao } from "@/components/Celebracao";
import { DicaAnimada } from "@/components/DicaAnimada";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { SeletorBusca } from "@/components/SeletorBusca";
import { Tela } from "@/components/Tela";
import { CabecalhoEtapa, CartaoPergunta, Concordo, Progresso, SimNao, TextoLongo } from "@/features/cadastro/partes";
import { CAMPOS_OBRIGATORIOS, CamposEndereco, type DadosEndereco } from "@/features/enderecos/CamposEndereco";
import { api, chamar, lerErro } from "@/lib/api";
import { useTexto } from "@/lib/consultas";
import { dataIso, mascaraData, mascaraTelefone } from "@/lib/formato";
import { haptico } from "@/lib/haptico";
import { salvarTokens } from "@/lib/sessao";
import { cores, familia, tipo } from "@/lib/tema";

type Cadastro = Schemas["CadastroSaida"];

// Quatro etapas: conta, mãe e bebê, saúde (todas as perguntas numa tela), endereço com a autorização.
const TOTAL = 4;
// Listas do admin mudam pouco: não precisa buscar de novo a cada foco da janela.
const LISTAS = 10 * 60_000;
const INICIAL = {
  nome_completo: "",
  telefone: "",
  senha: "",
  data_nascimento: "",
  amamentando: null as boolean | null,
  data_parto: "",
  bebe_prematuro: null as boolean | null,
  maternidade: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  referencia: "",
  banco_id: null as string | null,
  consentimento: false,
};
type Dados = typeof INICIAL;

// Erro da API volta para a etapa do campo, para a mãe corrigir onde digitou.
const ETAPA_DO_CAMPO: Record<string, number> = {
  nome_completo: 0, telefone: 0, senha: 0, data_nascimento: 0,
  amamentando: 1, data_parto: 1, bebe_prematuro: 1, maternidade: 1,
  respostas: 2,
  cep: 3, logradouro: 3, numero: 3, complemento: 3, bairro: 3, cidade: 3, uf: 3, referencia: 3, banco_id: 3, consentimento: 3,
};

export default function TelaCadastro() {
  const texto = useTexto();
  const perguntas = useQuery({ queryKey: ["perguntas"], queryFn: () => chamar(api.GET("/api/v1/triagem/perguntas")), staleTime: LISTAS });
  const bancos = useQuery({ queryKey: ["bancos"], queryFn: () => chamar(api.GET("/api/v1/bancos")), staleTime: LISTAS });
  const maternidades = useQuery({ queryKey: ["maternidades"], queryFn: () => chamar(api.GET("/api/v1/bancos/maternidades")), staleTime: LISTAS });

  const [etapa, setEtapa] = useState(0);
  const [termoAberto, setTermoAberto] = useState(false);
  const [dados, setDados] = useState(INICIAL);
  const [respostas, setRespostas] = useState<Record<string, boolean>>({});
  const [detalhes, setDetalhes] = useState<Record<string, string>>({});
  const [conta, setConta] = useState<Cadastro | null>(null);

  const mudar = <K extends keyof Dados>(campo: K, valor: Dados[K]) => setDados((d) => ({ ...d, [campo]: valor }));

  // Um banco só (caso de hoje em Natal) já vem escolhido.
  useEffect(() => {
    if (bancos.data?.length && !dados.banco_id) mudar("banco_id", String(bancos.data[0].id));
  }, [bancos.data, dados.banco_id]);

  const enviar = useMutation({
    mutationFn: () =>
      chamar(
        api.POST("/api/v1/auth/cadastro", {
          body: {
            ...dados,
            email: "",
            amamentando: !!dados.amamentando,
            bebe_prematuro: !!dados.bebe_prematuro,
            banco_id: dados.banco_id ?? "",
            data_nascimento: dataIso(dados.data_nascimento) ?? "",
            data_parto: dataIso(dados.data_parto) ?? "",
            respostas,
            detalhes,
          },
        }),
      ),
    onSuccess: (t) => {
      haptico.sucesso();
      setConta(t);
      setEtapa(4);
    },
    onError: (e) => {
      haptico.aviso();
      const campos = Object.keys(lerErro(e).campos);
      const primeira = Math.min(...campos.map((c) => ETAPA_DO_CAMPO[c] ?? 3));
      if (Number.isFinite(primeira)) setEtapa(primeira);
    },
  });
  const erro = enviar.error ? lerErro(enviar.error) : null;
  const erroCampo = (c: string) => erro?.campos[c]?.[0];

  const lista = perguntas.data ?? [];

  function voltar() {
    if (etapa === 0 || etapa === 4) return router.back();
    setEtapa(etapa - 1);
  }

  // Avançar é sempre um toque da mãe no botão: nada passa sozinho.
  function avancar() {
    haptico.selecao();
    setEtapa(etapa + 1);
    AccessibilityInfo.announceForAccessibility(`Etapa ${etapa + 2} de ${TOTAL}`);
  }

  // O voltar do Android volta uma etapa, sem perder o que foi digitado.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (etapa === 0 || etapa === 4) return false;
      voltar();
      return true;
    });
    return () => sub.remove();
  });

  if (!perguntas.data || !bancos.data) {
    return (
      <Tela publica voltar>
        <Estado erro={perguntas.error ?? bancos.error} tentarDeNovo={() => (perguntas.refetch(), bancos.refetch())} />
      </Tela>
    );
  }

  const titulo = (chave: string, reserva: string) => {
    const t = texto(chave);
    return { titulo: t.titulo || reserva, texto: t.corpo };
  };
  const erroData = (v: string) => (v.length === 10 && !dataIso(v) ? "Confira a data. Use dia, mês e ano, como 05/04/1996." : undefined);

  const etapaUm = (() => {
    const tel = dados.telefone.replace(/\D/g, "");
    return dados.nome_completo.trim().length >= 3 && tel.length >= 10 && dados.senha.length >= 8 && !!dataIso(dados.data_nascimento);
  })();
  const etapaDois = dados.amamentando !== null && dados.bebe_prematuro !== null && !!dataIso(dados.data_parto);
  const respondidas = lista.filter((p) => respostas[p.codigo] !== undefined).length;
  const etapaQuatro = CAMPOS_OBRIGATORIOS.every((c) => dados[c].trim()) && !!dados.banco_id && dados.consentimento;
  const consentimento = texto("cadastro.consentimento");
  const aprovada = conta?.status === "apta";
  const final = texto(aprovada ? "cadastro.aprovado" : "cadastro.enviado");
  const faltam = lista.length - respondidas;

  return (
    // key: cada etapa abre no topo da tela.
    <Tela key={etapa} publica voltar={etapa < 4} aoVoltar={voltar}>
      {etapa < 4 ? <Progresso etapa={etapa + 1} total={TOTAL} /> : null}

      {etapa === 0 ? (
        <Entrada key="conta" style={estilos.grupo}>
          <CabecalhoEtapa icone={User} {...titulo("cadastro.conta", "Sua conta")} />
          <DicaAnimada tom="rosa" selo="Bem-vinda" titulo={texto("cadastro.dica_conta").titulo || "Leva só 3 minutinhos"} texto={texto("cadastro.dica_conta").corpo} />
          <Campo
            rotulo="Nome completo"
            icone={User}
            placeholder="Como está no seu documento"
            value={dados.nome_completo}
            onChangeText={(v) => mudar("nome_completo", v)}
            autoComplete="name"
            textContentType="name"
            autoCapitalize="words"
            erro={erroCampo("nome_completo")}
          />
          <Campo
            rotulo="Celular com DDD"
            icone={Phone}
            placeholder="(84) 91234-5678"
            ajuda="É com ele que você entra no app."
            value={dados.telefone}
            onChangeText={(v) => mudar("telefone", mascaraTelefone(v))}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={15}
            erro={erroCampo("telefone")}
          />
          <Campo
            rotulo="Sua data de nascimento"
            icone={CalendarDays}
            placeholder="dd/mm/aaaa"
            value={dados.data_nascimento}
            onChangeText={(v) => mudar("data_nascimento", mascaraData(v))}
            keyboardType="number-pad"
            autoComplete="birthdate-full"
            maxLength={10}
            erro={erroCampo("data_nascimento") ?? erroData(dados.data_nascimento)}
          />
          <Campo
            rotulo="Crie uma senha"
            icone={LockKeyhole}
            placeholder="Mínimo de 8 caracteres"
            ajuda="Use letras e números. Não precisa de símbolo."
            value={dados.senha}
            onChangeText={(v) => mudar("senha", v)}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            erro={erroCampo("senha")}
          />
          <Botao titulo="Continuar" desabilitado={!etapaUm} onPress={avancar} />
          <Text style={[tipo.legenda, { textAlign: "center" }]}>
            Já tem conta?{" "}
            <Text accessibilityRole="link" onPress={() => router.back()} style={{ color: cores.primaria, fontFamily: familia.semi }}>
              Entrar
            </Text>
          </Text>
        </Entrada>
      ) : null}

      {etapa === 1 ? (
        <Entrada key="mae" style={estilos.grupo}>
          <CabecalhoEtapa icone={Baby} tom="turquesa" {...titulo("cadastro.mae_bebe", "Você e seu bebê")} />
          <SimNao rotulo="Você está amamentando?" valor={dados.amamentando} onChange={(v) => mudar("amamentando", v)} erro={erroCampo("amamentando")} />
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
            ajuda="Não achou? Digite o nome na busca."
            erro={erroCampo("maternidade")}
          />
          <DicaAnimada tom="rosa" titulo={texto("cadastro.aviso_leite").titulo || "Doar não faz faltar leite!"} texto={texto("cadastro.aviso_leite").corpo} />
          <Botao titulo="Continuar" desabilitado={!etapaDois} onPress={avancar} />
        </Entrada>
      ) : null}

      {etapa === 2 ? (
        <Entrada key="saude" style={estilos.grupo}>
          <CabecalhoEtapa icone={HeartPulse} {...titulo("cadastro.saude", "Sua saúde importa")} />
          <DicaAnimada titulo={texto("cadastro.dica_saude").titulo || "Sem resposta certa ou errada"} texto={texto("cadastro.dica_saude").corpo} />
          <Text style={estilos.contador} accessibilityLiveRegion="polite">
            {respondidas} de {lista.length} respondidas
          </Text>
          {lista.map((p, i) => (
            <CartaoPergunta
              key={p.codigo}
              numero={i + 1}
              pergunta={p}
              resposta={respostas[p.codigo]}
              detalhe={detalhes[p.codigo] ?? ""}
              responder={(v) => setRespostas((r) => ({ ...r, [p.codigo]: v }))}
              detalhar={(t) => setDetalhes((d) => ({ ...d, [p.codigo]: t }))}
            />
          ))}
          {erroCampo("respostas") ? <Text style={[tipo.legenda, { color: cores.erro }]}>{erro?.mensagem}</Text> : null}
          <Botao titulo={faltam ? (faltam === 1 ? "Falta 1 resposta" : "Faltam " + faltam + " respostas") : "Continuar"} desabilitado={faltam > 0} onPress={avancar} />
          <Text style={[tipo.legenda, { textAlign: "center" }]}>{texto("cadastro.criterios", "Critérios sujeitos à avaliação do banco de leite.").corpo}</Text>
        </Entrada>
      ) : null}

      {etapa === 3 ? (
        <Entrada key="endereco" style={estilos.grupo}>
          <CabecalhoEtapa icone={House} tom="turquesa" {...titulo("cadastro.endereco", "Onde você mora?")} />
          <DicaAnimada titulo={texto("cadastro.dica_endereco").titulo || "A gente vai até você"} texto={texto("cadastro.dica_endereco").corpo} />
          <CamposEndereco
            dados={dados}
            mudar={(c: keyof DadosEndereco, v) => mudar(c, v)}
            preencher={(e) => setDados((d) => ({ ...d, logradouro: e.logradouro || d.logradouro, bairro: e.bairro || d.bairro, cidade: e.cidade, uf: e.uf }))}
            erro={erroCampo}
          />
          {bancos.data.length > 1 ? (
            <SeletorBusca
              rotulo="Banco de leite"
              placeholder="Escolha o banco"
              icone={Building2}
              opcoes={bancos.data.map((b) => ({ valor: String(b.id), rotulo: b.nome, detalhe: b.endereco }))}
              valor={dados.banco_id ?? ""}
              onChange={(v) => mudar("banco_id", v)}
              ajuda="Escolha o mais perto de você. Dá para trocar depois no perfil."
              erro={erroCampo("banco_id")}
            />
          ) : bancos.data[0] ? (
            <Text style={tipo.legenda}>
              Banco de leite de referência: <Text style={{ color: cores.texto, fontFamily: familia.medio }}>{bancos.data[0].nome}</Text>
            </Text>
          ) : null}

          <Cartao tom="rosa" style={{ gap: 10 }}>
            <View style={estilos.termoTopo}>
              <ShieldCheck size={24} color={cores.primaria} />
              <Text style={[tipo.corpoForte, { flex: 1, color: cores.primaria, fontFamily: familia.semi }]}>{consentimento.titulo || "Seus dados, seu cuidado"}</Text>
            </View>
            {termoAberto ? (
              <TextoLongo corpo={consentimento.corpo} />
            ) : (
              <Text style={tipo.legenda}>Usamos seus dados só para cuidar da doação. A equipe que busca o leite não vê suas respostas de saúde.</Text>
            )}
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: termoAberto }} onPress={() => setTermoAberto(!termoAberto)} style={estilos.lerTudo}>
              <Text style={[tipo.legenda, { color: cores.primaria, fontFamily: familia.semi }]}>{termoAberto ? "Mostrar menos" : "Ler como usamos seus dados"}</Text>
              {termoAberto ? <ChevronUp size={16} color={cores.primaria} /> : <ChevronDown size={16} color={cores.primaria} />}
            </Pressable>
          </Cartao>
          <Concordo
            texto={texto("cadastro.consentimento_aceite", "Li e concordo com o uso dos meus dados, inclusive os de saúde, para esse cuidado.").corpo}
            marcado={dados.consentimento}
            onChange={(v) => mudar("consentimento", v)}
            erro={erroCampo("consentimento")}
          />
          {erro && !Object.keys(erro.campos).length ? (
            <Text accessibilityRole="alert" style={[tipo.legenda, { color: cores.erro, textAlign: "center" }]}>
              {erro.mensagem}
            </Text>
          ) : null}
          <Botao titulo="Criar minha conta" desabilitado={!etapaQuatro} carregando={enviar.isPending} onPress={() => enviar.mutate()} />
        </Entrada>
      ) : null}

      {etapa === 4 ? (
        <Entrada key="enviado" style={estilos.grupo}>
          <Celebracao
            titulo={final.titulo || (aprovada ? "Cadastro aprovado!" : "Cadastro enviado!")}
            texto={final.corpo || (aprovada ? "Você já pode pedir seu kit de frascos." : "O banco de leite vai analisar seus dados e avisa você por aqui.")}
          />
          <Cartao tom="rosa" style={{ gap: 2 }}>
            <Text style={tipo.corpoForte}>{dados.nome_completo}</Text>
            <Text style={tipo.legenda}>{dados.telefone}</Text>
            <Text style={tipo.legenda}>
              {dados.bairro}, {dados.cidade}/{dados.uf}
            </Text>
          </Cartao>
          <Botao titulo="Ir para o início" onPress={() => conta && salvarTokens(conta)} />
        </Entrada>
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: 18 },
  contador: { fontFamily: familia.semi, fontSize: 13, color: cores.primaria, textTransform: "uppercase", letterSpacing: 0.4 },
  termoTopo: { flexDirection: "row", alignItems: "center", gap: 10 },
  lerTudo: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 32 },
});
