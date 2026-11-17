import Svg, { Path } from "react-native-svg";

import { MARCAS } from "./marcasSvg";

export type Marca = keyof typeof MARCAS;

// Cores oficiais de cada marca: o ícone é reconhecido pela cor tanto quanto pela forma.
export const COR_MARCA: Record<Marca, string> = {
  instagram: "#E4405F",
  youtube: "#FF0000",
  whatsapp: "#25D366",
  gmail: "#EA4335",
};

export function IconeMarca({ marca, tamanho = 20, cor }: { marca: Marca; tamanho?: number; cor?: string }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Path d={MARCAS[marca]} fill={cor ?? COR_MARCA[marca]} />
    </Svg>
  );
}
