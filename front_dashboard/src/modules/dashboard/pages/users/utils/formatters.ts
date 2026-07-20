// تابع تبدیل اعداد انگلیسی به فارسی
export const convertToFarsiNumbers = (str: string | number): string => {
  if (!str) return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.toString().replace(/[0-9]/g, (match) => {
    return farsiDigits[parseInt(match)];
  });
};

// تابع تبدیل اعداد فارسی به انگلیسی (برای رمز عبور)
export const convertToEnglishNumbers = (str: string): string => {
  if (!str) return '';
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  return str.replace(/[۰-۹]/g, (match) => {
    const index = farsiDigits.indexOf(match);
    return englishDigits[index];
  });
}; 