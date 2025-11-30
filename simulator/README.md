# Kalk Simulator - Babylon.js

پروژه شبیه‌ساز سه‌بعدی با استفاده از Babylon.js

## نصب وابستگی‌ها

```bash
npm install
```

## اجرای پروژه در حالت توسعه

```bash
npm run dev
```

پروژه در آدرس `http://localhost:3001` اجرا می‌شود.

## ساخت نسخه Production

```bash
npm run build
```

## بررسی نوع TypeScript

```bash
npm run type-check
```

## ساختار پروژه

```
simulator/
├── src/
│   └── main.ts          # فایل اصلی و تنظیمات صحنه
├── index.html           # فایل HTML اصلی
├── package.json         # وابستگی‌ها و اسکریپت‌ها
├── tsconfig.json        # تنظیمات TypeScript
└── vite.config.ts       # تنظیمات Vite
```

