// Values based on code from https://github.com/spatialillusions/milsymbol-generator

import { type SymbolValue } from "@/types/constants";

export const AIR_SYMBOLSET_VALUE = "01";
export const SPACE_SYMBOLSET_VALUE = "05";
export const UNIT_SYMBOLSET_VALUE = "10";
export const DISMOUNTED_SYMBOLSET_VALUE = "27";
export const SURFACE_SYMBOLSET_VALUE = "30";
export const SUBSURFACE_SYMBOLSET_VALUE = "35";
export const CONTROL_MEASURE_SYMBOLSET_VALUE = "25";

export const symbolSetValues: SymbolValue[] = [
  { code: "10", text: "واحد زمینی" },
  { code: "11", text: "واحد/سازمان غیرنظامی زمینی" },
  { code: "15", text: "تجهیزات زمینی" },
  { code: "20", text: "تأسیسات زمینی" },
  { code: "25", text: "اقدام کنترل" },
  { code: "27", text: "فرد پیاده" },
  { code: "30", text: "سطح دریا" },
  { code: "35", text: "زیر سطح دریا" },
  { code: "36", text: "جنگ مین" },
  { code: "40", text: "فعالیت/رویداد" },
  { code: "01", text: "هوایی" },
  { code: "02", text: "موشک هوایی" },
  { code: "05", text: "فضایی" },
];

export const HQTFDummyValues: SymbolValue[] = [
  { code: "0", text: "قابل اجرا نیست" },
  { code: "1", text: "فریب/ساختگی" },
  { code: "2", text: "ستاد فرماندهی" },
  { code: "3", text: "ستاد فرماندهی فریب/ساختگی" },
  { code: "4", text: "نیروی ویژه" },
  { code: "5", text: "نیروی ویژه فریب/ساختگی" },
  { code: "6", text: "ستاد فرماندهی نیروی ویژه" },
  { code: "7", text: "ستاد فرماندهی نیروی ویژه فریب/ساختگی" },
];

export const statusValues: SymbolValue[] = [
  { code: "0", text: "حاضر" },
  { code: "1", text: "برنامه‌ریزی شده/پیش‌بینی شده/مشکوک" },
  { code: "2", text: "حاضر/کاملاً قابل" },
  { code: "3", text: "حاضر/آسیب دیده" },
  { code: "4", text: "حاضر/نابود شده" },
  { code: "5", text: "حاضر/کامل تا ظرفیت" },
];

export const echelonValues: SymbolValue[] = [
  { code: "00", text: "نامشخص" },
  { code: "11", text: "تیم / خدمه" },
  { code: "12", text: "گروه" },
  { code: "13", text: "جوخه / بخش" },
  { code: "14", text: "دسته / جزء مستقل" },
  { code: "15", text: "گروهان / آتشبار / واحد سواره" },
  { code: "16", text: "گردان / اسکادران" },
  { code: "17", text: "هنگ / گروه" },
  { code: "18", text: "تیپ" },
  { code: "21", text: "لشکر" },
  { code: "22", text: "سپاه / نیروی اعزامی تفنگداران دریایی" },
  { code: "23", text: "ارتش" },
  { code: "24", text: "گروه ارتش / جبهه" },
  { code: "25", text: "منطقه / صحنهٔ عملیات" },
  { code: "26", text: "فرماندهی" },
];

export const EQUIPMENT_SYMBOLSET_VALUE = "15";
export const mobilityValues: SymbolValue[] = [
  { code: "00", text: "نامشخص" },
  { code: "31", text: "چرخدار محدود صحرایی" },
  { code: "32", text: "چرخدار صحرایی" },
  { code: "33", text: "زنجیری" },
  { code: "34", text: "ترکیب چرخدار و زنجیری" },
  { code: "35", text: "یدک کشیده شده" },
  { code: "36", text: "راه‌آهن" },
  { code: "37", text: "حیوانات باربر" },
  { code: "41", text: "روی برف (محرک اصلی)" },
  { code: "42", text: "سورتمه" },
  { code: "51", text: "بارج" },
  { code: "52", text: "آبی‌خاکی" },
];

export const leadershipValues: SymbolValue[] = [
  { code: "00", text: "نامشخص" },
  { code: "71", text: "رهبر" },
];

export const towedArrayValues: SymbolValue[] = [
  { code: "00", text: "نامشخص" },
  { code: "61", text: "آرایه یدک کشیده شده کوتاه" },
  { code: "62", text: "آرایه یدک کشیده شده بلند" },
];

export const standardIdentityValues: SymbolValue[] = [
  {
    code: "0",
    text: "در انتظار",
  },
  {
    code: "1",
    text: "نامعلوم",
  },
  {
    code: "2",
    text: "دوست فرضی",
  },
  {
    code: "3",
    text: "دوست",
  },
  {
    code: "4",
    text: "خنثی",
  },
  {
    code: "5",
    text: "مشکوک/شوخ",
  },
  {
    code: "6",
    text: "متخاصم/جعلی",
  },
  {
    code: "7",
    text: "سفارشی ۱",
  },
  {
    code: "8",
    text: "سفارشی ۲",
  },
];

export const SID = {
  Pending: "0",
  Unknown: "1",
  AssumedFriend: "2",
  Friend: "3",
  Neutral: "4",
  Suspect: "5",
  Joker: "5",
  Hostile: "6",
  Faker: "6",
  Custom1: "7",
  Custom2: "8",
  Custom3: "9",
} as const;

export type SidValue = (typeof SID)[keyof typeof SID];

export const Dimension = {
  Unknown: "Unknown",
  Space: "Space",
  Air: "Air",
  LandUnit: "LandUnit",
  LandEquipment: "LandEquipment",
  LandInstallation: "LandInstallation",
  SeaSurface: "SeaSurface",
  SeaSubsurface: "SeaSubsurface",
  Activity: "Activity",
  DismountedIndividual: "DismountedIndividual",
} as const;

export type DimensionValue = (typeof Dimension)[keyof typeof Dimension];

export const symbolSetToDimension: Record<string, DimensionValue> = {
  [AIR_SYMBOLSET_VALUE]: Dimension.Air,
  [SPACE_SYMBOLSET_VALUE]: Dimension.Space,
  [UNIT_SYMBOLSET_VALUE]: Dimension.LandUnit,
  [DISMOUNTED_SYMBOLSET_VALUE]: Dimension.DismountedIndividual,
  [SURFACE_SYMBOLSET_VALUE]: Dimension.SeaSurface,
  [SUBSURFACE_SYMBOLSET_VALUE]: Dimension.SeaSubsurface,
  [CONTROL_MEASURE_SYMBOLSET_VALUE]: Dimension.Activity,
  [EQUIPMENT_SYMBOLSET_VALUE]: Dimension.LandEquipment,
};
