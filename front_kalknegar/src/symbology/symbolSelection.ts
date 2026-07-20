import { Sidc } from "@/symbology/sidc";

export interface SymbolSearchSelection {
  sidc: string;
  category: "Main icon" | "Modifier 1" | "Modifier 2";
}

/**
 * نتیجهٔ جستجو را بدون باقی‌گذاشتن اجزای ناسازگار از مجموعهٔ نماد قبلی اعمال می‌کند.
 */
export function applySymbolSearchSelection(
  currentValue: string,
  selection: SymbolSearchSelection,
): string {
  const current = new Sidc(currentValue);
  const selected = new Sidc(selection.sidc);

  if (current.symbolSet !== selected.symbolSet) {
    current.symbolSet = selected.symbolSet;
    current.hqtfd = "0";
    current.emt = "00";
    current.mainIcon = "000000";
    current.modifierOne = "00";
    current.modifierTwo = "00";
  }

  if (selection.category === "Main icon") {
    current.mainIcon = selected.mainIcon;
  } else if (selection.category === "Modifier 1") {
    current.modifierOne = selected.modifierOne;
  } else {
    current.modifierTwo = selected.modifierTwo;
  }

  return current.toString();
}
