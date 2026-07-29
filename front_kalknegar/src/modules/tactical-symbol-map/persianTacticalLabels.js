import { findReviewedEntityTranslation } from '../../symbology/translations'

// High-frequency MIL-STD-2525 / SKKM vocabulary used at every hierarchy level.
export const tacticalWordTranslations = {
  and: 'و', of: 'از', or: 'یا', for: 'برای', with: 'با', in: 'در', at: 'در', by: 'توسط',
  under: 'زیر', only: 'فقط', track: 'رد', warfighting: 'رزم', unit: 'یگان',
  combat: 'رزمی', general: 'عمومی', maneuver: 'مانور', point: 'نقطه', points: 'نقاط',
  surface: 'سطحی', weapon: 'سلاح', weapons: 'سلاح‌ها', intelligence: 'اطلاعات',
  wing: 'بال', missile: 'موشک', signal: 'سیگنال', signals: 'سیگنال‌ها',
  intercept: 'رهگیری', radar: 'رادار', mine: 'مین', fixed: 'ثابت', launcher: 'پرتابگر',
  warfare: 'جنگ', aviation: 'هوانوردی', stability: 'ثبات', artillery: 'توپخانه',
  underwater: 'زیرآبی', station: 'ایستگاه', theater: 'صحنه عملیات', target: 'هدف',
  targets: 'اهداف', obstacle: 'مانع', obstacles: 'موانع', defense: 'دفاع',
  utility: 'چندمنظوره', field: 'صحرایی', corps: 'سپاه', rotary: 'چرخان',
  combatant: 'رزمنده', class: 'رده', line: 'خط', lines: 'خطوط', light: 'سبک',
  administrative: 'اداری', submarine: 'زیردریایی', nuclear: 'هسته‌ای',
  heavy: 'سنگین', engineer: 'مهندسی', medium: 'متوسط', armored: 'زرهی',
  trailer: 'تریلر', civilian: 'غیرنظامی', material: 'مواد', materiel: 'تجهیزات',
  reconnaissance: 'شناسایی', drone: 'پهپاد', gun: 'توپ', antitank: 'ضدتانک',
  truck: 'کامیون', zone: 'منطقه', zones: 'مناطق', rocket: 'راکت',
  unmanned: 'بدون سرنشین', biological: 'زیستی', site: 'محل',
  maintenance: 'نگهداری', communications: 'ارتباطات', offense: 'تهاجم',
  'non-military': 'غیرنظامی', range: 'برد', attack: 'حمله', patrol: 'گشت',
  airborne: 'هوابرد', armor: 'زره', sensor: 'حسگر', radiological: 'پرتوی',
  crossing: 'گذرگاه', howitzer: 'هویتزر', mortar: 'خمپاره', irregular: 'نامنظم',
  box: 'جعبه', acquisition: 'کسب هدف', flight: 'پرواز', assault: 'یورش',
  bypass: 'دورگذر', unspecified: 'نامشخص', multiple: 'چندگانه', wheeled: 'چرخ‌دار',
  single: 'تک', aircraft: 'هواگرد', decoy: 'فریب', electronic: 'الکترونیکی',
  tractor: 'کشنده', position: 'موضع', antisubmarine: 'ضدزیردریایی',
  sonobuoy: 'سونوبوی', wire: 'سیم', 'mine-like': 'مین‌مانند',
  surveillance: 'مراقبت', antiarmor: 'ضدزره', moored: 'مهارشده', route: 'مسیر',
  routes: 'مسیرها', action: 'اقدام', hazard: 'خطر', transporter: 'حامل',
  amphibious: 'آبی‌خاکی', propulsion: 'پیشرانش', floating: 'شناور',
  reference: 'مرجع', contact: 'تماس', decontamination: 'رفع آلودگی',
  mines: 'مین‌ها', bottom: 'کف', recovery: 'بازیابی', infantry: 'پیاده‌نظام',
  'self-propelled': 'خودکششی', ship: 'کشتی', towed: 'یدک‌کش', smoke: 'دود',
  ordnance: 'مهمات', internal: 'داخلی', cargo: 'باربری', affairs: 'امور',
  vessel: 'شناور', generic: 'عمومی', psychological: 'روانی',
  launched: 'پرتاب‌شونده', craft: 'شناور', short: 'کوتاه', long: 'بلند',
  research: 'پژوهش', motorized: 'موتوریزه', merchant: 'تجاری', traffic: 'ترافیک',
  landing: 'فرود', civil: 'مدنی', marine: 'دریایی', observation: 'دیدبانی',
  outpost: 'پاسگاه', noncombatant: 'غیررزمی', small: 'کوچک', person: 'فرد',
  airlift: 'ترابری هوایی', naval: 'دریایی', tank: 'تانک', large: 'بزرگ',
  mountain: 'کوهستانی', navy: 'نیروی دریایی', gas: 'گاز', rail: 'ریلی',
  collection: 'تجمع', fighting: 'رزم', early: 'زودهنگام', warning: 'هشدار',
  advance: 'پیشروی', deception: 'فریب', holding: 'نگهداری', satellite: 'ماهواره',
  tracking: 'ردگیری', countermeasures: 'اقدامات متقابل', direct: 'مستقیم',
  raw: 'خام', release: 'رهاسازی', police: 'پلیس', kill: 'انهدام',
  survey: 'نقشه‌برداری', engagement: 'درگیری', direction: 'جهت', harbor: 'بندر',
  data: 'داده', axis: 'محور', construction: 'احداث', fence: 'حصار',
  composite: 'ترکیبی', tanker: 'سوخت‌رسان', conventional: 'متعارف',
  exercise: 'تمرینی', venues: 'اماکن', religious: 'مذهبی', criminal: 'مجرمانه',
  accident: 'سانحه', information: 'اطلاعات', forward: 'جلو', dismounted: 'پیاده',
  system: 'سامانه', movement: 'حرکت', effect: 'اثر', minefields: 'میادین مین',
  roadblocks: 'موانع جاده‌ای', ammunition: 'مهمات', transmission: 'انتقال',
  radio: 'رادیو', carrier: 'حامل', personnel: 'نفرات', rifle: 'تفنگ',
  mechanized: 'مکانیزه', cavalry: 'سواره‌نظام', package: 'بسته', tower: 'برج',
  ferry: 'کشتی مسافربری', treatment: 'تصفیه', bomb: 'بمب', explosion: 'انفجار',
  hijacking: 'هواپیماربایی', ambulance: 'آمبولانس', border: 'مرز',
  customs: 'گمرک', guard: 'نگهبانی', restrictive: 'محدودکننده', linear: 'خطی',
  high: 'بالا', orbit: 'مدار', roadblock: 'مانع جاده‌ای', controlled: 'کنترل‌شده',
  loss: 'تلفات', boat: 'قایق', killing: 'قتل', automobile: 'خودرو', jeep: 'جیپ',
  automatic: 'خودکار', grenade: 'نارنجک', base: 'پایگاه', electric: 'برقی',
  power: 'نیرو', joint: 'مشترک', element: 'عنصر', littoral: 'ساحلی',
  fishing: 'ماهیگیری', possible: 'احتمالی', surfaced: 'سطحی', negative: 'منفی',
  symbol: 'نماد', symbols: 'نمادها', air: 'هوایی', enemy: 'دشمن',
  prisoner: 'اسیر', war: 'جنگ', arming: 'مسلح‌سازی', refueling: 'سوخت‌گیری',
  area: 'منطقه', support: 'پشتیبانی', command: 'فرماندهی', control: 'کنترل',
  equipment: 'تجهیزات', retailer: 'خرده‌فروشی', industrial: 'صنعتی',
  waste: 'پسماند', toxic: 'سمی', educational: 'آموزشی', school: 'مدرسه',
  government: 'دولتی', postal: 'پستی', office: 'اداره', open: 'باز',
  child: 'کودک', elder: 'سالمند', telecommunications: 'مخابرات',
  terminal: 'پایانه', helicopter: 'بالگرد', inspection: 'بازرسی',
  tunnel: 'تونل', dam: 'سد', reservoir: 'مخزن', wastewater: 'فاضلاب',
  disturbance: 'ناآرامی', rioting: 'شورش', threat: 'تهدید',
  looting: 'غارت', shooting: 'تیراندازی', residential: 'مسکونی',
  corrosive: 'خورنده', explosive: 'انفجاری', flammable: 'قابل اشتعال',
  liquid: 'مایع', solid: 'جامد', radioactive: 'رادیواکتیو',
  infectious: 'عفونی', unexploded: 'عمل‌نکرده', avalanche: 'بهمن',
  earthquake: 'زلزله', landslide: 'رانش زمین', drought: 'خشکسالی',
  flood: 'سیل', evacuation: 'تخلیه', patient: 'بیمار', morgue: 'سردخانه',
  pharmacy: 'داروخانه', triage: 'تریاژ', team: 'تیم', prison: 'زندان',
  coast: 'ساحل', intrusion: 'نفوذ', firing: 'شلیک', launch: 'پرتاب',
  reload: 'بارگذاری مجدد', prepared: 'آماده', occupied: 'اشغال‌شده',
  listening: 'شنود', assembly: 'تجمع', fortified: 'مستحکم',
  replenishment: 'تجدید تدارکات', formation: 'آرایش', active: 'فعال',
  frequency: 'فرکانس', vertical: 'عمودی', impact: 'اصابت', detect: 'کشف',
  predicted: 'پیش‌بینی‌شده', objective: 'هدف', penetration: 'نفوذ',
  infiltration: 'نفوذ', lane: 'معبر', deployment: 'گسترش',
  minefield: 'میدان مین', dynamic: 'پویا', static: 'ثابت',
  encirclement: 'محاصره', ambush: 'کمین', bridgehead: 'سرپل',
  operational: 'عملیاتی', safe: 'ایمن', distance: 'فاصله',
  ditch: 'خندق', complete: 'کامل', wall: 'دیوار', trap: 'تله',
  block: 'مسدودسازی', disrupt: 'اخلال', antipersonnel: 'ضدنفر',
  trench: 'سنگر', fortification: 'استحکامات', underground: 'زیرزمینی',
  torpedo: 'اژدر', iceberg: 'کوه یخ', oil: 'نفت', seabed: 'بستر دریا',
  dangerous: 'خطرناک', detainee: 'بازداشت‌شده', refugee: 'پناهنده',
  brigade: 'تیپ', division: 'لشکر', regimental: 'هنگ', convoy: 'کاروان',
  moving: 'متحرک', transfer: 'انتقال', logistics: 'آماد',
  resupply: 'تجدید تدارکات', destroy: 'انهدام', isolate: 'جداسازی',
  contain: 'مهار', counterattack: 'پاتک', neutralize: 'خنثی‌سازی',
  occupy: 'اشغال', withdraw: 'عقب‌نشینی', clear: 'پاک‌سازی',
  seize: 'تصرف', battlefield: 'میدان نبرد', displaced: 'آواره',
  persons: 'افراد', terrorist: 'تروریست', insurgent: 'شورشی',
  arrest: 'بازداشت', demonstration: 'تظاهرات', kidnapping: 'آدم‌ربایی',
  recruitment: 'جذب نیرو', propaganda: 'تبلیغات', leader: 'رهبر',
  arson: 'آتش‌افروزی', execution: 'اعدام', assassination: 'ترور',
  poisoning: 'مسموم‌سازی', sniping: 'تک‌تیراندازی', escort: 'اسکورت',
  bomber: 'بمب‌افکن', fighter: 'جنگنده', interceptor: 'رهگیر',
  jammer: 'اخلالگر', trainer: 'آموزشی', ranger: 'تکاور',
  demolition: 'تخریب', crane: 'جرثقیل', train: 'قطار',
  recoilless: 'بدون عقب‌نشینی', firearm: 'سلاح گرم',
  improvised: 'دست‌ساز', laser: 'لیزر', airport: 'فرودگاه',
  airbase: 'پایگاه هوایی', seaport: 'بندر دریایی', reactor: 'راکتور',
  engineering: 'مهندسی', petroleum: 'نفت', fuel: 'سوخت',
  tracked: 'زنجیری', arctic: 'قطبی', targeting: 'هدف‌گیری',
  headquarters: 'ستاد', veterinary: 'دامپزشکی', purification: 'تصفیه',
  disposal: 'دفع', counterintelligence: 'ضداطلاعات',
  interrogation: 'بازجویی', jamming: 'اخلال', node: 'گره',
  relay: 'رله', telephone: 'تلفن', battleship: 'ناو جنگی',
  cruiser: 'رزم‌ناو', destroyer: 'ناوشکن', frigate: 'ناوچه',
  mission: 'مأموریت', minelayer: 'مین‌ریز', minesweeper: 'مین‌روب',
  fleet: 'ناوگان', speed: 'سرعت', passenger: 'مسافری',
  environmental: 'محیط‌زیستی', report: 'گزارش', diver: 'غواص',
  anchor: 'لنگر', infection: 'عفونت', radiation: 'پرتو',
  flooding: 'آب‌گرفتگی', contamination: 'آلودگی', leak: 'نشت',
  damaged: 'آسیب‌دیده', impaired: 'مختل', destroyed: 'منهدم',
  blocked: 'مسدود', commander: 'فرمانده', injured: 'مجروح',
  killed: 'کشته', missing: 'مفقود', permanent: 'دائمی', temporary: 'موقت',
  blue: 'آبی', purple: 'بنفش', emergency: 'اضطراری', management: 'مدیریت',
  infrastructure: 'زیرساخت', agriculture: 'کشاورزی', agricultural: 'کشاورزی',
  food: 'غذا', laboratory: 'آزمایشگاه', animal: 'حیوان', feedlot: 'دامداری',
  commercial: 'تجاری', distribution: 'توزیع', center: 'مرکز', farm: 'مزرعه',
  ranch: 'دامداری', production: 'تولید', retail: 'خرده‌فروشی', grain: 'غلات',
  storage: 'ذخیره‌سازی', finance: 'مالی', insurance: 'بیمه', bank: 'بانک',
  chemical: 'شیمیایی', plant: 'کارخانه', facilities: 'تأسیسات',
  public: 'عمومی', transportation: 'حمل‌ونقل', medical: 'پزشکی',
  operations: 'عملیات', operation: 'عملیات', service: 'خدمات',
  incident: 'حادثه', natural: 'طبیعی', events: 'رویدادها',
  tactical: 'تاکتیکی', graphics: 'گرافیک‌ها', areas: 'مناطق',
  airspace: 'حریم هوایی', coordination: 'هماهنگی', circular: 'دایره‌ای',
  rectangular: 'مستطیلی', irregular: 'نامنظم', 'build-up': 'تجمع',
  free: 'آزاد', no: 'ممنوع', responsibility: 'مسئولیت',
  friendly: 'خودی', series: 'سری', boundary: 'مرز', boundaries: 'مرزها',
  adult: 'بزرگسال', adults: 'بزرگسالان', day: 'روز', days: 'روزها',
  care: 'مراقبت', banking: 'بانکداری', atm: 'خودپرداز', bullion: 'شمش',
  federal: 'فدرال', reserve: 'ذخیره', financial: 'مالی', exchange: 'تبادل',
  services: 'خدمات', other: 'سایر', firearms: 'سلاح‌ها',
  manufacturer: 'تولیدکننده', hazardous: 'خطرناک', landfill: 'محل دفن زباله',
  pharmaceutical: 'دارویی', contaminated: 'آلوده', inventory: 'انبار',
  college: 'دانشکده', university: 'دانشگاه', generation: 'تولید',
  propane: 'پروپان', military: 'نظامی', armory: 'اسلحه‌خانه',
  post: 'پست', enclosed: 'محصور', recreational: 'تفریحی',
  institution: 'مؤسسه', special: 'ویژه', needs: 'نیازها',
  bus: 'اتوبوس', rest: 'استراحت', stop: 'ایستگاه', toll: 'عوارضی',
  valve: 'شیر', discharge: 'تخلیه', outfall: 'خروجی', well: 'چاه',
  pumping: 'پمپاژ', intake: 'ورودی', hot: 'داغ', spot: 'نقطه',
  'non-residential': 'غیرمسکونی', origin: 'مبدأ', wild: 'طبیعی',
  agent: 'عامل', organic: 'آلی', peroxide: 'پراکسید', oxidizer: 'اکسیدکننده',
  combustible: 'قابل‌احتراق', department: 'اداره', staging: 'آماده‌سازی',
  hydrant: 'شیر آتش‌نشانی', law: 'قانون', enforcement: 'اجرای قانون',
  shelter: 'پناهگاه', geological: 'زمین‌شناسی', geologic: 'زمین‌شناسی',
  aftershock: 'پس‌لرزه', epicenter: 'مرکز زلزله', volcanic: 'آتشفشانی',
  tsunami: 'سونامی', infestation: 'هجوم آفات', insect: 'حشره',
  microbial: 'میکروبی', reptile: 'خزنده', rodent: 'جونده',
  planned: 'برنامه‌ریزی‌شده', anticipated: 'پیش‌بینی‌شده',
  present: 'حاضر', friend: 'دوست', hostile: 'دشمن', neutral: 'خنثی'
}

export const tacticalPhraseTranslations = {
  'Armored Reconnaissance Unit': 'یگان شناسایی زرهی',
  'Emergency Medical Operation Unit': 'یگان عملیات پزشکی اضطراری',
  'Emergency Operation Unit': 'یگان عملیات اضطراری',
  'Fire Fighting Operation Unit': 'یگان عملیات آتش‌نشانی',
  'Law Enforcement Operation Unit': 'یگان عملیات اجرای قانون',
  'Fire Support Area': 'منطقه پشتیبانی آتش',
  'Fire Support Coordination Line': 'خط هماهنگی پشتیبانی آتش',
  'Signals Intelligence': 'اطلاعات سیگنالی',
  'Signal Intercept': 'رهگیری سیگنال',
  'Blue Kill Box (BKB) - Irregular': 'محدوده انهدام آبی (بی‌کی‌بی) - نامنظم',
  'Civil Aircraft - Lighter Than Air': 'هواگرد غیرنظامی - سبک‌تر از هوا',
  'Civil Aircraft - Fixed Wing': 'هواگرد غیرنظامی - بال ثابت',
  'Civil Aircraft': 'هواگرد غیرنظامی',
  'Fixed Wing Aircraft': 'هواگرد بال ثابت',
  'Air Track': 'رد هوایی',
  'Ground Track': 'رد زمینی',
  'Sea Surface Track': 'رد سطحی دریایی',
  'Fixed Wing': 'بال ثابت',
  'Lighter Than Air': 'سبک‌تر از هوا',
  'Blue Kill Box': 'محدوده انهدام آبی',
  'Purple Kill Box': 'محدوده انهدام بنفش',
  'Kill Box': 'محدوده انهدام',
  'BKB': 'بی‌کی‌بی',
  'PKB': 'پی‌کی‌بی',
  'Tactical Graphics': 'گرافیک‌های تاکتیکی',
  'Fire Support': 'پشتیبانی آتش',
  'Command and Control': 'فرماندهی و کنترل',
  'Command & Control': 'فرماندهی و کنترل',
  'Emergency Management Symbols': 'نمادهای مدیریت اضطراری',
  'Warfighting Symbols': 'نمادهای رزم'
}

const acronymLetters = {
  A: 'اِی', B: 'بی', C: 'سی', D: 'دی', E: 'ای', F: 'اِف', G: 'جی',
  H: 'اِچ', I: 'آی', J: 'جِی', K: 'کِی', L: 'اِل', M: 'اِم', N: 'اِن',
  O: 'اُ', P: 'پی', Q: 'کیو', R: 'آر', S: 'اِس', T: 'تی', U: 'یو',
  V: 'وی', W: 'دابلیو', X: 'اِکس', Y: 'وای', Z: 'زِد'
}

const digraphs = {
  tch: 'چ', sch: 'ش', sh: 'ش', ch: 'چ', kh: 'خ', gh: 'غ', ph: 'ف',
  th: 'ث', zh: 'ژ', ck: 'ک', qu: 'کو', oo: 'و', ee: 'ی', ea: 'ی',
  ou: 'او', ow: 'او', ai: 'ای', ay: 'ای'
}

const letters = {
  a: 'ا', b: 'ب', c: 'ک', d: 'د', e: 'ِ', f: 'ف', g: 'گ', h: 'ه',
  i: 'ی', j: 'ج', k: 'ک', l: 'ل', m: 'م', n: 'ن', o: 'و', p: 'پ',
  q: 'ک', r: 'ر', s: 'س', t: 'ت', u: 'و', v: 'و', w: 'و', x: 'کس',
  y: 'ی', z: 'ز'
}

function transliterateWord(word) {
  if (/^[A-Z][A-Z0-9-]+$/.test(word)) {
    return [...word].map(char => acronymLetters[char] || char).join('‌')
  }

  const lower = word.toLowerCase()
  const sequences = Object.keys(digraphs).sort((a, b) => b.length - a.length)
  let result = ''
  let index = 0

  while (index < lower.length) {
    const sequence = sequences.find(item => lower.startsWith(item, index))
    if (sequence) {
      result += digraphs[sequence]
      index += sequence.length
    } else {
      result += letters[lower[index]] || lower[index]
      index += 1
    }
  }

  return result.replace(/ِ+/g, 'ِ')
}

const separatorPattern = /(\s+[•/]\s+|\s+-\s+)/
const isSeparator = value => separatorPattern.test(value)
const reviewedTranslation = value =>
  tacticalPhraseTranslations[value] || findReviewedEntityTranslation(value)

// Unknown labels remain in their source language until a reviewed phrase is
// added. This avoids presenting transliteration as if it were a translation.
export function ensurePersianTacticalLabel(value) {
  if (!value) return value

  const exact = reviewedTranslation(value)
  if (exact) return exact

  const parts = value.split(separatorPattern)
  if (parts.length === 1) return value

  const labels = parts.filter(part => !isSeparator(part))
  if (!labels.every(part => reviewedTranslation(part))) return value

  return parts
    .map(part => isSeparator(part) ? part : reviewedTranslation(part))
    .join('')
}
