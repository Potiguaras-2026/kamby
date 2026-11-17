import { useQuery } from "@tanstack/react-query";

import { api, chamar } from "./api";

export const useInicio = () =>
  useQuery({
    queryKey: ["inicio"],
    queryFn: () => chamar(api.GET("/api/v1/inicio")),
    // O banco muda o status da coleta pelo admin; a doadora vê sem precisar puxar a tela.
    refetchInterval: 15_000,
  });

export const useEu = () =>
  useQuery({ queryKey: ["eu"], queryFn: () => chamar(api.GET("/api/v1/eu")), staleTime: 5 * 60_000 });

export const useEnderecos = () =>
  useQuery({ queryKey: ["enderecos"], queryFn: () => chamar(api.GET("/api/v1/enderecos")) });

// Conteúdo muda pelo admin, não a cada segundo: cache longo evita refazer a busca a cada tela.
const CONTEUDO = { staleTime: 10 * 60_000 };

export const useTextos = () =>
  useQuery({ queryKey: ["textos"], queryFn: () => chamar(api.GET("/api/v1/conteudo/textos")), ...CONTEUDO });

/** Texto editável no admin. Sem rede ou sem a chave, devolve a reserva para a tela nunca ficar vazia. */
export function useTexto() {
  const { data } = useTextos();
  return (chave: string, reserva = "") => ({ titulo: data?.[chave]?.titulo || "", corpo: data?.[chave]?.corpo || reserva });
}

export const useDicas = () =>
  useQuery({ queryKey: ["dicas"], queryFn: () => chamar(api.GET("/api/v1/conteudo/dicas")), ...CONTEUDO });

export const useGuias = () =>
  useQuery({ queryKey: ["guias"], queryFn: () => chamar(api.GET("/api/v1/conteudo/guias")), ...CONTEUDO });
