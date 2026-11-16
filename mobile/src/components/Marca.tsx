import { View } from "react-native";
import { SvgXml } from "react-native-svg";

import { LOGO, LOGO_BRANCA } from "./marcaSvg";

export function Logo({ largura, branca }: { largura: number; branca?: boolean }) {
  const proporcao = branca ? 1714 / 1928 : 450 / 2026;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Kamby">
      <SvgXml xml={branca ? LOGO_BRANCA : LOGO} width={largura} height={largura * proporcao} />
    </View>
  );
}

