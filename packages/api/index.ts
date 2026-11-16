// Tipos gerados do OpenAPI do backend. Não edite schema.d.ts; rode `npm run api:tipos` na raiz.
import type { components } from "./schema";

export type { paths } from "./schema";
export type Schemas = components["schemas"];

/** Formato de todo erro da API. Fica fora do OpenAPI porque vem dos handlers globais do Ninja. */
export type ErroApi = {
  codigo: string;
  mensagem: string;
  campos: Record<string, string[]>;
};
