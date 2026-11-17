import type { Schemas } from "@kamby/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Baby, CalendarDays, Hospital, LockKeyhole, Mail, Phone, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { AccessibilityInfo, BackHandler, Platform, StyleSheet, Text, View } from "react-native";

import { Botao } from "@/components/Botao";
import { Campo } from "@/components/Campo";
import { Cartao } from "@/components/Cartao";
import { Celebracao } from "@/components/Celebracao";
import { Entrada } from "@/components/Entrada";
import { Estado } from "@/components/Estado";
import { Seletor } from "@/components/Seletores";
import { Tela } from "@/components/Tela";
import { Concordo, Progresso, SimNao, TextoLongo } from "@/features/cadastro/partes";
import { CAMPOS_OBRIGATORIOS, CamposEndereco, type DadosEndereco } from "@/features/enderecos/CamposEndereco";
import { api, chamar, lerErro } from "@/lib/api";
import { useTexto } from "@/lib/consultas";
import { dataIso, mascaraData, mascaraTelefone } from "@/lib/formato";
import { haptico } from "@/lib/haptico";
import { salvarTokens } from "@/lib/sessao";
import { cores, familia, tipo } from "@/lib/tema";

type Tokens = Schemas["TokensSaida"];

const TOTAL = 6;
const INICIAL = {
  nome_completo: "",
  telefone: "",
  email: "",
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
  nome_completo: 0, telefone: 0, email: 0, senha: 0, data_nascimento: 0,
  amamentando: 1, data_parto: 1, bebe_prematuro: 1, maternidade: 1,
  respostas: 2,
  cep: 3, logradouro: 3, numero: 3, complemento: 3, bairro: 3, cidade: 3, uf: 3, referencia: 3, banco_id: 3,
  consentimento: 4,
};

export default function TelaCadastro() {
  const texto = useTexto();
  const perguntas = useQuery({ queryKey: ["perguntas"], queryFn: () => chamar(api.GET("/api/v1/triagem/perguntas")) });
  const bancos = useQuery({ queryKey: ["bancos"], queryFn: () => chamar(api.GET("/api/v1/bancos")) });

  const [etapa, setEtapa] = useState(0);
  const [pergunta, setPergunta] = useState(0);
  const [dados, setDados] = useState(INICIAL);
  const [respostas, setRespostas] = useState<Record<string, boolean>>({});
  const [detalhes, setDetalhes] = useState<Record<string, string>>({});
  const [tokens, setTokens] = useState<Tokens | null>(null);

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
      setTokens(t);
      setEtapa(5);
    },
    onError: (e) => {
      haptico.aviso();
      const campos = Object.keys(lerErro(e).campos);
      const primeira = Math.min(...campos.map((c) => ETAPA_DO_CAMPO[c] ?? 4));
      if (Number.isFinite(primeira)) {
        setEtapa(primeira);
        if (primeira === 2) setPergunta(0);
      }
    },
  });
  const erro = enviar.error ? lerErro(enviar.error) : null;
  const erroCampo = (c: string) => erro?.campos[c]?.[0];

  const lista = perguntas.data ?? [];

  function voltar() {
    if (etapa === 0 || etapa === 5) return router.back();
    if (etapa === 2 && pergunta > 0) return setPergunta(pergunta - 1);
    if (etapa === 3 && lista.length) setPergunta(lista.length - 1);
    setEtapa(etapa - 1);
  }

  function avancar() {
    if (etapa === 2 && pergunta < lista.length - 1) return setPergunta(pergunta + 1);
    if (etapa === 2) setPergunta(lista.length - 1);
    setEtapa(etapa + 1);
    AccessibilityInfo.announceForAccessibility(`Etapa ${etapa + 2} de ${TOTAL}`);
  }

  // O voltar do Android volta uma etapa, sem perder o que foi digitado.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (etapa === 0 || etapa === 5) return false;
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

  const cabecalho = (chave: string, reserva: string, subtitulo?: string) => {
    const t = { ...texto(chave), ...(subtitulo ? { corpo: subtitulo } : {}) };
    return (
      <View style={{ gap: 4 }}>
        <Text accessibilityRole="header" style={tipo.titulo}>
          {t.titulo || reserva}
        </Text>
        {t.corpo ? <Text style={[tipo.corpo, { color: cores.textoSuave }]}>{t.corpo}</Text> : null}
      </View>
    );
  };

  const etapaUm = (() => {
    const tel = dados.telefone.replace(/\D/g, "");
    return dados.nome_completo.trim().length >= 3 && tel.length >= 10 && /\S+@\S+\.\S+/.test(dados.email) && dados.senha.length >= 8 && !!dataIso(dados.data_nascimento);
  })();
  const etapaDois = dados.amamentando !== null && dados.bebe_prematuro !== null && !!dataIso(dados.data_parto);
  const atual = lista[pergunta];
  const respondida = atual ? respostas[atual.codigo] !== undefined : true;
  const pedeDetalhe = atual && atual.detalhe_se && respostas[atual.codigo] === (atual.detalhe_se === "sim");
  const etapaQuatro = CAMPOS_OBRIGATORIOS.every((c) => dados[c].trim()) && !!dados.banco_id;

  return (
    // key: cada etapa e pergunta abre no topo da tela.
    <Tela key={`${etapa}-${etapa === 2 ? pergunta : 0}`} publica voltar={etapa < 5} aoVoltar={voltar}>
      {etapa < 5 ? <Progresso etapa={etapa + 1} total={TOTAL} /> : null}

      {etapa === 0 ? (
        <Entrada key="conta" style={estilos.grupo}>
          {cabecalho("cadastro.conta", "Sua conta")}
          <Campo rotulo="Nome completo" icone={User} value={dados.nome_completo} onChangeText={(v) => mudar("nome_completo", v)} autoComplete="name" textContentType="name" erro={erroCampo("nome_completo")} />
          <Campo
            rotulo="Telefone com DDD"
            icone={Phone}
            placeholder="(84) 91234-5678"
            value={dados.telefone}
            onChangeText={(v) => mudar("telefone", mascaraTelefone(v))}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            erro={erroCampo("telefone")}
          />
          <Campo rotulo="E-mail" icone={Mail} value={dados.email} onChangeText={(v) => mudar("email", v)} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" erro={erroCampo("email")} />
          <Campo
            rotulo="Sua data de nascimento"
            icone={CalendarDays}
            placeholder="dd/mm/aaaa"
            value={dados.data_nascimento}
            onChangeText={(v) => mudar("data_nascimento", mascaraData(v))}
            keyboardType="number-pad"
            autoComplete="birthdate-full"
            erro={erroCampo("data_nascimento") ?? (dados.data_nascimento.length === 10 && !dataIso(dados.data_nascimento) ? "Confira a data. Use dia, mês e ano, como 05/04/1996." : undefined)}
          />
          <View style={{ gap: 4 }}>
            <Campo rotulo="Crie uma senha" icone={LockKeyhole} value={dados.senha} onChangeText={(v) => mudar("senha", v)} secureTextEntry autoComplete="new-password" textContentType="newPassword" erro={erroCampo("senha")} />
            <Text style={tipo.legenda}>Use pelo menos 8 caracteres.</Text>
          </View>
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
          {cabecalho("cadastro.mae_bebe", "Você e seu bebê")}
          <SimNao rotulo="Você está amamentando?" valor={dados.amamentando} onChange={(v) => mudar("amamentando", v)} erro={erroCampo("amamentando")} />
          <Campo
            rotulo="Nascimento do bebê"
            icone={Baby}
            placeholder="dd/mm/aaaa"
            value={dados.data_parto}
            onChangeText={(v) => mudar("data_parto", mascaraData(v))}
            keyboardType="number-pad"
            erro={erroCampo("data_parto") ?? (dados.data_parto.length === 10 && !dataIso(dados.data_parto) ? "Confira a data. Use dia, mês e ano, como 05/04/1996." : undefined)}
          />
          <SimNao rotulo="Seu bebê nasceu prematuro?" valor={dados.bebe_prematuro} onChange={(v) => mudar("bebe_prematuro", v)} erro={erroCampo("bebe_prematuro")} />
          <Campo rotulo="Maternidade do parto" icone={Hospital} placeholder="Opcional" value={dados.maternidade} onChangeText={(v) => mudar("maternidade", v)} erro={erroCampo("maternidade")} />
          <Cartao tom="turquesa" style={{ gap: 4 }}>
            <Text style={[tipo.corpoForte, { color: cores.turquesaTexto }]}>{texto("cadastro.aviso_leite").titulo || "Doar não faz faltar leite para o seu bebê"}</Text>
            <Text style={tipo.legenda}>{texto("cadastro.aviso_leite").corpo}</Text>
          </Cartao>
          <Botao titulo="Continuar" desabilitado={!etapaDois} onPress={avancar} />
        </Entrada>
      ) : null}

      {etapa === 2 && atual ? (
        <Entrada key={`p-${atual.codigo}`} style={estilos.grupo}>
          {cabecalho("cadastro.saude", "Sua saúde importa")}
          <Text style={estilos.contador}>
            Pergunta {pergunta + 1} de {lista.length}
          </Text>
          <Cartao style={{ gap: 8 }}>
            <Text accessibilityRole="header" style={tipo.subtitulo}>
              {atual.texto}
            </Text>
            {atual.ajuda ? <Text style={tipo.legenda}>{atual.ajuda}</Text> : null}
          </Cartao>
          <SimNao
            rotulo="Sua resposta"
            valor={respostas[atual.codigo] ?? null}
            onChange={(v) => {
              setRespostas((r) => ({ ...r, [atual.codigo]: v }));
              // Como no Figma: tocar na resposta já segue, a não ser que ela peça um detalhe.
              const precisaDetalhe = !!atual.detalhe_se && v === (atual.detalhe_se === "sim");
              if (!precisaDetalhe) setTimeout(avancar, 250);
            }}
          />
          {pedeDetalhe ? (
            <Campo
              rotulo={atual.detalhe_rotulo || "Conte um pouco mais"}
              placeholder="Escreva aqui"
              multiline
              value={detalhes[atual.codigo] ?? ""}
              onChangeText={(v) => setDetalhes((d) => ({ ...d, [atual.codigo]: v }))}
            />
          ) : null}
          {erroCampo("respostas") ? <Text style={[tipo.legenda, { color: cores.erro }]}>{erro?.mensagem}</Text> : null}
          <Botao titulo="Continuar" desabilitado={!respondida} onPress={avancar} />
          <Text style={[tipo.legenda, { textAlign: "center" }]}>{texto("cadastro.criterios", "Critérios sujeitos à avaliação do banco de leite.").corpo}</Text>
        </Entrada>
      ) : null}

      {etapa === 3 ? (
        <Entrada key="endereco" style={estilos.grupo}>
          {cabecalho("cadastro.endereco", "Onde você mora?")}
          <CamposEndereco
            dados={dados}
            mudar={(c: keyof DadosEndereco, v) => mudar(c, v)}
            preencher={(e) => setDados((d) => ({ ...d, logradouro: e.logradouro || d.logradouro, bairro: e.bairro || d.bairro, cidade: e.cidade, uf: e.uf }))}
            erro={erroCampo}
          />
          {bancos.data.length > 1 ? (
            <Cartao>
              <Seletor
                rotulo="Banco de leite"
                opcoes={bancos.data.map((b) => ({ valor: String(b.id), rotulo: b.nome }))}
                selecionado={dados.banco_id}
                onChange={(v) => mudar("banco_id", v)}
              />
            </Cartao>
          ) : bancos.data[0] ? (
            <Text style={tipo.legenda}>
              Banco de leite de referência: <Text style={{ color: cores.texto, fontFamily: familia.medio }}>{bancos.data[0].nome}</Text>
            </Text>
          ) : null}
          <Botao titulo="Continuar" desabilitado={!etapaQuatro} onPress={avancar} />
        </Entrada>
      ) : null}

      {etapa === 4 ? (
        <Entrada key="consentimento" style={estilos.grupo}>
          {cabecalho("cadastro.consentimento", "Seus dados, seu cuidado", "Leia com calma antes de enviar.")}
          <Cartao>
            <TextoLongo corpo={texto("cadastro.consentimento").corpo} />
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
          <Botao titulo="Enviar cadastro" desabilitado={!dados.consentimento} carregando={enviar.isPending} onPress={() => enviar.mutate()} />
        </Entrada>
      ) : null}

      {etapa === 5 ? (
        <Entrada key="enviado" style={estilos.grupo}>
          <Celebracao titulo={texto("cadastro.enviado").titulo || "Cadastro enviado!"} texto={texto("cadastro.enviado", "O banco de leite vai analisar seus dados e avisa você por aqui.").corpo} />
          <Cartao tom="rosa" style={{ gap: 2 }}>
            <Text style={tipo.corpoForte}>{dados.nome_completo}</Text>
            <Text style={tipo.legenda}>{dados.telefone}</Text>
            <Text style={tipo.legenda}>
              {dados.bairro}, {dados.cidade}/{dados.uf}
            </Text>
          </Cartao>
          <Botao titulo="Ir para o início" onPress={() => tokens && salvarTokens(tokens)} />
        </Entrada>
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: 16 },
  contador: { fontFamily: familia.semi, fontSize: 13, color: cores.primaria, textTransform: "uppercase", letterSpacing: 0.4 },
});
