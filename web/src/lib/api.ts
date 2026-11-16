import type { paths } from "@kamby/api";
import createClient from "openapi-fetch";

// Mesma origem: proxy do Vite em dev, Caddy em produção.
export const api = createClient<paths>({ baseUrl: "" });

export async function chamar<T>(requisicao: Promise<{ data?: T; error?: unknown }>): Promise<T> {
  const { data, error } = await requisicao;
  if (error !== undefined) throw error;
  return data as T;
}
