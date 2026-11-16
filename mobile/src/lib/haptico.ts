import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const ativo = Platform.OS !== "web";

// Vibração curta confirma o toque sem som. Sucesso e aviso ficam para momentos que importam.
export const haptico = {
  toque: () => ativo && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  selecao: () => ativo && Haptics.selectionAsync(),
  sucesso: () => ativo && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  aviso: () => ativo && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};
