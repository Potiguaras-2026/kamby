import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { carregarSessao, useSessao } from "@/lib/sessao";
import { cores } from "@/lib/tema";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

export default function Layout() {
  const { carregada, tokens } = useSessao();
  const logada = !!tokens;

  useEffect(() => {
    carregarSessao();
  }, []);

  useEffect(() => {
    if (!logada) queryClient.clear();
  }, [logada]);

  if (!carregada) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }}>
        <Stack.Protected guard={logada}>
          <Stack.Screen name="index" />
        </Stack.Protected>
        <Stack.Protected guard={!logada}>
          <Stack.Screen name="entrar" />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  );
}
