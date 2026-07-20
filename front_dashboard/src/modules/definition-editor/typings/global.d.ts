declare module '*.css';

// شِیم ساده برای RootState تا هنگام type-check مستقل ارجاع شکسته نشود
declare namespace AppStoreShim {
  export type RootState = any;
}

// رفع ارجاعات مستقیم در برخی فایل‌ها (در صورت نیاز می‌توان importها را به این namespace تغییر داد)
