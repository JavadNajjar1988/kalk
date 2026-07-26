/**
 * Centralized Military Symbol Definitions
 * رجیستری مرکزی نمادهای نظامی - قابل استفاده در همه بخش‌ها
 */

// Standard Identity Types (APP-6D Compliant - مطابق با Vue ORBAT)
export const STANDARD_IDENTITIES = {
  PENDING: { value: '0', label: 'در انتظار', color: '#FFF176', code: 'P' },
  UNKNOWN: { value: '1', label: 'نامعلوم', color: '#FFF176', code: 'U' },
  ASSUMED_FRIEND: {
    value: '2',
    label: 'دوست فرضی',
    color: '#81D4FA',
    code: 'AF',
  },
  FRIEND: { value: '3', label: 'دوست', color: '#81D4FA', code: 'F' },
  NEUTRAL: { value: '4', label: 'خنثی', color: '#9BE79D', code: 'N' },
  SUSPECT: { value: '5', label: 'مشکوک', color: '#FF8A80', code: 'S' },
  HOSTILE: { value: '6', label: 'متخاصم', color: '#FF8A80', code: 'H' },
  CUSTOM_1: { value: '7', label: 'سفارشی ۱', color: '#ff00ff', code: 'C1' },
  CUSTOM_2: { value: '8', label: 'سفارشی ۲', color: '#00ffff', code: 'C2' },
} as const;

// Echelon Levels (Complete APP-6D Hierarchy - مطابق با Vue ORBAT)
export const ECHELON_LEVELS = {
  UNKNOWN: { value: '00', label: 'نامشخص', order: 0 },
  TEAM: { value: '11', label: 'تیم/خدمه', order: 1 },
  SQUAD: { value: '12', label: 'جوخه', order: 2 },
  SECTION: { value: '13', label: 'بخش', order: 3 },
  PLATOON: { value: '14', label: 'دسته', order: 4 },
  COMPANY: { value: '15', label: 'گروهان/آتشبار', order: 5 },
  BATTALION: { value: '16', label: 'گردان', order: 6 },
  REGIMENT: { value: '17', label: 'هنگ', order: 7 },
  BRIGADE: { value: '18', label: 'تیپ', order: 8 },
  DIVISION: { value: '21', label: 'لشکر', order: 9 },
  CORPS: { value: '22', label: 'سپاه', order: 10 },
  ARMY: { value: '23', label: 'ارتش', order: 11 },
  ARMY_GROUP: { value: '24', label: 'گروه ارتش/جبهه', order: 12 },
  THEATER: { value: '25', label: 'فرماندهی منطقه', order: 13 },
  COMMAND: { value: '26', label: 'فرماندهی عالی', order: 14 },
} as const;

// Land Unit Icons (مطابق دقیق با Vue ORBAT mainToolbarData.ts)
export const LAND_UNIT_ICONS = [
  { value: '000000', label: 'نامشخص', text: 'نامشخص', category: 'general' },
  {
    value: '110000',
    label: 'فرماندهی و کنترل',
    text: 'فرماندهی و کنترل',
    category: 'command',
  },
  { value: '121100', label: 'پیاده', text: 'پیاده', category: 'combat' },
  {
    value: '121000',
    label: 'رزم مشترک',
    text: 'رزم مشترک',
    category: 'combat',
  },
  {
    value: '121102',
    label: 'پیاده مکانیزه',
    text: 'پیاده مکانیزه',
    category: 'combat',
  },
  { value: '130300', label: 'توپخانه', text: 'توپخانه', category: 'fire' },
  { value: '120500', label: 'زرهی', text: 'زرهی', category: 'combat' },
  {
    value: '160600',
    label: 'پشتیبانی رزمی',
    text: 'پشتیبانی رزمی',
    category: 'support',
  },
] as const;

export const LAND_UNIT_ICON_CATEGORIES = [
  { value: 'all', label: 'همه' },
  { value: 'combat', label: 'رزمی' },
  { value: 'command', label: 'فرماندهی' },
  { value: 'fire', label: 'آتش پشتیبانی' },
  { value: 'support', label: 'پشتیبانی' },
  { value: 'general', label: 'عمومی' },
] as const;

/** گزینه‌های پایه فرم سناریو؛ جزئیات تخصصی در کالک‌نگار تکمیل می‌شود. */
export const SCENARIO_LAND_UNIT_ICONS = LAND_UNIT_ICONS.filter(icon =>
  [
    '110000',
    '121000',
    '121100',
    '121102',
    '120500',
    '130300',
    '160600',
  ].includes(icon.value)
);

// Helper functions
export const getStandardIdentityOptions = () =>
  Object.values(STANDARD_IDENTITIES);

export const getStandardIdentityColor = (identity: string): string =>
  Object.values(STANDARD_IDENTITIES).find(option => option.value === identity)
    ?.color || STANDARD_IDENTITIES.UNKNOWN.color;

/**
 * هویت طرف‌های درگیری در فرم سناریو — فقط ارقام معتبر رقم ۴ام SIDC (بعد از ۱۰۰).
 * ترتیب نمایش: دوست، دشمن، خنثی، نامعلوم.
 */
export const COMBAT_SIDE_STANDARD_IDENTITY_OPTIONS = [
  STANDARD_IDENTITIES.FRIEND,
  STANDARD_IDENTITIES.HOSTILE,
  STANDARD_IDENTITIES.NEUTRAL,
  STANDARD_IDENTITIES.UNKNOWN,
] as const;

export const getEchelonOptions = () =>
  Object.values(ECHELON_LEVELS).sort((a, b) => a.order - b.order);

/** رده‌های اصلی موردنیاز برای ایجاد اولیه سناریو. */
export const SCENARIO_ECHELON_OPTIONS = [
  ECHELON_LEVELS.PLATOON,
  ECHELON_LEVELS.COMPANY,
  ECHELON_LEVELS.BATTALION,
  ECHELON_LEVELS.REGIMENT,
  ECHELON_LEVELS.BRIGADE,
  ECHELON_LEVELS.DIVISION,
  ECHELON_LEVELS.CORPS,
  ECHELON_LEVELS.ARMY,
] as const;
export const getLandUnitIcons = () => LAND_UNIT_ICONS;

// SIDC Builder (مطابق با Vue ORBAT Mapper)
export const buildSIDC = (
  standardIdentity: string,
  echelon: string = '18',
  icon: string = '121100'
): string => {
  // Mirrors the Kalknegar helper: 100 + SID + symbolSet + 00 + echelon + icon + 0000
  const symbolSet = '10';
  const iconPadded = icon.padStart(6, '0');

  return `100${standardIdentity}${symbolSet}00${echelon}${iconPadded}0000`;
};

// Type definitions for export
export type StandardIdentity =
  (typeof STANDARD_IDENTITIES)[keyof typeof STANDARD_IDENTITIES];
export type EchelonLevel = (typeof ECHELON_LEVELS)[keyof typeof ECHELON_LEVELS];
export type LandUnitIcon = (typeof LAND_UNIT_ICONS)[number];
