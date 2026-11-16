import * as SecureStore from "expo-secure-store";
import { useSyncExternalStore } from "react";
import { Platform } from "react-native";

type Tokens = { access: string; refresh: string };
type Estado = { carregada: boolean; tokens: Tokens | null };

const CHAVE = "kamby.tokens";

// SecureStore não existe no navegador; a versão web serve só para pré-visualizar telas.
const cofre =
  Platform.OS === "web"
    ? {
        getItemAsync: async (k: string) => localStorage.getItem(k),
        setItemAsync: async (k: string, v: string) => localStorage.setItem(k, v),
        deleteItemAsync: async (k: string) => localStorage.removeItem(k),
      }
    : SecureStore;
const ouvintes = new Set<() => void>();
let estado: Estado = { carregada: false, tokens: null };

// Store fora do React porque o cliente da API também lê e renova os tokens.
function definir(novo: Estado) {
  estado = novo;
  ouvintes.forEach((ouvinte) => ouvinte());
}

export async function carregarSessao() {
  const salvo = await cofre.getItemAsync(CHAVE);
  definir({ carregada: true, tokens: salvo ? JSON.parse(salvo) : null });
}

export async function salvarTokens(tokens: Tokens | null) {
  if (tokens) await cofre.setItemAsync(CHAVE, JSON.stringify(tokens));
  else await cofre.deleteItemAsync(CHAVE);
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
