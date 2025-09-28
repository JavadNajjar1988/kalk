// لیست کشورهای جهان به همراه کد پرچم آنها
// کد پرچم‌ها بر اساس استاندارد ISO 3166-1 alpha-2 است که می‌توان از آن برای نمایش پرچم استفاده کرد

export interface Country {
  code: string; // کد ISO کشور (برای پرچم)
  name: string; // نام کشور به فارسی
  nameEn: string; // نام انگلیسی کشور
  continent: 'asia' | 'europe' | 'africa' | 'americas' | 'oceania'; // قاره
  isNato?: boolean; // عضو ناتو
  isEU?: boolean; // عضو اتحادیه اروپا
  isCIS?: boolean; // عضو کشورهای مستقل مشترک‌المنافع
}

const countries: Country[] = [
  // آسیا
  { code: 'IR', name: 'ایران', nameEn: 'Iran', continent: 'asia' },
  { code: 'AF', name: 'افغانستان', nameEn: 'Afghanistan', continent: 'asia' },
  { code: 'SA', name: 'عربستان سعودی', nameEn: 'Saudi Arabia', continent: 'asia' },
  { code: 'IQ', name: 'عراق', nameEn: 'Iraq', continent: 'asia' },
  { code: 'TR', name: 'ترکیه', nameEn: 'Turkey', continent: 'asia', isNato: true },
  { code: 'SY', name: 'سوریه', nameEn: 'Syria', continent: 'asia' },
  { code: 'PK', name: 'پاکستان', nameEn: 'Pakistan', continent: 'asia' },
  { code: 'AZ', name: 'آذربایجان', nameEn: 'Azerbaijan', continent: 'asia', isCIS: true },
  { code: 'AM', name: 'ارمنستان', nameEn: 'Armenia', continent: 'asia', isCIS: true },
  { code: 'IL', name: 'اسرائیل', nameEn: 'Israel', continent: 'asia' },
  { code: 'JO', name: 'اردن', nameEn: 'Jordan', continent: 'asia' },
  { code: 'LB', name: 'لبنان', nameEn: 'Lebanon', continent: 'asia' },
  { code: 'AE', name: 'امارات متحده عربی', nameEn: 'United Arab Emirates', continent: 'asia' },
  { code: 'QA', name: 'قطر', nameEn: 'Qatar', continent: 'asia' },
  { code: 'KW', name: 'کویت', nameEn: 'Kuwait', continent: 'asia' },
  { code: 'OM', name: 'عمان', nameEn: 'Oman', continent: 'asia' },
  { code: 'BH', name: 'بحرین', nameEn: 'Bahrain', continent: 'asia' },
  { code: 'YE', name: 'یمن', nameEn: 'Yemen', continent: 'asia' },
  { code: 'IN', name: 'هند', nameEn: 'India', continent: 'asia' },
  { code: 'CN', name: 'چین', nameEn: 'China', continent: 'asia' },
  { code: 'JP', name: 'ژاپن', nameEn: 'Japan', continent: 'asia' },
  { code: 'KR', name: 'کره جنوبی', nameEn: 'South Korea', continent: 'asia' },
  { code: 'KP', name: 'کره شمالی', nameEn: 'North Korea', continent: 'asia' },
  { code: 'MY', name: 'مالزی', nameEn: 'Malaysia', continent: 'asia' },
  { code: 'ID', name: 'اندونزی', nameEn: 'Indonesia', continent: 'asia' },
  { code: 'TH', name: 'تایلند', nameEn: 'Thailand', continent: 'asia' },
  { code: 'VN', name: 'ویتنام', nameEn: 'Vietnam', continent: 'asia' },
  { code: 'PH', name: 'فیلیپین', nameEn: 'Philippines', continent: 'asia' },
  { code: 'MM', name: 'میانمار', nameEn: 'Myanmar', continent: 'asia' },
  { code: 'KZ', name: 'قزاقستان', nameEn: 'Kazakhstan', continent: 'asia', isCIS: true },
  { code: 'UZ', name: 'ازبکستان', nameEn: 'Uzbekistan', continent: 'asia', isCIS: true },
  { code: 'TJ', name: 'تاجیکستان', nameEn: 'Tajikistan', continent: 'asia', isCIS: true },
  { code: 'TM', name: 'ترکمنستان', nameEn: 'Turkmenistan', continent: 'asia', isCIS: true },
  { code: 'KG', name: 'قرقیزستان', nameEn: 'Kyrgyzstan', continent: 'asia', isCIS: true },
  { code: 'MN', name: 'مغولستان', nameEn: 'Mongolia', continent: 'asia' },
  
  // اروپا
  { code: 'RU', name: 'روسیه', nameEn: 'Russia', continent: 'europe', isCIS: true },
  { code: 'GB', name: 'بریتانیا', nameEn: 'United Kingdom', continent: 'europe', isNato: true },
  { code: 'FR', name: 'فرانسه', nameEn: 'France', continent: 'europe', isNato: true, isEU: true },
  { code: 'DE', name: 'آلمان', nameEn: 'Germany', continent: 'europe', isNato: true, isEU: true },
  { code: 'IT', name: 'ایتالیا', nameEn: 'Italy', continent: 'europe', isNato: true, isEU: true },
  { code: 'ES', name: 'اسپانیا', nameEn: 'Spain', continent: 'europe', isNato: true, isEU: true },
  { code: 'UA', name: 'اوکراین', nameEn: 'Ukraine', continent: 'europe' },
  { code: 'PL', name: 'لهستان', nameEn: 'Poland', continent: 'europe', isNato: true, isEU: true },
  { code: 'RO', name: 'رومانی', nameEn: 'Romania', continent: 'europe', isNato: true, isEU: true },
  { code: 'NL', name: 'هلند', nameEn: 'Netherlands', continent: 'europe', isNato: true, isEU: true },
  { code: 'BE', name: 'بلژیک', nameEn: 'Belgium', continent: 'europe', isNato: true, isEU: true },
  { code: 'GR', name: 'یونان', nameEn: 'Greece', continent: 'europe', isNato: true, isEU: true },
  { code: 'PT', name: 'پرتغال', nameEn: 'Portugal', continent: 'europe', isNato: true, isEU: true },
  { code: 'SE', name: 'سوئد', nameEn: 'Sweden', continent: 'europe', isNato: true, isEU: true },
  { code: 'CZ', name: 'جمهوری چک', nameEn: 'Czech Republic', continent: 'europe', isNato: true, isEU: true },
  { code: 'HU', name: 'مجارستان', nameEn: 'Hungary', continent: 'europe', isNato: true, isEU: true },
  { code: 'BY', name: 'بلاروس', nameEn: 'Belarus', continent: 'europe', isCIS: true },
  { code: 'AT', name: 'اتریش', nameEn: 'Austria', continent: 'europe', isEU: true },
  { code: 'CH', name: 'سوئیس', nameEn: 'Switzerland', continent: 'europe' },
  { code: 'BG', name: 'بلغارستان', nameEn: 'Bulgaria', continent: 'europe', isNato: true, isEU: true },
  { code: 'DK', name: 'دانمارک', nameEn: 'Denmark', continent: 'europe', isNato: true, isEU: true },
  { code: 'FI', name: 'فنلاند', nameEn: 'Finland', continent: 'europe', isNato: true, isEU: true },
  { code: 'SK', name: 'اسلواکی', nameEn: 'Slovakia', continent: 'europe', isNato: true, isEU: true },
  { code: 'NO', name: 'نروژ', nameEn: 'Norway', continent: 'europe', isNato: true },
  { code: 'IE', name: 'ایرلند', nameEn: 'Ireland', continent: 'europe', isEU: true },
  { code: 'HR', name: 'کرواسی', nameEn: 'Croatia', continent: 'europe', isNato: true, isEU: true },
  { code: 'MD', name: 'مولداوی', nameEn: 'Moldova', continent: 'europe' },
  { code: 'BA', name: 'بوسنی و هرزگوین', nameEn: 'Bosnia and Herzegovina', continent: 'europe' },
  { code: 'AL', name: 'آلبانی', nameEn: 'Albania', continent: 'europe', isNato: true },
  { code: 'LT', name: 'لیتوانی', nameEn: 'Lithuania', continent: 'europe', isNato: true, isEU: true },
  { code: 'MK', name: 'مقدونیه شمالی', nameEn: 'North Macedonia', continent: 'europe', isNato: true },
  { code: 'SI', name: 'اسلوونی', nameEn: 'Slovenia', continent: 'europe', isNato: true, isEU: true },
  { code: 'LV', name: 'لتونی', nameEn: 'Latvia', continent: 'europe', isNato: true, isEU: true },
  { code: 'EE', name: 'استونی', nameEn: 'Estonia', continent: 'europe', isNato: true, isEU: true },
  
  // آمریکا
  { code: 'US', name: 'ایالات متحده آمریکا', nameEn: 'United States', continent: 'americas', isNato: true },
  { code: 'CA', name: 'کانادا', nameEn: 'Canada', continent: 'americas', isNato: true },
  { code: 'MX', name: 'مکزیک', nameEn: 'Mexico', continent: 'americas' },
  { code: 'BR', name: 'برزیل', nameEn: 'Brazil', continent: 'americas' },
  { code: 'AR', name: 'آرژانتین', nameEn: 'Argentina', continent: 'americas' },
  { code: 'CO', name: 'کلمبیا', nameEn: 'Colombia', continent: 'americas' },
  { code: 'CL', name: 'شیلی', nameEn: 'Chile', continent: 'americas' },
  { code: 'PE', name: 'پرو', nameEn: 'Peru', continent: 'americas' },
  { code: 'VE', name: 'ونزوئلا', nameEn: 'Venezuela', continent: 'americas' },
  { code: 'CU', name: 'کوبا', nameEn: 'Cuba', continent: 'americas' },
  
  // آفریقا
  { code: 'EG', name: 'مصر', nameEn: 'Egypt', continent: 'africa' },
  { code: 'ZA', name: 'آفریقای جنوبی', nameEn: 'South Africa', continent: 'africa' },
  { code: 'NG', name: 'نیجریه', nameEn: 'Nigeria', continent: 'africa' },
  { code: 'DZ', name: 'الجزایر', nameEn: 'Algeria', continent: 'africa' },
  { code: 'MA', name: 'مراکش', nameEn: 'Morocco', continent: 'africa' },
  { code: 'TN', name: 'تونس', nameEn: 'Tunisia', continent: 'africa' },
  { code: 'KE', name: 'کنیا', nameEn: 'Kenya', continent: 'africa' },
  { code: 'ET', name: 'اتیوپی', nameEn: 'Ethiopia', continent: 'africa' },
  { code: 'GH', name: 'غنا', nameEn: 'Ghana', continent: 'africa' },
  { code: 'LY', name: 'لیبی', nameEn: 'Libya', continent: 'africa' },
  
  // اقیانوسیه
  { code: 'AU', name: 'استرالیا', nameEn: 'Australia', continent: 'oceania' },
  { code: 'NZ', name: 'نیوزیلند', nameEn: 'New Zealand', continent: 'oceania' },
];

export default countries;

// تابع کمکی برای گرفتن URL پرچم کشور
export const getFlagUrl = (countryCode: string): string => {
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
};

// تابع کمکی برای گرفتن URL پرچم کشور با اندازه بزرگتر
export const getLargeFlagUrl = (countryCode: string): string => {
  return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
};

// تابع کمکی برای گرفتن کشورها بر اساس قاره
export const getCountriesByContinent = (continent: Country['continent']): Country[] => {
  return countries.filter(country => country.continent === continent);
};

// تابع کمکی برای گرفتن کشورهای عضو ناتو
export const getNatoCountries = (): Country[] => {
  return countries.filter(country => country.isNato);
};

// تابع کمکی برای گرفتن کشورهای عضو اتحادیه اروپا
export const getEUCountries = (): Country[] => {
  return countries.filter(country => country.isEU);
};

// تابع کمکی برای گرفتن کشورهای عضو CIS
export const getCISCountries = (): Country[] => {
  return countries.filter(country => country.isCIS);
}; 