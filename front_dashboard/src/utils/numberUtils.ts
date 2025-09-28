/**
 * تبدیل اعداد انگلیسی به فارسی
 */
export const convertToFarsiNumber = (num: number | string): string => {
  if (num === undefined || num === null) return '';
  
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
};

/**
 * تبدیل اعداد فارسی به انگلیسی
 */
export const convertToEnglishNumber = (num: string): string => {
  if (!num) return '';
  
  const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  const arabicNumbers = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  
  let result = num.toString();
  
  for (let i = 0; i < 10; i++) {
    result = result.replace(persianNumbers[i], i.toString()).replace(arabicNumbers[i], i.toString());
  }
  
  return result;
}; 