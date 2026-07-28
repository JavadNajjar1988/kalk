import type { EnvironmentalCondition } from '@/types';

export const ENVIRONMENTAL_KIND_LABELS: Record<string, string> = {
  precipitation: 'بارش',
  visibility: 'دید',
  wind: 'باد',
  temperature: 'دما',
  fog: 'مه',
  surface_condition: 'وضعیت زمین',
  cloud_cover: 'پوشش ابر',
  thunderstorm: 'رعدوبرق',
  dust_storm: 'گردوغبار',
  blizzard: 'کولاک',
  humidity: 'رطوبت',
  pressure: 'فشار هوا',
  smoke: 'دود',
  fire: 'آتش‌سوزی',
  illumination: 'روشنایی',
  flood: 'آب‌گرفتگی/سیلاب',
  soil_bearing: 'تحمل خاک',
  slope: 'شیب',
  roughness: 'ناهمواری',
  vegetation: 'پوشش گیاهی',
  road_condition: 'وضعیت جاده',
  bridge_condition: 'وضعیت پل',
  water_crossing: 'گذرگاه آبی',
  elevation: 'ارتفاع',
};

export const DEFAULT_ENVIRONMENT_SIDC: Record<string, string> = {
  precipitation: 'W-S-WSR-LI',
  visibility: 'W-S-WSFGSO',
  wind: 'W-S-WSTSS-',
  temperature: 'S-G-UCFOO-',
  fog: 'W-S-WSFGSO',
  surface_condition: 'G-M-OAOF--',
  cloud_cover: 'W-S-WSTSS-',
  thunderstorm: 'W-S-WSTMH-',
  dust_storm: 'W-S-WSDSLM',
  blizzard: 'W-S-WSS-LI',
  humidity: 'W-S-WSD-LI',
  pressure: 'S-G-UCFOO-',
  smoke: 'E-I-CF----',
  fire: 'E-I-CH----',
  illumination: 'S-G-UCFOO-',
  flood: 'E-N-BC----',
  soil_bearing: 'S-G-UCE---',
  slope: 'E-N-AD----',
  roughness: 'G-M-OAOF--',
  vegetation: 'E-F-AD----',
  road_condition: 'G-O-PR----',
  bridge_condition: 'G-M-BCB---',
  water_crossing: 'E-F-LE----',
  elevation: 'S-G-UCECO-',
};

const PARAMETER_LABELS: Record<string, string> = {
  mode: 'نوع بارش',
  intensity: 'شدت',
  rateMmPerHour: 'نرخ بارش',
  diameterMm: 'قطر دانه',
  lightningPerMinute: 'تعداد صاعقه در دقیقه',
  visibilityMeters: 'برد دید',
  windSpeedMps: 'سرعت باد',
  spreadRateMph: 'سرعت گسترش',
  speedMps: 'سرعت',
  directionDeg: 'جهت',
  gustMps: 'سرعت تندباد',
  rangeMeters: 'برد دید',
  celsius: 'دما',
  percent: 'رطوبت نسبی',
  hPa: 'فشار',
  coverage: 'پوشش',
  baseMeters: 'ارتفاع پایه ابر',
  lux: 'شدت روشنایی',
  phase: 'وضعیت روشنایی',
  condition: 'وضعیت',
  depthMeters: 'عمق',
  flowMps: 'سرعت جریان',
  kPa: 'ظرفیت تحمل',
  soilType: 'جنس سطح',
  degrees: 'شیب',
  aspectDeg: 'جهت شیب',
  level: 'درجه ناهمواری',
  density: 'تراکم',
  heightMeters: 'ارتفاع متوسط',
  metersAsl: 'ارتفاع از سطح دریا',
  maxSpeedKph: 'حداکثر سرعت',
  loadClass: 'کلاس بار',
  widthMeters: 'عرض',
};

const PARAMETER_UNITS: Record<string, string> = {
  rateMmPerHour: 'میلی‌متر بر ساعت',
  diameterMm: 'میلی‌متر',
  visibilityMeters: 'متر',
  windSpeedMps: 'متر بر ثانیه',
  spreadRateMph: 'متر بر ساعت',
  speedMps: 'متر بر ثانیه',
  directionDeg: 'درجه',
  gustMps: 'متر بر ثانیه',
  rangeMeters: 'متر',
  celsius: 'درجه سانتی‌گراد',
  percent: 'درصد',
  hPa: 'هکتوپاسکال',
  baseMeters: 'متر',
  lux: 'لوکس',
  depthMeters: 'متر',
  flowMps: 'متر بر ثانیه',
  kPa: 'کیلوپاسکال',
  degrees: 'درجه',
  aspectDeg: 'درجه',
  heightMeters: 'متر',
  metersAsl: 'متر',
  maxSpeedKph: 'کیلومتر بر ساعت',
  widthMeters: 'متر',
};

const PARAMETER_VALUES: Record<string, string> = {
  rain: 'باران',
  snow: 'برف',
  hail: 'تگرگ',
  day: 'روز',
  dawn: 'سپیده‌دم',
  dusk: 'غروب',
  night: 'شب',
  dry: 'خشک',
  wet: 'خیس',
  muddy: 'گل‌آلود',
  icy: 'یخ‌زده',
  snow_covered: 'برفی',
  soil: 'خاک',
  sand: 'شن',
  rock: 'سنگ',
  asphalt: 'آسفالت',
  open: 'باز',
  damaged: 'آسیب‌دیده',
  blocked: 'مسدود',
  mined: 'مین‌گذاری‌شده',
  operational: 'عملیاتی',
  destroyed: 'منهدم',
};

export interface EnvironmentParameterPresentation {
  key: string;
  label: string;
  value: string;
}

const faNumber = (value: number) => value.toLocaleString('fa-IR');

function formatParameterValue(key: string, value: string | number) {
  if (typeof value === 'string') return PARAMETER_VALUES[value] ?? value;
  if (['intensity', 'coverage', 'density'].includes(key)) {
    return `${faNumber(Math.round(value * 100))} درصد`;
  }
  const formatted = faNumber(value);
  return PARAMETER_UNITS[key]
    ? `${formatted} ${PARAMETER_UNITS[key]}`
    : formatted;
}

export function environmentalSidc(condition: EnvironmentalCondition) {
  return (
    condition.metocSidc ??
    DEFAULT_ENVIRONMENT_SIDC[condition.kind ?? ''] ??
    'S-G-UCFOO-'
  );
}

export function environmentalKindLabel(condition: EnvironmentalCondition) {
  return (
    (condition.kind && ENVIRONMENTAL_KIND_LABELS[condition.kind]) ||
    'شرایط محیطی'
  );
}

export function environmentalParameters(
  condition: EnvironmentalCondition
): EnvironmentParameterPresentation[] {
  if (!condition.parameters) {
    return condition.value === undefined
      ? []
      : [{ key: 'value', label: 'مقدار', value: faNumber(condition.value) }];
  }

  return Object.entries(condition.parameters)
    .filter(
      (entry): entry is [string, string | number] => entry[1] !== undefined
    )
    .map(([key, value], index) => ({
      key,
      label: PARAMETER_LABELS[key] ?? `پارامتر ${faNumber(index + 1)}`,
      value: formatParameterValue(key, value),
    }));
}
