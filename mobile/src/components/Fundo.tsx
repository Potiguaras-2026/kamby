import { StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { cores } from "@/lib/tema";

export function Fundo() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="topo" cx="90%" cy="0%" r="70%">
            <Stop offset="0" stopColor={cores.rosa} stopOpacity={0.14} />
            <Stop offset="1" stopColor={cores.rosa} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="base" cx="0%" cy="100%" r="75%">
            <Stop offset="0" stopColor={cores.rosa} stopOpacity={0.12} />
            <Stop offset="1" stopColor={cores.rosa} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={cores.fundo} />
        <Rect width="100%" height="100%" fill="url(#topo)" />
        <Rect width="100%" height="100%" fill="url(#base)" />
      </Svg>
    </View>
  );
}
