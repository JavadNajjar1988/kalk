// تعریف رده‌های نظامی به همراه معادل فارسی و انگلیسی آنها

export interface MilitaryRank {
  id: string;
  name: string;
  nameEn: string;
  abbreviation: string;
  category: 'officer' | 'nco' | 'enlisted';
  level: number; // سطح رده (برای مرتب‌سازی)
  description?: string;
  insigniaUrl?: string; // آدرس تصویر درجه
}

// رده‌های نظامی ارتش و سپاه ایران
export const iranianArmyRanks: MilitaryRank[] = [
  // افسران ارشد
  {
    id: 'major_general',
    name: 'سرلشکر',
    nameEn: 'Major General',
    abbreviation: 'سرلشکر',
    category: 'officer',
    level: 10,
    description: 'بالاترین درجه نظامی در ارتش جمهوری اسلامی ایران',
    insigniaUrl: '/assets/ranks/iran/major_general.png',
  },
  {
    id: 'brigadier_general',
    name: 'سرتیپ',
    nameEn: 'Brigadier General',
    abbreviation: 'سرتیپ',
    category: 'officer',
    level: 9,
    description: 'فرمانده تیپ یا معاون لشکر',
    insigniaUrl: '/assets/ranks/iran/brigadier_general.png',
  },
  {
    id: 'colonel',
    name: 'سرهنگ',
    nameEn: 'Colonel',
    abbreviation: 'سرهنگ',
    category: 'officer',
    level: 8,
    description: 'فرمانده گردان یا معاون تیپ',
    insigniaUrl: '/assets/ranks/iran/colonel.png',
  },
  {
    id: 'lieutenant_colonel',
    name: 'سرهنگ دوم',
    nameEn: 'Lieutenant Colonel',
    abbreviation: 'سرهنگ۲',
    category: 'officer',
    level: 7,
    description: 'معاون گردان',
    insigniaUrl: '/assets/ranks/iran/lieutenant_colonel.png',
  },
  
  // افسران جزء
  {
    id: 'major',
    name: 'سرگرد',
    nameEn: 'Major',
    abbreviation: 'سرگرد',
    category: 'officer',
    level: 6,
    description: 'فرمانده گروهان یا معاون گردان',
    insigniaUrl: '/assets/ranks/iran/major.png',
  },
  {
    id: 'captain',
    name: 'سروان',
    nameEn: 'Captain',
    abbreviation: 'سروان',
    category: 'officer',
    level: 5,
    description: 'فرمانده دسته یا معاون گروهان',
    insigniaUrl: '/assets/ranks/iran/captain.png',
  },
  {
    id: 'first_lieutenant',
    name: 'ستوان یکم',
    nameEn: 'First Lieutenant',
    abbreviation: 'ستوان۱',
    category: 'officer',
    level: 4,
    description: 'معاون دسته',
    insigniaUrl: '/assets/ranks/iran/first_lieutenant.png',
  },
  {
    id: 'second_lieutenant',
    name: 'ستوان دوم',
    nameEn: 'Second Lieutenant',
    abbreviation: 'ستوان۲',
    category: 'officer',
    level: 3,
    description: 'افسر تازه فارغ‌التحصیل',
    insigniaUrl: '/assets/ranks/iran/second_lieutenant.png',
  },
  {
    id: 'third_lieutenant',
    name: 'ستوان سوم',
    nameEn: 'Third Lieutenant',
    abbreviation: 'ستوان۳',
    category: 'officer',
    level: 2,
    description: 'افسر در حال آموزش',
    insigniaUrl: '/assets/ranks/iran/third_lieutenant.png',
  },
  
  // درجه‌داران ارشد
  {
    id: 'master_sergeant_major',
    name: 'استوار یکم',
    nameEn: 'Master Sergeant Major',
    abbreviation: 'استوار۱',
    category: 'nco',
    level: 8,
    description: 'درجه‌دار ارشد',
    insigniaUrl: '/assets/ranks/iran/master_sergeant_major.png',
  },
  {
    id: 'sergeant_major',
    name: 'استوار دوم',
    nameEn: 'Sergeant Major',
    abbreviation: 'استوار۲',
    category: 'nco',
    level: 7,
    description: 'درجه‌دار ارشد',
    insigniaUrl: '/assets/ranks/iran/sergeant_major.png',
  },
  
  // درجه‌داران
  {
    id: 'master_sergeant',
    name: 'گروهبان یکم',
    nameEn: 'Master Sergeant',
    abbreviation: 'گروهبان۱',
    category: 'nco',
    level: 6,
    description: 'درجه‌دار میانی',
    insigniaUrl: '/assets/ranks/iran/master_sergeant.png',
  },
  {
    id: 'technical_sergeant',
    name: 'گروهبان دوم',
    nameEn: 'Technical Sergeant',
    abbreviation: 'گروهبان۲',
    category: 'nco',
    level: 5,
    description: 'درجه‌دار میانی',
    insigniaUrl: '/assets/ranks/iran/technical_sergeant.png',
  },
  {
    id: 'staff_sergeant',
    name: 'گروهبان سوم',
    nameEn: 'Staff Sergeant',
    abbreviation: 'گروهبان۳',
    category: 'nco',
    level: 4,
    description: 'درجه‌دار پایه',
    insigniaUrl: '/assets/ranks/iran/staff_sergeant.png',
  },
  
  // سربازان
  {
    id: 'sergeant',
    name: 'سرجوخه',
    nameEn: 'Sergeant',
    abbreviation: 'سرجوخه',
    category: 'enlisted',
    level: 3,
    description: 'سرباز ارشد',
    insigniaUrl: '/assets/ranks/iran/sergeant.png',
  },
  {
    id: 'corporal',
    name: 'سرباز یکم',
    nameEn: 'Corporal',
    abbreviation: 'سرباز۱',
    category: 'enlisted',
    level: 2,
    description: 'سرباز با سابقه',
    insigniaUrl: '/assets/ranks/iran/corporal.png',
  },
  {
    id: 'private',
    name: 'سرباز',
    nameEn: 'Private',
    abbreviation: 'سرباز',
    category: 'enlisted',
    level: 1,
    description: 'سرباز وظیفه',
    insigniaUrl: '/assets/ranks/iran/private.png',
  },
];

// رده‌های نظامی سپاه پاسداران
export const irgcRanks: MilitaryRank[] = [
  // افسران ارشد
  {
    id: 'irgc_major_general',
    name: 'سرلشکر پاسدار',
    nameEn: 'IRGC Major General',
    abbreviation: 'سرلشکر',
    category: 'officer',
    level: 10,
    description: 'بالاترین درجه نظامی در سپاه پاسداران',
    insigniaUrl: '/assets/ranks/irgc/major_general.png',
  },
  {
    id: 'irgc_brigadier_general',
    name: 'سرتیپ پاسدار',
    nameEn: 'IRGC Brigadier General',
    abbreviation: 'سرتیپ',
    category: 'officer',
    level: 9,
    description: 'فرمانده تیپ یا معاون لشکر در سپاه',
    insigniaUrl: '/assets/ranks/irgc/brigadier_general.png',
  },
  {
    id: 'irgc_colonel',
    name: 'سرهنگ پاسدار',
    nameEn: 'IRGC Colonel',
    abbreviation: 'سرهنگ',
    category: 'officer',
    level: 8,
    description: 'فرمانده گردان یا معاون تیپ در سپاه',
    insigniaUrl: '/assets/ranks/irgc/colonel.png',
  },
  
  // و سایر درجات مشابه ارتش...
];

// رده‌های نظامی ارتش آمریکا (برای مقایسه)
export const usArmyRanks: MilitaryRank[] = [
  // افسران ارشد
  {
    id: 'general',
    name: 'ژنرال',
    nameEn: 'General',
    abbreviation: 'GEN',
    category: 'officer',
    level: 11,
    description: 'بالاترین درجه نظامی ارتش آمریکا (چهار ستاره)',
    insigniaUrl: '/assets/ranks/us/general.png',
  },
  {
    id: 'lieutenant_general',
    name: 'سپهبد',
    nameEn: 'Lieutenant General',
    abbreviation: 'LTG',
    category: 'officer',
    level: 10,
    description: 'ژنرال سه ستاره',
    insigniaUrl: '/assets/ranks/us/lieutenant_general.png',
  },
  {
    id: 'major_general',
    name: 'سرلشکر',
    nameEn: 'Major General',
    abbreviation: 'MG',
    category: 'officer',
    level: 9,
    description: 'ژنرال دو ستاره',
    insigniaUrl: '/assets/ranks/us/major_general.png',
  },
  {
    id: 'brigadier_general',
    name: 'سرتیپ',
    nameEn: 'Brigadier General',
    abbreviation: 'BG',
    category: 'officer',
    level: 8,
    description: 'ژنرال یک ستاره',
    insigniaUrl: '/assets/ranks/us/brigadier_general.png',
  },
  
  // و سایر درجات...
];

// رده‌های نظامی ارتش اسرائیل (IDF)
export const israeliDefenseForceRanks: MilitaryRank[] = [
  // افسران ارشد
  {
    id: 'rav_aluf',
    name: 'رب الوف',
    nameEn: 'Rav Aluf (Chief of General Staff)',
    abbreviation: 'רב אלוף',
    category: 'officer',
    level: 12,
    description: 'فرمانده کل نیروهای دفاعی اسرائیل',
    insigniaUrl: '/assets/ranks/idf/rav_aluf.png',
  },
  {
    id: 'aluf',
    name: 'الوف',
    nameEn: 'Aluf (Major General)',
    abbreviation: 'אלוף',
    category: 'officer',
    level: 11,
    description: 'ژنرال ارشد',
    insigniaUrl: '/assets/ranks/idf/aluf.png',
  },
  {
    id: 'tat_aluf',
    name: 'تت الوف',
    nameEn: 'Tat Aluf (Brigadier General)',
    abbreviation: 'תת אלוף',
    category: 'officer',
    level: 10,
    description: 'سرهنگ ارشد',
    insigniaUrl: '/assets/ranks/idf/tat_aluf.png',
  },
  
  // افسران ارشد
  {
    id: 'sgan_aluf',
    name: 'سگان الوف',
    nameEn: 'Sgan Aluf (Colonel)',
    abbreviation: 'סגן אלוף',
    category: 'officer',
    level: 9,
    description: 'سرهنگ',
    insigniaUrl: '/assets/ranks/idf/sgan_aluf.png',
  },
  {
    id: 'rash',
    name: 'راش',
    nameEn: 'Rash (Lieutenant Colonel)',
    abbreviation: 'רש"פ',
    category: 'officer',
    level: 8,
    description: 'سرگرد',
    insigniaUrl: '/assets/ranks/idf/rash.png',
  },
  
  // افسران میانی
  {
    id: 'seren',
    name: 'سرن',
    nameEn: 'Seren (Captain)',
    abbreviation: 'סרן',
    category: 'officer',
    level: 7,
    description: 'سروان',
    insigniaUrl: '/assets/ranks/idf/seren.png',
  },
  {
    id: 'sgan',
    name: 'سگن',
    nameEn: 'Sgan (Lieutenant)',
    abbreviation: 'סגן',
    category: 'officer',
    level: 6,
    description: 'ستوان',
    insigniaUrl: '/assets/ranks/idf/sgan.png',
  },
  {
    id: 'samal',
    name: 'سمل',
    nameEn: 'Samal (Second Lieutenant)',
    abbreviation: 'סמל',
    category: 'officer',
    level: 5,
    description: 'ستوان دوم',
    insigniaUrl: '/assets/ranks/idf/samal.png',
  },
  
  // درجه‌داران ارشد
  {
    id: 'rash_samalim',
    name: 'راش سامالیم',
    nameEn: 'Rash Samalim (Master Sergeant)',
    abbreviation: 'רש"מ',
    category: 'nco',
    level: 8,
    description: 'سرگروهبان',
    insigniaUrl: '/assets/ranks/idf/rash_samalim.png',
  },
  {
    id: 'samalim_rishon',
    name: 'سامالیم ریشون',
    nameEn: 'Samalim Rishon (First Sergeant)',
    abbreviation: 'סמ"ר',
    category: 'nco',
    level: 7,
    description: 'گروهبان اول',
    insigniaUrl: '/assets/ranks/idf/samalim_rishon.png',
  },
  
  // درجه‌داران
  {
    id: 'samalim',
    name: 'سامالیم',
    nameEn: 'Samalim (Sergeant)',
    abbreviation: 'סמל',
    category: 'nco',
    level: 6,
    description: 'گروهبان',
    insigniaUrl: '/assets/ranks/idf/samalim.png',
  },
  {
    id: 'samar',
    name: 'سامار',
    nameEn: 'Samar (Corporal)',
    abbreviation: 'סמר',
    category: 'nco',
    level: 5,
    description: 'سرجوخه',
    insigniaUrl: '/assets/ranks/idf/samar.png',
  },
  
  // سربازان
  {
    id: 'rav_turai',
    name: 'راب طورای',
    nameEn: 'Rav Turai (Private First Class)',
    abbreviation: 'רב"ט',
    category: 'enlisted',
    level: 3,
    description: 'سرباز اول',
    insigniaUrl: '/assets/ranks/idf/rav_turai.png',
  },
  {
    id: 'turai',
    name: 'طورای',
    nameEn: 'Turai (Private)',
    abbreviation: 'טוראי',
    category: 'enlisted',
    level: 2,
    description: 'سرباز',
    insigniaUrl: '/assets/ranks/idf/turai.png',
  },
  {
    id: 'turai_meshuchrrar',
    name: 'طورای مشوحرر',
    nameEn: 'Turai Meshuchrrar (Discharged Private)',
    abbreviation: 'ט"מ',
    category: 'enlisted',
    level: 1,
    description: 'سرباز آزاد',
    insigniaUrl: '/assets/ranks/idf/turai_meshuchrrar.png',
  },
];

// تابع کمکی برای گرفتن رده‌های نظامی بر اساس دسته‌بندی
export const getRanksByCategory = (ranks: MilitaryRank[], category: MilitaryRank['category']): MilitaryRank[] => {
  return ranks.filter(rank => rank.category === category);
};

// تابع کمکی برای گرفتن رده نظامی بر اساس شناسه
export const getRankById = (ranks: MilitaryRank[], id: string): MilitaryRank | undefined => {
  return ranks.find(rank => rank.id === id);
};

export default {
  iran: iranianArmyRanks,
  irgc: irgcRanks,
  us: usArmyRanks,
  israel: israeliDefenseForceRanks,
}; 