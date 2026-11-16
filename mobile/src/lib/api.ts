import type { ErroApi, paths } from "@kamby/api";
import createClient from "openapi-fetch";

import { lerTokens, salvarTokens } from "./sessao";

const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:8000";

export const api = createClient<paths>({ baseUrl });

function expiraEmBreve(jwt: string) {
  const payload = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(payload)).exp * 1000 - Date.now() < 60_000;
}

let renovacao: Promise<string | null> | null = null;

// Renova antes de expirar para a doadora nunca cair da sessão no meio de um fluxo.
async function accessValido(): Promise<string | null> {
  const tokens = lerTokens();
  if (!tokens) return null;
  if (!expiraEmBreve(tokens.access)) return tokens.access;
  renovacao ??= fetch(`${baseUrl}/api/v1/auth/renovar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: tokens.refresh }),
  })
    .then(async (r) => {
      if (!r.ok) {
        await salvarTokens(null);
        return null;
      }
      const { access } = await r.json();
      await salvarTokens({ ...tokens, access });
      return access as string;
    })
    .finally(() => {
      renovacao = null;
    });
  return renovacao;
}

api.use({
  async onRequest({ request, schemaPath }) {
    if (schemaPath.startsWith("/api/v1/auth/")) return request;
    const access = await accessValido();
    if (access) request.headers.set("Authorization", `Bearer ${access}`);
    return request;
  },
  async onResponse({ response, schemaPath }) {
    if (response.status === 401 && !schemaPath.startsWith("/api/v1/auth/")) await salvarTokens(null);
  },
});

/** Devolve `data` ou lança o erro da API, para usar em queryFn e mutationFn. */
export async function chamar<T>(requisicao: Promise<{ data?: T; error?: unknown }>): Promise<T> {
  const { data, error } = await requisicao;
  if (error !== undefined) throw error;
  return data as T;
}

export function lerErro(erro: unknown): ErroApi {
  if (erro && typeof erro === "object" && "mensagem" in erro) return erro as ErroApi;
  return { codigo: "rede", mensagem: "Não conseguimos conectar. Verifique sua internet e tente de novo.", campos: {} };
}
