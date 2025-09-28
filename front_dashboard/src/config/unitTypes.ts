// ✅ تعریف ساختار یگان‌ها با دسته‌بندی و زیردسته‌های رسمی MIL-STD-2525D و APP-6D

// ✅ دسته‌بندی‌های اصلی (مطابق با ساختار استاندارد ناتو و MIL-STD-2525D)
export const UNIT_CATEGORIES = {
  COMMAND: 'فرماندهی',
  COMBAT: 'رزمی',
  FIRE_SUPPORT: 'پشتیبانی آتش‌بار',
  COMBAT_SUPPORT: 'پشتیبانی رزمی',
  AVIATION: 'هوانیروز',
  AIR_FORCE: 'نیروی هوایی',
  NAVAL: 'نیروی دریایی',
  SUSTAINMENT: 'پشتیبانی لجستیکی',
  SIGNAL: 'ارتباطات',
  INTELLIGENCE: 'اطلاعات',
  CHEMICAL: 'دفاع ش.ب.ه',
  SPACE: 'فضایی',
} as const;

// ✅ زیردسته‌ها (Subcategories) کامل و رسمی
export const UNIT_SUBCATEGORIES = {
  INFANTRY: 'پیاده‌نظام',
  MOTORIZED_INFANTRY: 'پیاده‌موتوریزه',
  MECHANIZED_INFANTRY: 'پیاده‌مکانیزه',
  AIRBORNE_INFANTRY: 'پیاده‌هوابرد',
  MOUNTAIN_INFANTRY: 'پیاده‌کوهستانی',
  ARMOR: 'زرهی',
  WHEELED_ARMOR: 'زرهی چرخ‌دار',
  LIGHT_ARMOR: 'زرهی سبک',
  RECON_ARMOR: 'زرهی شناسایی',
  AIR_ASSAULT: 'حمله‌هوایی',
  AIRMOBILE: 'هوابرد-متحرک',
  SPECIAL_FORCES: 'نیروهای ویژه',
  RANGER: 'رنجر',
  ARTILLERY: 'توپخانه',
  SELF_PROPELLED_ARTILLERY: 'توپخانه خودکششی',
  ROCKET_ARTILLERY: 'توپخانه راکتی',
  MORTAR: 'خمپاره‌انداز',
  MISSILE: 'یگان موشکی',
  ANTI_TANK: 'ضد زره',
  AIR_DEFENSE: 'پدافند هوایی',
  ENGINEER: 'مهندسی رزمی',
  MECHANIZED_ENGINEER: 'مهندسی مکانیزه',
  RECON: 'شناسایی',
  ELECTRONIC_WARFARE: 'جنگ الکترونیک',
  MILITARY_POLICE: 'پلیس نظامی',
  CBRN: 'دفاع ش.ب.ه',
  ATTACK_HELICOPTER: 'هلیکوپتر تهاجمی',
  TRANSPORT_HELICOPTER: 'هلیکوپتر ترابری',
  RECON_HELICOPTER: 'هلیکوپتر شناسایی',
  UTILITY_HELICOPTER: 'هلیکوپتر چندمنظوره',
  FIGHTER: 'هواپیمای جنگنده',
  BOMBER: 'هواپیمای بمب‌افکن',
  ATTACK_AIRCRAFT: 'هواپیمای تهاجمی',
  TRANSPORT_AIRCRAFT: 'هواپیمای ترابری',
  UAV: 'پهپاد',
  DESTROYER: 'ناوشکن',
  FRIGATE: 'ناوچه',
  AMPHIBIOUS: 'یگان آبی‌خاکی',
  SUBMARINE: 'زیردریایی',
  UUV: 'زیردریایی بدون سرنشین',
  CREWED_SPACE: 'فضایی سرنشین‌دار',
  SPACE_TRACK: 'ردیابی فضایی',
  SATELLITE: 'ماهواره',
  SPACE_STATION: 'ایستگاه فضایی',
  LAUNCH_VEHICLE: 'وسیله‌بر پرتاب فضایی',
  INTELLIGENCE: 'اطلاعات',
  CYBER: 'جنگ سایبری',
  SIGNAL: 'ارتباطات',
  SATELLITE_COMMS: 'مخابرات ماهواره‌ای',
  COMBAT_SUPPORT: 'پشتیبانی رزمی',
  LOGISTICS: 'تدارکات',
  MAINTENANCE: 'تعمیر و نگهداری',
  MEDICAL: 'پزشکی',
  TRANSPORT: 'حمل‌ونقل',
  EOD: 'خنثی‌سازی بمب',
  PSYOPS: 'عملیات روانی',
  TASK_FORCE: 'یگان مأموریتی',
  TOPOGRAPHIC: 'توپوگرافی',
  RADAR: 'رادار',
  METEOROLOGICAL: 'هواشناسی',
} as const;

// تعریف ساختار داده یگان
export interface UnitType {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  subcategory: string;
  sidc: string;
  description?: string;
  capabilities?: string[];
  equipment?: string[];
  personnel?: {
    officers?: number;
    ncos?: number;
    enlisted?: number;
    total?: number;
  };
}

// واردات یگان‌های مختلف از فایل‌های جداگانه
import { COMMAND_UNITS } from './units/commandUnits';

// یگان‌های رزمی
export const COMBAT_UNITS: UnitType[] = [
  {
    id: 'infantry',
    name: 'پیاده‌نظام',
    nameEn: 'Infantry',
    category: 'رزمی',
    subcategory: 'پیاده‌نظام',
    sidc: '10031000121100000000',
    description: 'یگان‌های پیاده‌نظام',
    capabilities: ['عملیات پیاده', 'دفاع', 'حمله'],
  },
  {
    id: 'armor',
    name: 'زرهی',
    nameEn: 'Armor',
    category: 'رزمی',
    subcategory: 'زرهی',
    sidc: '10031000120500000000',
    description: 'یگان‌های زرهی',
    capabilities: ['عملیات زرهی', 'حمله مکانیزه', 'دفاع متحرک'],
  },
  {
    id: 'mechanized',
    name: 'مکانیزه',
    nameEn: 'Mechanized',
    category: 'رزمی',
    subcategory: 'پیاده‌مکانیزه',
    sidc: '10031000121200000000',
    description: 'یگان‌های مکانیزه',
    capabilities: ['عملیات مکانیزه', 'تحرک بالا', 'حمله ترکیبی'],
  },
];

// یگان‌های پشتیبانی آتش‌بار
export const FIRE_SUPPORT_UNITS: UnitType[] = [
  {
    id: 'artillery',
    name: 'توپخانه',
    nameEn: 'Artillery',
    category: 'پشتیبانی آتش‌بار',
    subcategory: 'توپخانه',
    sidc: '10031000130300000000',
    description: 'یگان‌های توپخانه',
    capabilities: ['پشتیبانی آتش‌بار', 'شلیک غیرمستقیم', 'سرکوب آتش دشمن'],
  },
  {
    id: 'mortar',
    name: 'خمپاره‌انداز',
    nameEn: 'Mortar',
    category: 'پشتیبانی آتش‌بار',
    subcategory: 'خمپاره‌انداز',
    sidc: '10031000130800000000',
    description: 'یگان‌های خمپاره‌انداز',
    capabilities: ['پشتیبانی نزدیک', 'شلیک با زاویه بالا', 'تحرک بالا'],
  },
];

// یگان‌های پشتیبانی رزمی
export const COMBAT_SUPPORT_UNITS: UnitType[] = [
  {
    id: 'engineer',
    name: 'مهندسی رزمی',
    nameEn: 'Combat Engineer',
    category: 'پشتیبانی رزمی',
    subcategory: 'مهندسی رزمی',
    sidc: '10031000140700000000',
    description: 'یگان‌های مهندسی رزمی',
    capabilities: ['پاکسازی مین', 'ساخت پل', 'تخریب'],
  },
  {
    id: 'recon',
    name: 'شناسایی',
    nameEn: 'Reconnaissance',
    category: 'پشتیبانی رزمی',
    subcategory: 'شناسایی',
    sidc: '10031000121300000000',
    description: 'یگان‌های شناسایی',
    capabilities: ['جمع‌آوری اطلاعات', 'شناسایی منطقه', 'گشت‌زنی'],
  },
];

// یگان‌های هوانیروز
export const AVIATION_UNITS: UnitType[] = [
  {
    id: 'attack_helicopter',
    name: 'هلیکوپتر تهاجمی',
    nameEn: 'Attack Helicopter',
    category: 'هوانیروز',
    subcategory: 'هلیکوپتر تهاجمی',
    sidc: '10011000120100000000',
    description: 'هلیکوپترهای تهاجمی',
    capabilities: ['حمله هوایی', 'پشتیبانی نزدیک', 'ضد زره'],
  },
  {
    id: 'transport_helicopter',
    name: 'هلیکوپتر ترابری',
    nameEn: 'Transport Helicopter',
    category: 'هوانیروز',
    subcategory: 'هلیکوپتر ترابری',
    sidc: '10011000120700000000',
    description: 'هلیکوپترهای ترابری',
    capabilities: ['حمل نیرو', 'حمل بار', 'عملیات هوابرد'],
  },
];

// یگان‌های نیروی هوایی
export const AIR_FORCE_UNITS: UnitType[] = [
  {
    id: 'fighter',
    name: 'جنگنده',
    nameEn: 'Fighter',
    category: 'نیروی هوایی',
    subcategory: 'هواپیمای جنگنده',
    sidc: '10011000110400000000',
    description: 'هواپیماهای جنگنده',
    capabilities: ['برتری هوایی', 'دفاع هوایی', 'حمله هوایی'],
  },
  {
    id: 'bomber',
    name: 'بمب‌افکن',
    nameEn: 'Bomber',
    category: 'نیروی هوایی',
    subcategory: 'هواپیمای بمب‌افکن',
    sidc: '10011000110300000000',
    description: 'هواپیماهای بمب‌افکن',
    capabilities: ['حمله استراتژیک', 'بمباران', 'عملیات دوربرد'],
  },
];

// یگان‌های دریایی
export const NAVAL_UNITS: UnitType[] = [
  {
    id: 'destroyer',
    name: 'ناوشکن',
    nameEn: 'Destroyer',
    category: 'نیروی دریایی',
    subcategory: 'ناوشکن',
    sidc: '10031000120203000000',
    description: 'ناوشکن‌ها',
    capabilities: ['دفاع هوایی', 'جنگ سطحی', 'جنگ زیردریایی'],
  },
  {
    id: 'frigate',
    name: 'ناوچه',
    nameEn: 'Frigate',
    category: 'نیروی دریایی',
    subcategory: 'ناوچه',
    sidc: '10031000120204000000',
    description: 'ناوچه‌ها',
    capabilities: ['حفاظت ناوگان', 'جنگ سطحی', 'جنگ زیردریایی'],
  },
  {
    id: 'submarine',
    name: 'زیردریایی',
    nameEn: 'Submarine',
    category: 'نیروی دریایی',
    subcategory: 'زیردریایی',
    sidc: '10035000110100000000',
    description: 'زیردریایی‌ها',
    capabilities: ['جنگ زیردریایی', 'جاسوسی', 'عملیات مخفی'],
  },
];

// یگان‌های ارتباطات
export const SIGNAL_UNITS: UnitType[] = [
  {
    id: 'signal',
    name: 'ارتباطات',
    nameEn: 'Signal',
    category: 'ارتباطات',
    subcategory: 'ارتباطات',
    sidc: '10031000121000000000',
    description: 'یگان‌های ارتباطات',
    capabilities: ['ارتباطات رادیویی', 'شبکه‌های مخابراتی', 'پشتیبانی ارتباطی'],
  },
];

// یگان‌های اطلاعات
export const INTELLIGENCE_UNITS: UnitType[] = [
  {
    id: 'intelligence',
    name: 'اطلاعات',
    nameEn: 'Intelligence',
    category: 'اطلاعات',
    subcategory: 'اطلاعات',
    sidc: '10031000140700000000',
    description: 'یگان‌های اطلاعات',
    capabilities: ['جمع‌آوری اطلاعات', 'تحلیل اطلاعات', 'پشتیبانی اطلاعاتی'],
  },
];

// یگان‌های پشتیبانی لجستیکی
export const SUSTAINMENT_UNITS: UnitType[] = [
  {
    id: 'logistics',
    name: 'تدارکات',
    nameEn: 'Logistics',
    category: 'پشتیبانی لجستیکی',
    subcategory: 'تدارکات',
    sidc: '10031000150000000000',
    description: 'یگان‌های تدارکات',
    capabilities: ['تأمین تجهیزات', 'نگهداری', 'پشتیبانی لجستیکی'],
  },
];

// یگان‌های فضایی
export const SPACE_UNITS: UnitType[] = [
  {
    id: 'satellite',
    name: 'ماهواره',
    nameEn: 'Satellite',
    category: 'فضایی',
    subcategory: 'ماهواره',
    sidc: '10051000110100000000',
    description: 'ماهواره‌ها',
    capabilities: ['مخابرات', 'نظارت', 'ناوبری'],
  },
];

// یگان‌های دفاع ش.ب.ه
export const CHEMICAL_UNITS: UnitType[] = [
  {
    id: 'cbrn',
    name: 'دفاع ش.ب.ه',
    nameEn: 'CBRN Defense',
    category: 'دفاع ش.ب.ه',
    subcategory: 'دفاع ش.ب.ه',
    sidc: '10031000140100000000',
    description: 'یگان‌های دفاع شیمیایی، بیولوژیکی، رادیولوژیکی و هسته‌ای',
    capabilities: ['تشخیص آلودگی', 'آلودگی‌زدایی', 'حفاظت'],
  },
];

// ترکیب تمام انواع یگان‌ها
export const ALL_UNIT_TYPES: UnitType[] = [
  ...COMMAND_UNITS,
  ...COMBAT_UNITS,
  ...FIRE_SUPPORT_UNITS,
  ...COMBAT_SUPPORT_UNITS,
  ...AVIATION_UNITS,
  ...AIR_FORCE_UNITS,
  ...NAVAL_UNITS,
  ...SIGNAL_UNITS,
  ...INTELLIGENCE_UNITS,
  ...SUSTAINMENT_UNITS,
  ...SPACE_UNITS,
  ...CHEMICAL_UNITS,
];

// نگاشت بین مجموعه نمادها (symbolSet) و انواع یگان‌های مرتبط با هر کدام
export const SYMBOL_SET_TO_UNIT_TYPES: Record<string, UnitType[]> = {
  // هوایی (01)
  "01": [...AVIATION_UNITS, ...AIR_FORCE_UNITS],
  
  // فضایی (05)
  "05": [...SPACE_UNITS],
  
  // زمینی (10)
  "10": [...COMMAND_UNITS, ...COMBAT_UNITS, ...FIRE_SUPPORT_UNITS, ...COMBAT_SUPPORT_UNITS, ...SIGNAL_UNITS, ...INTELLIGENCE_UNITS, ...SUSTAINMENT_UNITS, ...CHEMICAL_UNITS],
  
  // تجهیزات زمینی (15)
  "15": [],
  
  // تأسیسات زمینی (20)
  "20": [],
  
  // اقدام کنترل (25)
  "25": [],
  
  // فرد پیاده (27)
  "27": [],
  
  // دریایی سطحی (30)
  "30": [...NAVAL_UNITS.filter(unit => unit.sidc.substring(4, 6) === "30")],
  
  // دریایی زیرسطحی (35)
  "35": [...NAVAL_UNITS.filter(unit => unit.sidc.substring(4, 6) === "35")],
  
  // جنگ مین (36)
  "36": [],
  
  // فعالیت/رویداد (40)
  "40": [],
};

// نگاشت بین مجموعه نمادها و اصلاح‌کننده‌های مرتبط با هر کدام
export interface ModifierOption {
  value: string;
  label: string;
}

// واردات اصلاح‌کننده‌ها از فایل جداگانه
import { SYMBOL_SET_TO_MODIFIERS } from './modifiers/symbolSetModifiers';
export { SYMBOL_SET_TO_MODIFIERS };

// نگاشت بین مجموعه نمادها و رده‌های سازمانی مرتبط با هر کدام
export interface EchelonOption {
  value: string;
  label: string;
}

// واردات رده‌های سازمانی از فایل جداگانه
import { SYMBOL_SET_TO_ECHELONS } from './echelons/symbolSetEchelons';
export { SYMBOL_SET_TO_ECHELONS };

// تابع کمکی برای یافتن نوع یگان بر اساس ID
export const findUnitTypeById = (id: string): UnitType | undefined => {
  return ALL_UNIT_TYPES.find(unit => unit.id === id);
};

// تابع کمکی برای یافتن نوع یگان بر اساس SIDC
export const findUnitTypeBySidc = (sidc: string): UnitType | undefined => {
  return ALL_UNIT_TYPES.find(unit => unit.sidc === sidc);
};

// تابع کمکی برای فیلتر کردن یگان‌ها بر اساس دسته
export const getUnitTypesByCategory = (category: string): UnitType[] => {
  return ALL_UNIT_TYPES.filter(unit => unit.category === category);
};

// تابع کمکی برای فیلتر کردن یگان‌ها بر اساس زیردسته
export const getUnitTypesBySubcategory = (subcategory: string): UnitType[] => {
  return ALL_UNIT_TYPES.filter(unit => unit.subcategory === subcategory);
};

// تابع کمکی برای دریافت تمام دسته‌ها
export const getAllCategories = (): string[] => {
  return Object.values(UNIT_CATEGORIES);
};

// تابع کمکی برای دریافت تمام زیردسته‌ها
export const getAllSubcategories = (): string[] => {
  return Object.values(UNIT_SUBCATEGORIES);
}; 