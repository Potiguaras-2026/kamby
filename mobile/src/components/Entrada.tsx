import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

/**
 * Seções aparecem com um fade curto, uma depois da outra. O Reanimated segue a opção
 * "reduzir movimento" do sistema e mostra direto quando ela está ligada.
 */
export function Entrada({ ordem = 0, children, style }: { ordem?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View entering={FadeIn.delay(ordem * 40).duration(240)} style={style}>
      {children}
    </Animated.View>
  );
}
