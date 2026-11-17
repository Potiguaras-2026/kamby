import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Campo } from "@/components/Campo";
import { buscarCep, type EnderecoCep } from "@/lib/cep";
import { mascaraCep } from "@/lib/formato";
import { cores, tipo } from "@/lib/tema";

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

/** O CEP preenche rua, bairro, cidade e UF; se a busca falhar, a pessoa digita. */
export function CamposEndereco({ dados, mudar, preencher, erro }: Props) {
  const [buscando, setBuscando] = useState(false);
  const [naoAchou, setNaoAchou] = useState(false);

  async function mudarCep(valor: string) {
    const cep = mascaraCep(valor);
    mudar("cep", cep);
    setNaoAchou(false);
    if (cep.replace(/\D/g, "").length !== 8) return;
    setBuscando(true);
    const endereco = await buscarCep(cep);
    setBuscando(false);
    if (endereco) preencher(endereco);
    else setNaoAchou(true);
  }

  const campo = (c: keyof DadosEndereco) => ({ value: dados[c], onChangeText: (v: string) => mudar(c, v), erro: erro(c) });

  return (
    <View style={estilos.campos}>
      <View style={{ gap: 4 }}>
        <Campo rotulo="CEP" placeholder="00000-000" keyboardType="number-pad" autoComplete="postal-code" textContentType="postalCode" {...campo("cep")} onChangeText={mudarCep} />
        {buscando ? <Text style={tipo.legenda}>Buscando endereço...</Text> : null}
        {naoAchou ? <Text style={tipo.legenda}>Não achamos esse CEP. Preencha o endereço abaixo.</Text> : null}
      </View>
      <Campo rotulo="Rua" autoComplete="street-address" {...campo("logradouro")} />
      <View style={estilos.linha}>
        <View style={{ width: 110 }}>
          <Campo rotulo="Número" {...campo("numero")} />
        </View>
        <View style={{ flex: 1 }}>
          <Campo rotulo="Complemento" placeholder="Opcional" {...campo("complemento")} />
        </View>
      </View>
      <Campo rotulo="Bairro" {...campo("bairro")} />
      <View style={estilos.linha}>
        <View style={{ flex: 1 }}>
          <Campo rotulo="Cidade" {...campo("cidade")} />
        </View>
        <View style={{ width: 80 }}>
          <Campo rotulo="UF" autoCapitalize="characters" maxLength={2} {...campo("uf")} />
        </View>
      </View>
      <Campo rotulo="Ponto de referência" placeholder="Opcional. Ex.: portão azul" {...campo("referencia")} />
      <Text style={[tipo.legenda, { color: cores.textoSuave }]}>O ponto de referência ajuda a equipe a achar sua casa.</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  campos: { gap: 14 },
  linha: { flexDirection: "row", gap: 12 },
});
