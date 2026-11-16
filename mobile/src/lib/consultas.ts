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
