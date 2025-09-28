import { EchelonOption } from '../unitTypes';

// نگاشت بین مجموعه نمادها و رده‌های سازمانی مرتبط با هر کدام
export const SYMBOL_SET_TO_ECHELONS: Record<string, EchelonOption[]> = {
  // هوایی (01)
  "01": [
    { value: "00", label: "نامشخص" },
    { value: "11", label: "هواپیما" },
    { value: "12", label: "دسته" },
    { value: "13", label: "گروه پروازی" },
    { value: "14", label: "اسکادران" },
    { value: "15", label: "گروه هوایی" },
    { value: "16", label: "پایگاه هوایی" },
  ],
  
  // فضایی (05)
  "05": [
    { value: "00", label: "نامشخص" },
    { value: "11", label: "فضاپیما" },
    { value: "12", label: "گروه فضایی" },
    { value: "13", label: "پایگاه فضایی" },
  ],
  
  // زمینی (10)
  "10": [
    { value: "00", label: "نامشخص" },
    { value: "11", label: "تیم/خدمه" },
    { value: "12", label: "جوخه" },
    { value: "13", label: "بخش" },
    { value: "14", label: "دسته/گروه جداشده" },
    { value: "15", label: "گروهان/باتری/سرایا" },
    { value: "16", label: "گردان/اسکادران" },
    { value: "17", label: "هنگ/گروه" },
    { value: "18", label: "تیپ" },
    { value: "21", label: "لشکر" },
    { value: "22", label: "سپاه/MEF" },
    { value: "23", label: "ارتش" },
    { value: "24", label: "گروه ارتش/جبهه" },
    { value: "25", label: "منطقه/تئاتر" },
    { value: "26", label: "فرماندهی" },
  ],
  
  // تجهیزات زمینی (15)
  "15": [
    { value: "00", label: "نامشخص" },
  ],
  
  // دریایی سطحی (30)
  "30": [
    { value: "00", label: "نامشخص" },
    { value: "11", label: "شناور" },
    { value: "12", label: "گروه شناور" },
    { value: "13", label: "ناوگروه" },
    { value: "14", label: "ناوتیپ" },
    { value: "15", label: "ناوگان" },
  ],
  
  // دریایی زیرسطحی (35)
  "35": [
    { value: "00", label: "نامشخص" },
    { value: "11", label: "زیردریایی" },
    { value: "12", label: "گروه زیردریایی" },
    { value: "13", label: "ناوگروه زیردریایی" },
  ],
}; 