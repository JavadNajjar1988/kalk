import { computed, ref, watch } from "vue";
import {
  DISMOUNTED_SYMBOLSET_VALUE,
  echelonValues,
  EQUIPMENT_SYMBOLSET_VALUE,
  leadershipValues,
  mobilityValues,
  SID,
  type SidValue,
  SUBSURFACE_SYMBOLSET_VALUE,
  SURFACE_SYMBOLSET_VALUE,
  towedArrayValues,
  UNIT_SYMBOLSET_VALUE,
} from "@/symbology/values";
import type { SymbolItem, SymbolValue } from "@/types/constants";
import { Sidc } from "@/symbology/sidc";
import { injectStrict } from "@/utils";
import { activeScenarioKey } from "@/components/injects";
import { useActiveUnitStore } from "@/stores/dragStore";

export type SymbolPage = "land" | "sea" | "air" | "space" | "equipment";

interface ExtendedSymbolValue extends SymbolValue {
  symbolSet: string;
}

const landIcons: ExtendedSymbolValue[] = [
  { symbolSet: "10", code: "121100", text: "پیاده‌نظام" },
  { symbolSet: "10", code: "121102", text: "پیاده‌نظام مکانیزه" },
  { symbolSet: "10", code: "121300", text: "شناسایی" },
  { symbolSet: "10", code: "130300", text: "توپخانه" },
  { symbolSet: "10", code: "120500", text: "زرهی" },
  { symbolSet: "10", code: "160600", text: "پشتیبانی خدمات رزمی" },
  { symbolSet: "10", code: "130100", text: "پدافند هوایی" },
  { symbolSet: "10", code: "140700", text: "مهندسی رزمی" },
];

const seaIcons: ExtendedSymbolValue[] = [
  { symbolSet: "30", code: "110000", text: "شناور نظامی" },
  { symbolSet: "30", code: "120100", text: "ناو هواپیمابر" },
  { symbolSet: "30", code: "120204", text: "ناوچه" },
  { symbolSet: "30", code: "120300", text: "شناور آبی‌خاکی" },
  { symbolSet: "30", code: "120500", text: "قایق گشتی" },
  { symbolSet: "35", code: "110100", text: "زیردریایی" },
  { symbolSet: "35", code: "130100", text: "اژدر" },
];

const airIcons: ExtendedSymbolValue[] = [
  { symbolSet: "01", code: "110100", text: "هواپیمای بال‌ثابت" },
  { symbolSet: "01", code: "110104", text: "جنگنده" },
  { symbolSet: "01", code: "110103", text: "بمب‌افکن" },
  { symbolSet: "01", code: "110200", text: "بالگرد" },
  { symbolSet: "02", code: "110000", text: "موشک هوایی" },
];

const equipmentIcons: ExtendedSymbolValue[] = [
  { symbolSet: "15", code: "110100", text: "تفنگ" },
  { symbolSet: "15", code: "110200", text: "مسلسل" },
  { symbolSet: "15", code: "120100", text: "خودروی زرهی" },
  { symbolSet: "15", code: "120200", text: "تانک" },
  { symbolSet: "15", code: "130100", text: "هواگرد" },
  { symbolSet: "15", code: "160200", text: "کامیون" },
];

const spaceIcons: ExtendedSymbolValue[] = [
  { symbolSet: "05", code: "110100", text: "وسیلهٔ فضایی" },
  { symbolSet: "05", code: "110300", text: "فرودگر سیاره‌ای" },
  { symbolSet: "05", code: "110400", text: "شاتل مداری" },
  { symbolSet: "05", code: "110600", text: "ماهواره" },
  { symbolSet: "05", code: "110800", text: "سلاح ضدماهواره" },
];

const symbolPage = ref<SymbolPage>("land");
const currentSid = ref<SidValue | string>(SID.Friend);
const currentEchelon = ref("16");
const customIcon = ref<SymbolValue>({
  code: "10031000141211000000",
  text: "پیاده‌نظام",
});
const activeSidc = ref("10031000141211000000");

export function useToolbarUnitSymbolData() {
  const emtStore: Record<string, string> = { [UNIT_SYMBOLSET_VALUE]: "16" };

  const symbolSetValue = computed(() => new Sidc(activeSidc.value).symbolSet);

  function mapSymbolCode({ code, text, symbolSet }: ExtendedSymbolValue): SymbolItem {
    return {
      code,
      text,
      sidc: "100" + currentSid.value + symbolSet + "00" + "00" + code + "0000",
    };
  }
  const iconItems = computed(() => {
    switch (symbolPage.value) {
      case "land":
        return landIcons.map(mapSymbolCode);
      case "sea":
        return seaIcons.map(mapSymbolCode);
      case "air":
        return airIcons.map(mapSymbolCode);
      case "equipment":
        return equipmentIcons.map(mapSymbolCode);
      case "space":
        return spaceIcons.map(mapSymbolCode);
    }
    return [];
  });
  const seaItems = computed(() => seaIcons.map(mapSymbolCode));

  const echelonSidc = computed(
    () =>
      "100" +
      currentSid.value +
      symbolSetValue.value +
      "00" +
      currentEchelon.value +
      "0000000000",
  );

  const customSidc = computed(() => {
    const parsedSidc = new Sidc(customIcon.value.code);
    parsedSidc.standardIdentity = currentSid.value;
    parsedSidc.emt = "00";
    parsedSidc.hqtfd = "0";
    return parsedSidc.toString();
  });

  const emtItems = computed(() => {
    let values: SymbolValue[];
    switch (symbolSetValue.value) {
      case UNIT_SYMBOLSET_VALUE:
        values = echelonValues;
        break;
      case EQUIPMENT_SYMBOLSET_VALUE:
        values = mobilityValues;
        break;
      case DISMOUNTED_SYMBOLSET_VALUE:
        values = leadershipValues;
        break;
      case SURFACE_SYMBOLSET_VALUE:
      case SUBSURFACE_SYMBOLSET_VALUE:
        values = towedArrayValues;
        break;
      default:
        values = [{ code: "00", text: "نامشخص" }];
    }
    return values.map(({ code, text }): SymbolItem => {
      return {
        code,
        text,
        sidc:
          "100" + currentSid.value + symbolSetValue.value + "00" + code + "0000000000",
      };
    });
  });

  watch(symbolSetValue, (newSymbolSet, oldSymbolSet) => {
    emtStore[oldSymbolSet] = currentEchelon.value;
    currentEchelon.value = emtStore[newSymbolSet] || "00";
  });

  return {
    currentSid,
    currentEchelon,
    activeSidc,
    iconItems,
    echelonSidc,
    customSidc,
    customIcon,
    emtItems,
    seaItems,
    symbolPage,
  };
}

export function useActiveSidc() {
  const { unitActions } = injectStrict(activeScenarioKey);
  const { activeParent } = useActiveUnitStore();
  const sidc = computed(() => {
    const sidcObj = new Sidc(activeSidc.value);
    sidcObj.emt = currentEchelon.value;
    sidcObj.standardIdentity = currentSid.value;
    return sidcObj.toString();
  });
  const symbolOptions = computed(() =>
    activeParent.value
      ? {
          ...unitActions.getCombinedSymbolOptions(activeParent.value, true),
        }
      : {},
  );
  return { sidc, symbolOptions };
}
