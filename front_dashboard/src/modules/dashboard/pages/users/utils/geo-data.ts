import { TCity, TCountry, TState, CountryCode } from '../types';

// Mock geography functions (replace with actual implementation)
export const getCountries = async (): Promise<TCountry[]> => {
  return [
    { code: 'IR', name: 'ایران' },
    { code: 'US', name: 'ایالات متحده آمریکا' },
    { code: 'DE', name: 'آلمان' },
  ];
};

export const getStates = async (countryCode: string): Promise<TState[]> => {
  if (countryCode === 'IR') {
    return [
      { code: 'TEH', name: 'تهران' },
      { code: 'ISF', name: 'اصفهان' },
      { code: 'SHI', name: 'شیراز' },
    ];
  }
  return [];
};

export const getCities = async (countryCode: string, stateCode: string): Promise<TCity[]> => {
  if (countryCode === 'IR' && stateCode === 'TEH') {
    return [
      { code: 'TEH_CITY', name: 'تهران' },
      { code: 'KARAJ', name: 'کرج' },
    ];
  }
  return [];
};

export const getAllCitiesOfCountry = async (countryCode: string): Promise<TCity[]> => {
  if (countryCode === 'IR') {
    return [
      { code: 'TEH_CITY', name: 'تهران' },
      { code: 'KARAJ', name: 'کرج' },
      { code: 'ISF_CITY', name: 'اصفهان' },
      { code: 'SHI_CITY', name: 'شیراز' },
    ];
  }
  return [];
};

// آواتارهای پروفایل با رنگ‌های مختلف
export const MILITARY_AVATARS = [
  { id: 'none', name: 'بدون پروفایل', path: null },
  { id: 'avatar1', name: 'آواتار ۱', path: '/assets/avatars/avatar1.svg' },
  { id: 'avatar2', name: 'آواتار ۲', path: '/assets/avatars/avatar2.svg' },
  { id: 'avatar3', name: 'آواتار ۳', path: '/assets/avatars/avatar3.svg' },
  { id: 'avatar4', name: 'آواتار ۴', path: '/assets/avatars/avatar4.svg' },
  { id: 'avatar5', name: 'آواتار ۵', path: '/assets/avatars/avatar5.svg' },
  { id: 'avatar6', name: 'آواتار ۶', path: '/assets/avatars/avatar6.svg' },
  { id: 'avatar7', name: 'آواتار ۷', path: '/assets/avatars/avatar7.svg' },
  { id: 'avatar8', name: 'آواتار ۸', path: '/assets/avatars/avatar8.svg' },
];

// لیست کامل کشورهای دنیا با پیش شماره
export const COUNTRY_CODES: CountryCode[] = [
  // آسیا
  { code: 'IR', dialCode: '+98', nameEn: 'Iran', nameFa: 'ایران', flag: '🇮🇷' },
  { code: 'AF', dialCode: '+93', nameEn: 'Afghanistan', nameFa: 'افغانستان', flag: '🇦🇫' },
  { code: 'US', dialCode: '+1', nameEn: 'United States', nameFa: 'ایالات متحده آمریکا', flag: '🇺🇸' },
  { code: 'DE', dialCode: '+49', nameEn: 'Germany', nameFa: 'آلمان', flag: '🇩🇪' },
  { code: 'FR', dialCode: '+33', nameEn: 'France', nameFa: 'فرانسه', flag: '🇫🇷' },
  { code: 'GB', dialCode: '+44', nameEn: 'United Kingdom', nameFa: 'انگلستان', flag: '🇬🇧' },
  { code: 'TR', dialCode: '+90', nameEn: 'Turkey', nameFa: 'ترکیه', flag: '🇹🇷' },
  { code: 'IQ', dialCode: '+964', nameEn: 'Iraq', nameFa: 'عراق', flag: '🇮🇶' },
  { code: 'SA', dialCode: '+966', nameEn: 'Saudi Arabia', nameFa: 'عربستان سعودی', flag: '🇸🇦' },
  { code: 'AE', dialCode: '+971', nameEn: 'UAE', nameFa: 'امارات متحده عربی', flag: '🇦🇪' },
]; 