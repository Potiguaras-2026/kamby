import { useEffect, useState } from "react";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";

import { cores } from "@/lib/tema";

const OLHO = "#3A2A35";

/** Gotinha de leite com carinha: o personagem das dicas. Pisca de vez em quando. */
export function Mascote({ tamanho = 48 }: { tamanho?: number }) {
  const [piscando, setPiscando] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      setPiscando(true);
      setTimeout(() => setPiscando(false), 160);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 64 64">
      <Path d="M32 5 C32 5 11 28 11 41 a21 21 0 0 0 42 0 C53 28 32 5 32 5 Z" fill="#FFF7FB" stroke={cores.rosaClaro} strokeWidth={2.5} strokeLinejoin="round" />
      {/* Brilho no alto da gota */}
      <Ellipse cx={24} cy={28} rx={3} ry={5} fill="#FFFFFF" transform="rotate(25 24 28)" />
      <Ellipse cx={20} cy={47} rx={4} ry={2.4} fill={cores.rosaClaro} />
      <Ellipse cx={44} cy={47} rx={4} ry={2.4} fill={cores.rosaClaro} />
      {piscando ? (
        <>
          <Path d="M23 41 Q26 43 29 41" stroke={OLHO} strokeWidth={2} strokeLinecap="round" fill="none" />
          <Path d="M35 41 Q38 43 41 41" stroke={OLHO} strokeWidth={2} strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <Circle cx={26} cy={41} r={3.4} fill={OLHO} />
          <Circle cx={38} cy={41} r={3.4} fill={OLHO} />
          <Circle cx={27.2} cy={39.8} r={1.1} fill="#FFFFFF" />
          <Circle cx={39.2} cy={39.8} r={1.1} fill="#FFFFFF" />
        </>
      )}
      <Path d="M28.5 47.5 Q32 51 35.5 47.5" stroke={OLHO} strokeWidth={2} strokeLinecap="round" fill="none" />
    </Svg>
  );
}
