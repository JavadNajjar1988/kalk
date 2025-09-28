import { ModifierOption } from '../unitTypes';

// نگاشت بین مجموعه نمادها و اصلاح‌کننده‌های مرتبط با هر کدام
export const SYMBOL_SET_TO_MODIFIERS: Record<string, {
  modifierOne: ModifierOption[];
  modifierTwo: ModifierOption[];
}> = {
  // هوایی (01)
  "01": {
    modifierOne: [
      { value: "00", label: "نامشخص" },
      { value: "01", label: "جنگنده" },
      { value: "02", label: "بمب‌افکن" },
      { value: "03", label: "هلیکوپتر" },
      { value: "04", label: "پهپاد" },
      { value: "05", label: "ترابری" },
    ],
    modifierTwo: [
      { value: "00", label: "نامشخص" },
      { value: "01", label: "سبک" },
      { value: "02", label: "متوسط" },
      { value: "03", label: "سنگین" },
    ],
  },
  
  // فضایی (05)
  "05": {
    modifierOne: [
      { value: "00", label: "نامشخص" },
      { value: "01", label: "ماهواره" },
      { value: "02", label: "ایستگاه فضایی" },
      { value: "03", label: "سفینه فضایی" },
      { value: "04", label: "موشک فضایی" },
    ],
    modifierTwo: [
      { value: "00", label: "نامشخص" },
      { value: "01", label: "مدار پایین" },
      { value: "02", label: "مدار متوسط" },
      { value: "03", label: "مدار بالا" },
      { value: "04", label: "مدار ژئوسنکرون" },
    ],
  },
  
  // زمینی (10)
  "10": {
    modifierOne: [
      { value: "00", label: "نامشخص" },
      { value: "01", label: "هوایی" },
      { value: "02", label: "قطب شمال" },
      { value: "03", label: "تعمیر خسارت جنگی" },
      { value: "04", label: "مجهز به دوچرخه" },
      { value: "05", label: "مرحله‌بندی تلفات" },
      { value: "06", label: "پاکسازی" },
      { value: "07", label: "برد کوتاه" },
      { value: "08", label: "کنترل" },
      { value: "09", label: "آلودگی‌زدایی" },
      { value: "10", label: "تخریب" },
      { value: "11", label: "دندانپزشکی" },
      { value: "12", label: "دیجیتال" },
      { value: "13", label: "EPLRS" },
      { value: "14", label: "تجهیزات" },
      { value: "15", label: "سنگین" },
      { value: "16", label: "ارتفاع بالا" },
      { value: "17", label: "چندوجهی" },
      { value: "18", label: "مراقبت‌های ویژه" },
      { value: "19", label: "سبک" },
      { value: "20", label: "آزمایشگاه" },
    ],
    modifierTwo: [
      { value: "00", label: "نامشخص" },
      { value: "01", label: "هوابرد" },
      { value: "02", label: "قطب شمال" },
      { value: "03", label: "تعمیر خسارت جنگی" },
      { value: "04", label: "مجهز به دوچرخه" },
      { value: "05", label: "مرحله‌بندی تلفات" },
      { value: "06", label: "پاکسازی" },
      { value: "07", label: "برد کوتاه" },
      { value: "08", label: "کنترل" },
      { value: "09", label: "آلودگی‌زدایی" },
      { value: "10", label: "تخریب" },
      { value: "11", label: "دندانپزشکی" },
      { value: "12", label: "دیجیتال" },
      { value: "13", label: "EPLRS" },
      { value: "14", label: "تجهیزات" },
      { value: "15", label: "سنگین" },
      { value: "16", label: "ارتفاع بالا" },
      { value: "17", label: "چندوجهی" },
      { value: "18", label: "مراقبت‌های ویژه" },
      { value: "19", label: "سبک" },
      { value: "20", label: "آزمایشگاه" },
      { value: "21", label: "پرتابگر" },
      { value: "22", label: "برد بلند" },
      { value: "23", label: "ارتفاع پایین" },
      { value: "24", label: "متوسط" },
      { value: "25", label: "ارتفاع متوسط" },
      { value: "26", label: "برد متوسط" },
      { value: "27", label: "کوهستانی" },
    ],
  },
  
  // تجهیزات زمینی (15)
  "15": {
    modifierOne: [
      { value: "00", label: "نامشخص" },
      { value: "01", label: "زرهی" },
      { value: "02", label: "توپخانه" },
      { value: "03", label: "مهندسی" },
      { value: "04", label: "تدارکات" },
    ],
    modifierTwo: [
      { value: "00", label: "نامشخص" },
      { value: "01", label: "سبک" },
      { value: "02", label: "متوسط" },
      { value: "03", label: "سنگین" },
    ],
  },
  
  // دریایی سطحی (30)
  "30": {
    modifierOne: [
      { value: "00", label: "نامشخص" },
      { value: "01", label: "ناوشکن" },
      { value: "02", label: "ناوچه" },
      { value: "03", label: "ناو هواپیمابر" },
      { value: "04", label: "قایق تندرو" },
      { value: "05", label: "ناو آبی‌خاکی" },
    ],
    modifierTwo: [
      { value: "00", label: "نامشخص" },
      { value: "01", label: "سبک" },
      { value: "02", label: "متوسط" },
      { value: "03", label: "سنگین" },
    ],
  },
  
  // دریایی زیرسطحی (35)
  "35": {
    modifierOne: [
      { value: "00", label: "نامشخص" },
      { value: "01", label: "زیردریایی" },
      { value: "02", label: "زیردریایی هسته‌ای" },
      { value: "03", label: "زیردریایی دیزلی" },
      { value: "04", label: "زیردریایی بدون سرنشین" },
    ],
    modifierTwo: [
      { value: "00", label: "نامشخص" },
      { value: "01", label: "سبک" },
      { value: "02", label: "متوسط" },
      { value: "03", label: "سنگین" },
    ],
  },
}; 