import * as SecureStore from "expo-secure-store";
import { useSyncExternalStore } from "react";

export type Tokens = { access: string; refresh: string };
type Estado = { carregada: boolean; tokens: Tokens | null };

const CHAVE = "kamby.tokens";
const ouvintes = new Set<() => void>();
let estado: Estado = { carregada: false, tokens: null };

// Store fora do React porque o cliente da API também lê e renova os tokens.
function definir(novo: Estado) {
  estado = novo;
  ouvintes.forEach((ouvinte) => ouvinte());
}

export async function carregarSessao() {
  const salvo = await SecureStore.getItemAsync(CHAVE);
  definir({ carregada: true, tokens: salvo ? JSON.parse(salvo) : null });
}

export async function salvarTokens(tokens: Tokens | null) {
  if (tokens) await SecureStore.setItemAsync(CHAVE, JSON.stringify(tokens));
  else await SecureStore.deleteItemAsync(CHAVE);
  definir({ carregada: true, tokens });
}

export const lerTokens = () => estado.tokens;

export function useSessao() {
  return useSyncExternalStore(
    (ouvinte) => {
      ouvintes.add(ouvinte);
      return () => ouvintes.delete(ouvinte);
    },
    () => estado,
  );
}
