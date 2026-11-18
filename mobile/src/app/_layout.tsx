import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, type ReactNode } from "react";
import { Platform, View } from "react-native";

import { carregarSessao, useSessao } from "@/lib/sessao";
import { cores } from "@/lib/tema";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

export default function Layout() {
  const { carregada, tokens } = useSessao();
  const [fontes, erroFontes] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold });
  const logada = !!tokens;
  // Sem as fontes o app ainda funciona com a fonte do sistema.
  const pronto = carregada && (fontes || !!erroFontes);

  useEffect(() => {
    carregarSessao();
  }, []);

  useEffect(() => {
    if (pronto) SplashScreen.hideAsync();
  }, [pronto]);

  useEffect(() => {
    if (!logada) queryClient.clear();
  }, [logada]);

  if (!pronto) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Moldura>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }}>
        <Stack.Protected guard={logada}>
          <Stack.Screen name="(abas)" />
          <Stack.Screen name="coleta/index" />
          <Stack.Screen name="coleta/[id]" />
          <Stack.Screen name="coleta/agendar" />
          <Stack.Screen name="kit" />
          <Stack.Screen name="pedidos/index" />
          <Stack.Screen name="pedidos/[id]" />
          <Stack.Screen name="meus-dados" />
          <Stack.Screen name="remarcar" />
          <Stack.Screen name="aviso" />
          <Stack.Screen name="enderecos/index" />
          <Stack.Screen name="enderecos/[id]" />
          <Stack.Screen name="bancos" />
          <Stack.Screen name="sobre" />
          <Stack.Screen name="guia/[tema]" />
          <Stack.Screen name="dica/[id]" />
        </Stack.Protected>
        <Stack.Protected guard={!logada}>
          <Stack.Screen name="entrar" />
          <Stack.Screen name="cadastro" />
        </Stack.Protected>
      </Stack>
      </Moldura>
    </QueryClientProvider>
  );
}

/** No navegador do computador o app fica numa coluna com largura de celular; no celular não muda nada. */
function Moldura({ children }: { children: ReactNode }) {
  if (Platform.OS !== "web") return children;
  return (
    <View style={{ flex: 1, backgroundColor: "#F4E7EF", alignItems: "center" }}>
      <View style={{ flex: 1, width: "100%", maxWidth: 440, overflow: "hidden", boxShadow: "0 0 40px rgba(122, 26, 80, 0.12)" }}>{children}</View>
    </View>
  );
}
