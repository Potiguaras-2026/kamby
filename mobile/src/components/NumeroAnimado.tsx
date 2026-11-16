import { useEffect, useState } from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

type Props = { valor: number; formatar: (n: number) => string; style?: StyleProp<TextStyle>; duracao?: number };

/** Leitores de tela recebem só o valor final, não a contagem. */
export function NumeroAnimado({ valor, formatar, style, duracao = 900 }: Props) {
  const reduzido = useReducedMotion();
  const [atual, setAtual] = useState(reduzido ? valor : 0);

  useEffect(() => {
    if (reduzido) return setAtual(valor);
    let quadro = 0;
    const inicio = Date.now();
    const passo = () => {
      const t = Math.min(1, (Date.now() - inicio) / duracao);
      setAtual(valor * (1 - (1 - t) ** 3));
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [valor, duracao, reduzido]);

  return (
    <Text style={[style, { fontVariant: ["tabular-nums"] }]} accessibilityLabel={formatar(valor)}>
      {formatar(atual)}
    </Text>
  );
}
