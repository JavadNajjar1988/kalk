import { TCountry, UserProfile } from '../types';

// تابع اعتبارسنجی شماره ملی ایرانی
export const validateIranianNationalId = (nationalId: string): boolean => {
  if (!nationalId || nationalId.length !== 10) return false;
  
  // بررسی اینکه همه ارقام یکسان نباشند
  if (/^(\d)\1{9}$/.test(nationalId)) return false;
  
  const digits = nationalId.split('').map(Number);
  const checkDigit = digits[9];
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  
  const remainder = sum % 11;
  
  if (remainder < 2) {
    return checkDigit === remainder;
  } else {
    return checkDigit === 11 - remainder;
  }
};

// تابع اعتبارسنجی قوی بودن رمز عبور
export const validatePasswordStrength = (password: string): boolean => {
  if (!password || password.length < 8) return false;
  
  // فقط حروف انگلیسی (بزرگ و کوچک) و اعداد
  const validCharsRegex = /^[a-zA-Z0-9]+$/;
  if (!validCharsRegex.test(password)) return false;
  
  // حداقل یک حرف بزرگ
  const hasUpperCase = /[A-Z]/.test(password);
  // حداقل یک حرف کوچک
  const hasLowerCase = /[a-z]/.test(password);
  // حداقل یک عدد
  const hasNumber = /[0-9]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumber;
};

// تابع تولید رمز عبور قوی
export const generateStrongPassword = (): string => {
  const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const allChars = upperCase + lowerCase + numbers;
  
  let password = '';
  
  // اطمینان از وجود حداقل یکی از هر نوع کاراکتر
  password += upperCase[Math.floor(Math.random() * upperCase.length)];
  password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  // اضافه کردن کاراکترهای باقی‌مانده
  for (let i = 3; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // مخلوط کردن کاراکترها
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// تابع اعتبارسنجی نام کاربری
export const validateUsername = (username: string): boolean => {
  if (!username || username.length < 3) return false;
  
  // فقط حروف انگلیسی، اعداد و کاراکترهای خاص مجاز
  const validCharsRegex = /^[a-zA-Z0-9._-]+$/;
  return validCharsRegex.test(username);
};

// تابع بررسی تکراری نبودن نام کاربری
export const isUsernameUnique = (username: string, users: UserProfile[], currentUserId?: string): boolean => {
  return !users.some(user => 
    user.username.toLowerCase() === username.toLowerCase() && 
    user.id !== currentUserId
  );
};

// تابع تولید نام کاربری از نام انگلیسی
export const generateUsernameFromEnglishName = (englishName: string): string => {
  if (!englishName) return '';
  
  // پاک کردن فاصله‌های اضافی و تبدیل به lowercase
  const cleanName = englishName.trim().toLowerCase();
  
  // جایگزینی فاصله‌ها با نقطه
  let username = cleanName.replace(/\s+/g, '.');
  
  // حذف کاراکترهای غیرمجاز
  username = username.replace(/[^a-z0-9._-]/g, '');
  
  // اضافه کردن یک عدد تصادفی در انتها
  const randomNum = Math.floor(Math.random() * 999) + 1;
  username += randomNum;
  
  return username;
};

// تابع اعتبارسنجی جامع فرم کاربر
export const validateUserForm = (
  formData: Partial<UserProfile>,
  password: string,
  confirmPassword: string,
  phoneNumber: string,
  birthDateYear: number | null,
  birthDateMonth: number | null,
  birthDateDay: number | null,
  birthPlaceCountry: TCountry | null,
  isNewUser: boolean,
  mode: 'full' | 'edit' | 'permissions' | 'password' = 'full'
): boolean => {
  // برای حالت مجوزها فقط بررسی کنیم که کاربر وجود دارد
  if (mode === 'permissions') {
    return true; // در این حالت همیشه معتبر است
  }
  
  // برای حالت رمز عبور فقط رمز عبور را بررسی کنیم
  if (mode === 'password') {
    if (!password || !validatePasswordStrength(password)) return false;
    if (password !== confirmPassword) return false;
    return true;
  }
  
  // برای حالت‌های full و edit فیلدهای اجباری پایه
  if (!formData.username || !validateUsername(formData.username)) return false;
  if (!formData.name || formData.name.trim().length < 2) return false;
  if (!formData.role) return false;
  if (!formData.department || formData.department.trim().length < 2) return false;
  if (!formData.position || formData.position.trim().length < 2) return false;
  
  // شماره تماس اجباری
  if (!phoneNumber || phoneNumber.length < 8) return false;
  
  // اعتبارسنجی شماره ملی/پاسپورت
  if (!formData.nationalId || formData.nationalId.trim().length < 5) return false;
  if (formData.nationality === 'iranian' && !validateIranianNationalId(formData.nationalId)) return false;
  
  // رمز عبور برای کاربر جدید در حالت full
  if (mode === 'full' && isNewUser) {
    if (!password || !validatePasswordStrength(password)) return false;
    if (password !== confirmPassword) return false;
  }
  
  // فیلدهای اضافی فقط در حالت full الزامی هستند
  if (mode === 'full') {
    if (!formData.nameEn || formData.nameEn.trim().length < 2) return false;
    
    // تاریخ تولد اجباری
    if (!birthDateYear || !birthDateMonth || !birthDateDay) return false;
    
    // محل تولد اجباری (حداقل کشور)
    if (!birthPlaceCountry) return false;
    
    // سطح امنیتی اجباری (می‌تواند 'none' باشد)
    if (!formData.securityClearance) return false;
  }
  
  return true;
}; 