/**
 * Centralized Military Symbol Definitions
 * رجیستری مرکزی نمادهای نظامی - قابل استفاده در همه بخش‌ها
 */

// Standard Identity Types (APP-6D Compliant - مطابق با Vue ORBAT)
export const STANDARD_IDENTITIES = {
  PENDING: { value: '0', label: 'در انتظار', color: '#ffff00', code: 'P' },
  UNKNOWN: { value: '1', label: 'نامعلوم', color: '#ffff00', code: 'U' },
  ASSUMED_FRIEND: { value: '2', label: 'دوست فرضی', color: '#0080ff', code: 'AF' },
  FRIEND: { value: '3', label: 'دوست', color: '#0080ff', code: 'F' },
  NEUTRAL: { value: '4', label: 'خنثی', color: '#00ff00', code: 'N' },
  SUSPECT: { value: '5', label: 'مشکوک/شوخ', color: '#ff8000', code: 'S' },
  HOSTILE: { value: '6', label: 'متخاصم/جعلی', color: '#ff0000', code: 'H' },
  CUSTOM_1: { value: '7', label: 'سفارشی ۱', color: '#ff00ff', code: 'C1' },
  CUSTOM_2: { value: '8', label: 'سفارشی ۲', color: '#00ffff', code: 'C2' }
} as const;

// Echelon Levels (Complete APP-6D Hierarchy - مطابق با Vue ORBAT)
export const ECHELON_LEVELS = {
  UNKNOWN: { value: '00', label: 'نامشخص', order: 0 },
  TEAM: { value: '11', label: 'تیم/خدمه', order: 1 },
  SQUAD: { value: '12', label: 'جوخه', order: 2 },
  SECTION: { value: '13', label: 'بخش', order: 3 },
  PLATOON: { value: '14', label: 'دسته/گروه جداشده', order: 4 },
  COMPANY: { value: '15', label: 'گردان/باتری/سرباز', order: 5 },
  BATTALION: { value: '16', label: 'تابور/اسکادران', order: 6 },
  REGIMENT: { value: '17', label: 'هنگ/گروه', order: 7 },
  BRIGADE: { value: '18', label: 'تیپ', order: 8 },
  DIVISION: { value: '21', label: 'لشکر', order: 9 },
  CORPS: { value: '22', label: 'سپاه/MEF', order: 10 },
  ARMY: { value: '23', label: 'ارتش', order: 11 },
  ARMY_GROUP: { value: '24', label: 'گروه ارتش/جبهه', order: 12 },
  THEATER: { value: '25', label: 'منطقه/تئاتر', order: 13 },
  COMMAND: { value: '26', label: 'فرماندهی', order: 14 }
} as const;

// Land Unit Icons (مطابق دقیق با Vue ORBAT mainToolbarData.ts)
export const LAND_UNIT_ICONS = [
  { value: '000000', label: 'Unspecified', text: 'Unspecified' },
  { value: '110000', label: 'Command & Control', text: 'Command & Control' },
  { value: '121100', label: 'Infantry', text: 'Infantry' },
  { value: '121000', label: 'Combined Arms', text: 'Combined Arms' },
  { value: '121102', label: 'Mechanized Infantry', text: 'Mechanized Infantry' },
  { value: '130300', label: 'Artillery', text: 'Artillery' },
  { value: '120500', label: 'Armor', text: 'Armor' },
  { value: '160600', label: 'Combat Support', text: 'Combat Support' }
] as const;

// Helper functions
export const getStandardIdentityOptions = () => Object.values(STANDARD_IDENTITIES);
export const getEchelonOptions = () => Object.values(ECHELON_LEVELS).sort((a, b) => a.order - b.order);
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
export type StandardIdentity = typeof STANDARD_IDENTITIES[keyof typeof STANDARD_IDENTITIES];
export type EchelonLevel = typeof ECHELON_LEVELS[keyof typeof ECHELON_LEVELS];
export type LandUnitIcon = typeof LAND_UNIT_ICONS[number];
