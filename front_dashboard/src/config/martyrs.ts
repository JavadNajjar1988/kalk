interface Martyr {
  id: number;
  name: string;
  position: string;
  martyrdomDate: string;
  image: string;
}

// بانک اطلاعات شهدا
export const martyrs: Martyr[] = [
  {
    id: 1,
    name: "سردار سپهبد شهید قاسم سلیمانی",
    position: "فرمانده نیروی قدس سپاه پاسداران انقلاب اسلامی",
    martyrdomDate: "13 دیماه 1398",
    image: "shahidSoleimani.jpg"
  },
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
];

/**
 * دریافت یک شهید تصادفی از بانک اطلاعات
 * @returns یک شهید تصادفی
 */
export function getRandomMartyr(): Martyr {
  const randomIndex = Math.floor(Math.random() * martyrs.length);
  return martyrs[randomIndex];
}

export type { Martyr }; 