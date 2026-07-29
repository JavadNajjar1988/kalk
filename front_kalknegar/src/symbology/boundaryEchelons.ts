export type BoundaryEchelonCode =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N";

export interface BoundaryEchelonOption {
  code: BoundaryEchelonCode;
  emt: string;
  label: string;
  marker: string;
  rank: number;
}

const optionValues: readonly [
  BoundaryEchelonCode,
  string,
  string,
  string,
][] = [
  ["A", "11", "تیم / خدمه", "∅"],
  ["B", "12", "گروه", "•"],
  ["C", "13", "جوخه / بخش", "••"],
  ["D", "14", "دسته / جزء مستقل", "•••"],
  ["E", "15", "گروهان / آتشبار / واحد سواره", "I"],
  ["F", "16", "گردان / اسکادران", "II"],
  ["G", "17", "هنگ / گروه", "III"],
  ["H", "18", "تیپ", "X"],
  ["I", "21", "لشکر", "XX"],
  ["J", "22", "سپاه / نیروی اعزامی تفنگداران دریایی", "XXX"],
  ["K", "23", "ارتش", "XXXX"],
  ["L", "24", "گروه ارتش / جبهه", "XXXXX"],
  ["M", "25", "منطقه / صحنهٔ عملیات", "XXXXXX"],
  ["N", "26", "فرماندهی", "＋＋"],
];

export const boundaryEchelonOptions: readonly BoundaryEchelonOption[] =
  optionValues.map(([code, emt, label, marker], rank) => ({
    code,
    emt,
    label,
    marker,
    rank,
  }));

const optionByEmt = new Map(
  boundaryEchelonOptions.map((option) => [option.emt, option]),
);

export function boundaryCodeFromEmt(
  emt?: string,
): BoundaryEchelonCode | null {
  return emt ? optionByEmt.get(emt)?.code || null : null;
}

export function recommendBoundaryEchelon(
  emts: readonly (string | undefined)[],
  fallback: BoundaryEchelonCode = "F",
): BoundaryEchelonCode {
  const options = emts
    .map((emt) => (emt ? optionByEmt.get(emt) : undefined))
    .filter((option): option is BoundaryEchelonOption => Boolean(option));

  if (options.length === 0) return fallback;

  return options.reduce((highest, option) =>
    option.rank > highest.rank ? option : highest,
  ).code;
}
