import { useQuery } from "@tanstack/react-query";

import { api, chamar } from "./api";

export const useInicio = () =>
  useQuery({
    queryKey: ["inicio"],
    queryFn: () => chamar(api.GET("/api/v1/inicio")),
    // O banco muda o status da coleta pelo admin; a doadora vê sem precisar puxar a tela.
    refetchInterval: 15_000,
  });

export const useColeta = (id: string) =>
  useQuery({
    queryKey: ["coleta", id],
    queryFn: () => chamar(api.GET("/api/v1/coletas/{coleta_id}", { params: { path: { coleta_id: id } } })),
    refetchInterval: 15_000,
  });

// shortcut: só a primeira página (100, o máximo da API); paginar quando alguma doadora passar disso.
export const useColetas = () =>
  useQuery({ queryKey: ["coletas"], queryFn: () => chamar(api.GET("/api/v1/coletas", { params: { query: { page_size: 100 } } })) });

// shortcut: só a primeira página (100 pedidos), como em useColetas.
export const useKits = () =>
  useQuery({ queryKey: ["kits"], queryFn: () => chamar(api.GET("/api/v1/kits", { params: { query: { page_size: 100 } } })) });

export const useKit = (id: string) =>
  useQuery({
    queryKey: ["kit", id],
    queryFn: () => chamar(api.GET("/api/v1/kits/{kit_id}", { params: { path: { kit_id: id } } })),
    refetchInterval: 15_000,
  });

// Pública e fixa por servidor: decide a faixa e o "Entrar sem cadastro" antes do login.
export const useDemo = () =>
  useQuery({ queryKey: ["demo"], queryFn: () => chamar(api.GET("/api/v1/demo")), staleTime: Infinity }).data?.ativo ?? false;

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
