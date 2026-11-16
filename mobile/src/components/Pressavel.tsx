import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { haptico } from "@/lib/haptico";
import { mola } from "@/lib/tema";

const AnimadoPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  escala?: number;
  semVibrar?: boolean;
};

export function Pressavel({ escala = 0.98, semVibrar, style, onPressIn, onPressOut, onPress, disabled, ...props }: Props) {
  const s = useSharedValue(1);
  const animado = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimadoPressable
      {...props}
      disabled={disabled}
      onPressIn={(e) => {
        s.value = withSpring(escala, mola.toque);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = withSpring(1, mola.toque);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (!semVibrar) haptico.toque();
        onPress?.(e);
      }}
      style={[style, animado]}
    />
  );
}
