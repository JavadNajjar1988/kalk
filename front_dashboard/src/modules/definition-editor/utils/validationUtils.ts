// Validation utilities for personnel forms
// پیاده‌سازی utilities اعتبارسنجی برای فرم‌های پرسنلی

/**
 * اعتبارسنجی فیلدهای انگلیسی - فقط حروف انگلیسی مجاز
 */
export const validateEnglishOnly = (value: string): boolean => {
  if (!value || value.trim() === '') return true; // اختیاری است
  const englishRegex = /^[a-zA-Z\s\-'.]+$/;
  return englishRegex.test(value.trim());
};

/**
 * اعتبارسنجی فیلدهای عددی - فقط اعداد مجاز
 */
export const validateNumericOnly = (value: string | number): boolean => {
  if (value === '' || value === null || value === undefined) return true;
  const numericRegex = /^\d+$/;
  return numericRegex.test(String(value));
};

/**
 * اعتبارسنجی کد ملی ایرانی
 * الگوریتم کامل چک‌سام کد ملی ایران
 */
export const validateIranianNationalId = (nationalId: string): boolean => {
  if (!nationalId || nationalId.length !== 10) return false;
  
  // حذف کدهای غیرمعتبر معروف
  const invalidIds = [
    '0000000000', '1111111111', '2222222222', '3333333333', '4444444444',
    '5555555555', '6666666666', '7777777777', '8888888888', '9999999999'
  ];
  
  if (invalidIds.includes(nationalId)) return false;
  
  // محاسبه چک‌سام
  const checkDigit = parseInt(nationalId[9]);
  let sum = 0;
  
  for (let i = 0; i < 9; i++) {
    sum += parseInt(nationalId[i]) * (10 - i);
  }
  
  const remainder = sum % 11;
  
  if (remainder < 2) {
    return checkDigit === remainder;
  } else {
    return checkDigit === 11 - remainder;
  }
};

/**
 * اعتبارسنجی شماره شناسایی لبنان
 * فرمت لبنان: 11 رقم
 */
export const validateLebanonId = (id: string): boolean => {
  if (!id) return false;
  const cleanId = id.replace(/\D/g, '');
  return cleanId.length === 11;
};

/**
 * اعتبارسنجی شماره شناسایی عراق
 * فرمت عراق: 12 رقم
 */
export const validateIraqId = (id: string): boolean => {
  if (!id) return false;
  const cleanId = id.replace(/\D/g, '');
  return cleanId.length === 12;
};

/**
 * اعتبارسنجی شماره شناسایی قطر
 * فرمت قطر: QID با 11 رقم
 */
export const validateQatarId = (id: string): boolean => {
  if (!id) return false;
  const cleanId = id.replace(/\D/g, '');
  return cleanId.length === 11;
};

/**
 * اعتبارسنجی بر اساس تابعیت
 */
export const validateNationalIdByCountry = (
  id: string, 
  nationality: string
): { isValid: boolean; message?: string } => {
  if (!id || !nationality) {
    return { isValid: false, message: 'شماره شناسایی و تابعیت الزامی است' };
  }

  switch (nationality.toLowerCase()) {
    case 'iranian':
    case 'ایرانی':
      if (!validateIranianNationalId(id)) {
        return { isValid: false, message: 'کد ملی ایرانی نامعتبر است' };
      }
      break;
    
    case 'lebanon':
    case 'لبنان':
    case 'لبنانی':
      if (!validateLebanonId(id)) {
        return { isValid: false, message: 'شماره شناسایی لبنان نامعتبر است (11 رقم)' };
      }
      break;
    
    case 'iraq':
    case 'عراق':
    case 'عراقی':
      if (!validateIraqId(id)) {
        return { isValid: false, message: 'شماره شناسایی عراق نامعتبر است (12 رقم)' };
      }
      break;
    
    case 'qatar':
    case 'قطر':
    case 'قطری':
      if (!validateQatarId(id)) {
        return { isValid: false, message: 'شماره شناسایی قطر نامعتبر است (11 رقم)' };
      }
      break;
    
    default:
      if (id.length < 6 || id.length > 20) {
        return { isValid: false, message: 'شماره شناسایی باید بین 6 تا 20 کاراکتر باشد' };
      }
  }
  
  return { isValid: true };
};

/**
 * اعتبارسنجی شماره تلفن
 */
export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  // فرمت‌های مختلف شماره تلفن ایران
  const iranPhoneRegex = /^(\+98|0)?9\d{9}$/;
  const landlineRegex = /^(\+98|0)?[1-8]\d{7,10}$/;
  
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  return iranPhoneRegex.test(cleanPhone) || landlineRegex.test(cleanPhone);
};

/**
 * نوع‌های برچسب شماره تلفن
 */
export const PHONE_LABELS = [
  { value: 'mobile', label: 'موبایل', icon: '📱' },
  { value: 'home', label: 'منزل', icon: '🏠' },
  { value: 'work', label: 'محل کار', icon: '🏢' },
  { value: 'emergency', label: 'اضطراری', icon: '🚨' },
  { value: 'fax', label: 'فکس', icon: '📠' },
  { value: 'other', label: 'سایر', icon: '📞' }
] as const;

/**
 * نوع‌های برچسب آدرس
 */
export const ADDRESS_LABELS = [
  { value: 'home', label: 'منزل', icon: '🏠' },
  { value: 'work', label: 'محل کار', icon: '🏢' },
  { value: 'birth', label: 'محل تولد', icon: '🎂' },
  { value: 'temporary', label: 'موقت', icon: '⏰' },
  { value: 'other', label: 'سایر', icon: '📍' }
] as const;

/**
 * لیست کشورهای پشتیبانی شده
 */
export const SUPPORTED_COUNTRIES = [
  { value: 'iranian', label: 'ایرانی', flag: '🇮🇷' },
  { value: 'lebanon', label: 'لبنانی', flag: '🇱🇧' },
  { value: 'iraq', label: 'عراقی', flag: '🇮🇶' },
  { value: 'qatar', label: 'قطری', flag: '🇶🇦' },
  { value: 'other', label: 'سایر', flag: '🌍' }
] as const;

export type PhoneLabel = typeof PHONE_LABELS[number]['value'];
export type AddressLabel = typeof ADDRESS_LABELS[number]['value'];
export type SupportedCountry = typeof SUPPORTED_COUNTRIES[number]['value'];