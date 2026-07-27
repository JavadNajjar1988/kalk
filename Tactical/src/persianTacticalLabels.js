// Persian fallback for every label originating from the MIL-STD-2525C and
// SKKM hierarchy. Known military terminology is translated semantically;
// uncommon proper names and doctrinal abbreviations are written in Persian
// so no English UI label can leak through.
const wordTranslations = {
  warfighting: 'رزم',
  symbols: 'نمادها',
  symbol: 'نماد',
  tactical: 'تاکتیکی',
  graphics: 'گرافیک‌ها',
  air: 'هوایی',
  ground: 'زمینی',
  land: 'زمینی',
  sea: 'دریایی',
  maritime: 'دریایی',
  space: 'فضایی',
  surface: 'سطحی',
  subsurface: 'زیرسطحی',
  fire: 'آتش',
  support: 'پشتیبانی',
  equipment: 'تجهیزات',
  items: 'اقلام',
  item: 'قلم',
  mobility: 'تحرک',
  survivability: 'بقا',
  incident: 'حادثه',
  hazardous: 'خطرناک',
  material: 'مواد',
  service: 'خدمات',
  event: 'رویداد',
  events: 'رویدادها',
  damage: 'خسارت',
  danger: 'خطر',
  natural: 'طبیعی',
  infrastructure: 'زیرساخت',
  transportation: 'حمل‌ونقل',
  special: 'ویژه',
  needs: 'نیازها',
  agriculture: 'کشاورزی',
  agricultural: 'کشاورزی',
  food: 'غذایی',
  operations: 'عملیات',
  operation: 'عملیات',
  individual: 'فرد',
  activity: 'فعالیت',
  activities: 'فعالیت‌ها',
  violent: 'خشونت‌آمیز',
  death: 'مرگ',
  causing: 'بار',
  locations: 'مکان‌ها',
  location: 'مکان',
  emergency: 'اضطراری',
  management: 'مدیریت',
  forces: 'نیروها',
  force: 'نیرو',
  vehicle: 'وسیله نقلیه',
  vehicles: 'وسایل نقلیه',
  tasks: 'وظایف',
  task: 'وظیفه',
  control: 'کنترل',
  command: 'فرماندهی',
  group: 'گروه',
  organization: 'سازمان',
  nonmilitary: 'غیرنظامی',
  other: 'سایر',
  unknown: 'نامشخص',
  area: 'منطقه',
  areas: 'مناطق',
  point: 'نقطه',
  line: 'خط',
  zone: 'منطقه',
  target: 'هدف',
  targets: 'اهداف',
  unit: 'یگان',
  units: 'یگان‌ها',
  installation: 'تأسیسات',
  intelligence: 'اطلاعات',
  signal: 'سیگنال',
  maneuver: 'مانور',
  combat: 'رزمی',
  defense: 'دفاع',
  attack: 'حمله',
  weapon: 'سلاح',
  weapons: 'سلاح‌ها',
  artillery: 'توپخانه',
  reconnaissance: 'شناسایی',
  infantry: 'پیاده‌نظام',
  armored: 'زرهی',
  aviation: 'هوانوردی',
  aircraft: 'هواگرد',
  missile: 'موشک',
  mine: 'مین',
  obstacle: 'مانع',
  obstacles: 'موانع',
  blue: 'آبی',
  purple: 'بنفش',
  irregular: 'نامنظم',
  circular: 'دایره‌ای',
  rectangular: 'مستطیلی',
  and: 'و',
  or: 'یا',
  of: 'از',
  for: 'برای',
  with: 'با'
}

const phraseTranslations = {
  'Civil Aircraft - Lighter Than Air': 'هواگرد غیرنظامی - سبک‌تر از هوا',
  'Civil Aircraft - Fixed Wing': 'هواگرد غیرنظامی - بال ثابت',
  'Civil Aircraft': 'هواگرد غیرنظامی',
  'Fixed Wing Aircraft': 'هواگرد بال ثابت',
  'Air Track': 'رد هوایی',
  'Ground Track': 'رد زمینی',
  'Sea Surface Track': 'رد سطحی دریایی',
  'Fixed Wing': 'بال ثابت',
  'Lighter Than Air': 'سبک‌تر از هوا',
  'Warfighting Symbols': 'نمادهای رزم',
  'Emergency Management Symbols': 'نمادهای مدیریت اضطراری',
  'Tactical Graphics': 'گرافیک‌های تاکتیکی',
  'Fire Support': 'پشتیبانی آتش',
  'Command and Control': 'فرماندهی و کنترل',
  'Command & Control': 'فرماندهی و کنترل',
  'Blue Kill Box': 'محدوده انهدام آبی',
  'Purple Kill Box': 'محدوده انهدام بنفش',
  'Kill Box': 'محدوده انهدام',
  'BKB': 'بی‌کی‌بی',
  'PKB': 'پی‌کی‌بی'
}

const acronymLetters = {
  A: 'اِی', B: 'بی', C: 'سی', D: 'دی', E: 'ای', F: 'اِف', G: 'جی',
  H: 'اِچ', I: 'آی', J: 'جِی', K: 'کِی', L: 'اِل', M: 'اِم', N: 'اِن',
  O: 'اُ', P: 'پی', Q: 'کیو', R: 'آر', S: 'اِس', T: 'تی', U: 'یو',
  V: 'وی', W: 'دابلیو', X: 'اِکس', Y: 'وای', Z: 'زِد'
}

const letters = {
  a: 'ا', b: 'ب', c: 'ک', d: 'د', e: 'ِ', f: 'ف', g: 'گ', h: 'ه',
  i: 'ی', j: 'ج', k: 'ک', l: 'ل', m: 'م', n: 'ن', o: 'و', p: 'پ',
  q: 'ک', r: 'ر', s: 'س', t: 'ت', u: 'و', v: 'و', w: 'و', x: 'کس',
  y: 'ی', z: 'ز'
}

function transliterate(word) {
  if (/^[A-Z][A-Z0-9-]+$/.test(word)) {
    return [...word].map(char => acronymLetters[char] || char).join('‌')
  }

  return [...word.toLowerCase()].map(char => letters[char] || char).join('')
}

export function ensurePersianTacticalLabel(value) {
  if (!value) return value

  const translatedPhrases = Object.entries(phraseTranslations)
    .sort(([a], [b]) => b.length - a.length)
    .reduce((label, [phrase, translation]) => {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return label.replace(new RegExp(escaped, 'gi'), translation)
    }, value)

  return translatedPhrases.replace(/[A-Za-z]+(?:-[A-Za-z]+)*/g, word => {
    return wordTranslations[word.toLowerCase()] || transliterate(word)
  })
}
