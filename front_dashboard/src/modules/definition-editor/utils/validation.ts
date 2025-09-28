// Utilities برای validation

import { DefinitionNode, ExtendedHierarchyLevel, FormErrors, LevelFormErrors } from '../types';

// اعتبارسنجی نام
export function validateName(name: string, isRequired: boolean = true): string | undefined {
  if (isRequired && (!name || !name.trim())) {
    return 'نام الزامی است';
  }
  
  if (name && name.trim().length < 2) {
    return 'نام باید حداقل ۲ کاراکتر باشد';
  }
  
  if (name && name.trim().length > 100) {
    return 'نام نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد';
  }
  
  return undefined;
}

// اعتبارسنجی نام انگلیسی
export function validateEnglishName(name: string, isRequired: boolean = true): string | undefined {
  if (isRequired && (!name || !name.trim())) {
    return 'نام انگلیسی الزامی است';
  }
  
  if (name && name.trim().length < 2) {
    return 'نام انگلیسی باید حداقل ۲ کاراکتر باشد';
  }
  
  if (name && name.trim().length > 100) {
    return 'نام انگلیسی نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد';
  }
  
  // بررسی اینکه فقط حروف انگلیسی باشد
  if (name && !/^[a-zA-Z\s\-_]+$/.test(name.trim())) {
    return 'نام انگلیسی باید فقط شامل حروف انگلیسی باشد';
  }
  
  return undefined;
}

// اعتبارسنجی عدد سطح
export function validateLevelNumber(level: number, minLevel: number = 1, maxLevel: number = 10): string | undefined {
  if (!level || level < minLevel || level > maxLevel) {
    return `سطح باید بین ${minLevel} تا ${maxLevel} باشد`;
  }
  
  return undefined;
}

// اعتبارسنجی مختصات جغرافیایی
export function validateCoordinates(coordinates: { lat: number; lng: number } | undefined): string | undefined {
  if (!coordinates) {
    return undefined; // مختصات اختیاری است
  }
  
  const { lat, lng } = coordinates;
  
  if (lat < -90 || lat > 90) {
    return 'عرض جغرافیایی باید بین -90 تا 90 باشد';
  }
  
  if (lng < -180 || lng > 180) {
    return 'طول جغرافیایی باید بین -180 تا 180 باشد';
  }
  
  return undefined;
}

// اعتبارسنجی کشور
export function validateCountry(country: string | undefined, isRequired: boolean = false): string | undefined {
  if (isRequired && (!country || !country.trim())) {
    return 'کشور الزامی است';
  }
  
  if (country && country.trim().length < 2) {
    return 'کد کشور باید حداقل ۲ کاراکتر باشد';
  }
  
  if (country && country.trim().length > 3) {
    return 'کد کشور نمی‌تواند بیشتر از ۳ کاراکتر باشد';
  }
  
  return undefined;
}

// اعتبارسنجی معادل ناتو
export function validateNatoEquivalent(natoEquivalent: string | undefined): string | undefined {
  if (!natoEquivalent) {
    return undefined; // اختیاری است
  }
  
  if (natoEquivalent.trim().length < 2) {
    return 'معادل ناتو باید حداقل ۲ کاراکتر باشد';
  }
  
  if (natoEquivalent.trim().length > 10) {
    return 'معادل ناتو نمی‌تواند بیشتر از ۱۰ کاراکتر باشد';
  }
  
  // بررسی فرمت استاندارد ناتو (مثل OF-1, OF-2, etc.)
  if (!/^[A-Z]{1,2}-\d{1,2}$/.test(natoEquivalent.trim())) {
    return 'فرمت معادل ناتو نامعتبر است (مثال: OF-1, OF-10)';
  }
  
  return undefined;
}

// اعتبارسنجی آیکون
export function validateIcon(icon: string | undefined): string | undefined {
  if (!icon) {
    return undefined; // اختیاری است
  }
  
  if (icon.trim().length > 10) {
    return 'آیکون نمی‌تواند بیشتر از ۱۰ کاراکتر باشد';
  }
  
  return undefined;
}

// اعتبارسنجی تخصص
export function validateSpecialty(specialty: string | undefined): string | undefined {
  if (!specialty) {
    return undefined; // اختیاری است
  }
  
  if (specialty.trim().length < 2) {
    return 'تخصص باید حداقل ۲ کاراکتر باشد';
  }
  
  if (specialty.trim().length > 50) {
    return 'تخصص نمی‌تواند بیشتر از ۵۰ کاراکتر باشد';
  }
  
  return undefined;
}

// اعتبارسنجی ترتیب
export function validateOrder(order: number, minOrder: number = 1): string | undefined {
  if (!order || order < minOrder) {
    return `ترتیب باید حداقل ${minOrder} باشد`;
  }
  
  return undefined;
}

// اعتبارسنجی کد استاندارد
export function validateStandardCode(code: string | undefined): string | undefined {
  if (!code) {
    return undefined; // اختیاری است
  }
  
  if (code.trim().length < 3) {
    return 'کد استاندارد باید حداقل ۳ کاراکتر باشد';
  }
  
  if (code.trim().length > 20) {
    return 'کد استاندارد نمی‌تواند بیشتر از ۲۰ کاراکتر باشد';
  }
  
  return undefined;
}

// اعتبارسنجی محدوده پرسنل
export function validatePersonnelRange(range: string | undefined): string | undefined {
  if (!range) {
    return undefined; // اختیاری است
  }
  
  // بررسی فرمت محدوده (مثل "1-1000", "100-500")
  if (!/^\d+-\d+$/.test(range.trim())) {
    return 'فرمت محدوده پرسنل نامعتبر است (مثال: 1-1000)';
  }
  
  const [min, max] = range.split('-').map(Number);
  
  if (min >= max) {
    return 'حداقل باید کمتر از حداکثر باشد';
  }
  
  return undefined;
}

// اعتبارسنجی کامل نود
export function validateNode(node: Partial<DefinitionNode>): FormErrors {
  const errors: FormErrors = {};

  // اعتبارسنجی نام
  const nameError = validateName(node.name || '');
  if (nameError) errors.name = nameError;

  // اعتبارسنجی سطح
  const levelError = validateLevelNumber(node.level || 0);
  if (levelError) errors.level = levelError;

  // اعتبارسنجی مختصات
  const coordinatesError = validateCoordinates(node.coordinates);
  if (coordinatesError) errors.coordinates = coordinatesError;

  // اعتبارسنجی کشور
  const countryError = validateCountry(node.country);
  if (countryError) errors.country = countryError;

  // اعتبارسنجی معادل ناتو
  const natoError = validateNatoEquivalent(node.natoEquivalent);
  if (natoError) errors.natoEquivalent = natoError;

  // اعتبارسنجی آیکون
  const iconError = validateIcon(node.icon);
  if (iconError) errors.icon = iconError;

  // اعتبارسنجی تخصص
  const specialtyError = validateSpecialty(node.specialty);
  if (specialtyError) errors.specialty = specialtyError;

  return errors;
}

// اعتبارسنجی کامل سطح
export function validateLevel(level: Partial<ExtendedHierarchyLevel>): LevelFormErrors {
  const errors: LevelFormErrors = {};

  // اعتبارسنجی نام
  const nameError = validateName(level.name || '');
  if (nameError) errors.name = nameError;

  // اعتبارسنجی نام انگلیسی
  const englishNameError = validateEnglishName(level.englishName || '');
  if (englishNameError) errors.englishName = englishNameError;

  // اعتبارسنجی ترتیب
  const orderError = validateOrder(level.order || 0);
  if (orderError) errors.order = orderError;

  // اعتبارسنجی آیکون
  const iconError = validateIcon(level.icon);
  if (iconError) errors.icon = iconError;

  // اعتبارسنجی کد استاندارد
  const standardCodeError = validateStandardCode(level.standardCode);
  if (standardCodeError) errors.standardCode = standardCodeError;

  // اعتبارسنجی محدوده پرسنل
  const personnelRangeError = validatePersonnelRange(level.personnelRange);
  if (personnelRangeError) errors.personnelRange = personnelRangeError;

  return errors;
}

// بررسی اینکه آیا فرم معتبر است
export function isFormValid(errors: FormErrors | LevelFormErrors): boolean {
  return Object.keys(errors).length === 0;
}

// اعتبارسنجی ID یکتا
export function validateUniqueId(
  id: string, 
  existingIds: string[], 
  excludeId?: string
): string | undefined {
  if (!id || !id.trim()) {
    return 'ID الزامی است';
  }
  
  if (id.trim().length < 1) {
    return 'ID باید حداقل ۱ کاراکتر باشد';
  }
  
  if (id.trim().length > 50) {
    return 'ID نمی‌تواند بیشتر از ۵۰ کاراکتر باشد';
  }
  
  // بررسی یکتا بودن
  const normalizedId = id.trim();
  const isDuplicate = existingIds.some(existingId => 
    existingId !== excludeId && existingId === normalizedId
  );
  
  if (isDuplicate) {
    return 'ID تکراری است';
  }
  
  return undefined;
}

// اعتبارسنجی ایمیل
export function validateEmail(email: string | undefined): string | undefined {
  if (!email) {
    return undefined; // اختیاری است
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'فرمت ایمیل نامعتبر است';
  }
  
  return undefined;
}

// اعتبارسنجی شماره تلفن
export function validatePhone(phone: string | undefined): string | undefined {
  if (!phone) {
    return undefined; // اختیاری است
  }
  
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
  if (!phoneRegex.test(phone.trim())) {
    return 'فرمت شماره تلفن نامعتبر است';
  }
  
  return undefined;
}

// اعتبارسنجی URL
export function validateUrl(url: string | undefined): string | undefined {
  if (!url) {
    return undefined; // اختیاری است
  }
  
  try {
    new URL(url.trim());
  } catch {
    return 'فرمت URL نامعتبر است';
  }
  
  return undefined;
}

// اعتبارسنجی تاریخ
export function validateDate(date: string | undefined): string | undefined {
  if (!date) {
    return undefined; // اختیاری است
  }
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'فرمت تاریخ نامعتبر است';
  }
  
  return undefined;
}

// اعتبارسنجی عدد
export function validateNumber(
  value: number | undefined, 
  min?: number, 
  max?: number
): string | undefined {
  if (value === undefined || value === null) {
    return undefined; // اختیاری است
  }
  
  if (typeof value !== 'number' || isNaN(value)) {
    return 'مقدار باید عدد باشد';
  }
  
  if (min !== undefined && value < min) {
    return `مقدار باید حداقل ${min} باشد`;
  }
  
  if (max !== undefined && value > max) {
    return `مقدار باید حداکثر ${max} باشد`;
  }
  
  return undefined;
}
