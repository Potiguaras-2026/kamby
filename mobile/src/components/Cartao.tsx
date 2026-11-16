import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { cores, raio, sombra } from "@/lib/tema";

type Tom = "branco" | "rosa" | "turquesa";

const TONS: Record<Tom, ViewStyle> = {
  branco: { backgroundColor: cores.superficie, borderColor: cores.borda },
  rosa: { backgroundColor: cores.rosaSuave, borderColor: cores.borda },
  turquesa: { backgroundColor: cores.turquesaSuave, borderColor: cores.bordaTurquesa },
};

export function Cartao({ children, style, tom = "branco" }: { children: ReactNode; style?: StyleProp<ViewStyle>; tom?: Tom }) {
  return <View style={[estilos.base, TONS[tom], style]}>{children}</View>;
}

const estilos = StyleSheet.create({
  base: { borderRadius: raio.g, borderWidth: 1, padding: 18, ...sombra.suave },
});
