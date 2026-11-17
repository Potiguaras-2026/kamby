import { Landmark, MapPin, Navigation, Signpost } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Campo } from "@/components/Campo";
import { buscarCep, type EnderecoCep } from "@/lib/cep";
import { mascaraCep } from "@/lib/formato";
import { cores, familia, tipo } from "@/lib/tema";

export type DadosEndereco = {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  referencia: string;
};

export const CAMPOS_OBRIGATORIOS: (keyof DadosEndereco)[] = ["cep", "logradouro", "numero", "bairro", "cidade", "uf"];

type Props = {
  dados: DadosEndereco;
  mudar: (campo: keyof DadosEndereco, valor: string) => void;
  preencher: (endereco: EnderecoCep) => void;
  erro: (campo: keyof DadosEndereco) => string | undefined;
};

/**
 * O CEP preenche rua, bairro, cidade e UF. Cidade e UF ficam numa linha só quando vieram do CEP;
 * se a busca falhar (ou a pessoa tocar em "alterar"), viram campos para digitar.
 */
export function CamposEndereco({ dados, mudar, preencher, erro }: Props) {
  const [buscando, setBuscando] = useState(false);
  const [achou, setAchou] = useState(false);
  const [naoAchou, setNaoAchou] = useState(false);
  const [editarCidade, setEditarCidade] = useState(false);

  async function mudarCep(valor: string) {
    const cep = mascaraCep(valor);
    mudar("cep", cep);
    setNaoAchou(false);
    setAchou(false);
    if (cep.replace(/\D/g, "").length !== 8) return;
    setBuscando(true);
    const endereco = await buscarCep(cep);
    setBuscando(false);
    if (endereco) {
      preencher(endereco);
      setAchou(true);
    } else setNaoAchou(true);
  }

  const campo = (c: keyof DadosEndereco) => ({ value: dados[c], onChangeText: (v: string) => mudar(c, v), erro: erro(c) });
  const cidadeEmCampos = editarCidade || naoAchou || !dados.cidade || !!erro("cidade") || !!erro("uf");

  return (
    <View style={estilos.campos}>
      <Campo
        rotulo="CEP"
        icone={Navigation}
        placeholder="00000-000"
        keyboardType="number-pad"
        autoComplete="postal-code"
        textContentType="postalCode"
        maxLength={9}
        carregando={buscando}
        valido={achou}
        ajuda={naoAchou ? "Não achamos esse CEP. Preencha o endereço abaixo." : "Digite o CEP e a gente preenche o resto."}
        {...campo("cep")}
        onChangeText={mudarCep}
      />
      {!cidadeEmCampos ? (
        <View style={estilos.cidade}>
          <MapPin size={18} color={cores.turquesaTexto} />
          <Text style={[tipo.corpoForte, { flex: 1 }]}>
            {dados.cidade} - {dados.uf}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Alterar cidade" onPress={() => setEditarCidade(true)} hitSlop={12}>
            <Text style={[tipo.legenda, { color: cores.primaria, fontFamily: familia.semi }]}>Alterar</Text>
          </Pressable>
        </View>
      ) : null}
      <Campo rotulo="Rua" icone={Signpost} placeholder="Ex.: Rua das Flores" autoComplete="street-address" {...campo("logradouro")} />
      <View style={estilos.linha}>
        <View style={{ width: 120 }}>
          <Campo rotulo="Número" placeholder="123" keyboardType="numbers-and-punctuation" {...campo("numero")} />
        </View>
        <View style={{ flex: 1 }}>
          <Campo rotulo="Complemento" opcional placeholder="Apto, bloco" {...campo("complemento")} />
        </View>
      </View>
      <Campo rotulo="Bairro" icone={Landmark} placeholder="Ex.: Petrópolis" {...campo("bairro")} />
      {cidadeEmCampos ? (
        <View style={estilos.linha}>
          <View style={{ flex: 1 }}>
            <Campo rotulo="Cidade" placeholder="Natal" {...campo("cidade")} />
          </View>
          <View style={{ width: 84 }}>
            <Campo rotulo="UF" placeholder="RN" autoCapitalize="characters" maxLength={2} {...campo("uf")} />
          </View>
        </View>
      ) : null}
      <Campo
        rotulo="Ponto de referência"
        opcional
        placeholder="Ex.: portão azul, perto da padaria"
        ajuda="Ajuda a equipe a achar sua casa."
        {...campo("referencia")}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  campos: { gap: 16 },
  linha: { flexDirection: "row", gap: 12 },
  cidade: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: cores.turquesaSuave,
    marginTop: -6,
  },
});
