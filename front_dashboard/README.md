# ساجد - سیستم مدیریت عملیات نظامی

## 🚀 ویژگی‌ها

- **مدیریت یگان‌ها**: مدیریت کامل یگان‌های نظامی با ساختار سلسله‌مراتبی
- **نقشه‌های تعاملی**: نمایش یگان‌ها روی نقشه با OpenLayers
- **نمادهای نظامی**: تولید و نمایش نمادهای نظامی استاندارد
- **مدیریت سناریوها**: ایجاد و مدیریت سناریوهای عملیاتی
- **سیستم کاربران**: مدیریت کاربران با سطوح دسترسی مختلف
- **رابط کاربری مدرن**: طراحی زیبا و کاربرپسند با Material-UI
- **پشتیبانی از زبان فارسی**: رابط کاربری کاملاً فارسی

## 🛠️ تکنولوژی‌ها

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Material-UI v5
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Maps**: OpenLayers
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Emotion
- **Internationalization**: i18next

## 📦 نصب و راه‌اندازی

### پیش‌نیازها

- Node.js >= 18.0.0
- npm >= 9.0.0

### نصب پکیج‌ها

```bash
npm install
```

### اجرای محیط توسعه

```bash
npm run dev
```

پروژه روی آدرس `http://localhost:3000` اجرا می‌شود.

## 📜 اسکریپت‌های موجود

### توسعه
- `npm run dev` - اجرای سرور توسعه
- `npm run build` - ساخت نسخه تولید
- `npm run preview` - پیش‌نمایش نسخه تولید

### کیفیت کد
- `npm run lint` - بررسی کد با ESLint
- `npm run type-check` - بررسی تایپ‌های TypeScript
- `npm run format` - فرمت‌بندی کد با Prettier
- `npm run format:check` - بررسی فرمت‌بندی کد

### بهینه‌سازی
- `npm run clean` - پاک‌سازی فایل‌های build
- `npm run analyze` - تحلیل اندازه bundle
- `npm run security-check` - بررسی امنیت پکیج‌ها
- `npm run deps-check` - بررسی پکیج‌های قدیمی

## 🏗️ ساختار پروژه

```
src/
├── components/          # کامپوننت‌های عمومی
│   ├── common/         # کامپوننت‌های مشترک
│   └── layout/         # کامپوننت‌های layout
├── modules/            # ماژول‌های اصلی
│   ├── dashboard/      # داشبورد اصلی
│   └── master-definitions/ # تعاریف اصلی
├── store/              # Redux store
├── types/              # تعاریف TypeScript
├── utils/              # توابع کمکی
├── api/                # API calls
└── assets/             # فایل‌های استاتیک
```

## 🔧 تنظیمات

### متغیرهای محیطی

فایل `.env` را در پوشه اصلی ایجاد کنید:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=ساجد
```

### تنظیمات Vite

فایل `vite.config.ts` شامل تنظیمات بهینه‌سازی:
- Code splitting
- Bundle optimization
- Path aliases
- Development server

### تنظیمات TypeScript

فایل `tsconfig.json` شامل:
- Strict type checking
- Path mapping
- Incremental compilation
- Performance optimizations

## 🚀 بهینه‌سازی‌های اعمال شده

### پکیج‌ها
- ✅ به‌روزرسانی پکیج‌های امن و سازگار
- ✅ حذف پکیج‌های deprecated
- ✅ بهینه‌سازی وابستگی‌ها

### Build
- ✅ Code splitting برای vendor و MUI
- ✅ Minification با Terser
- ✅ Bundle size optimization
- ✅ Incremental TypeScript compilation

### Development
- ✅ ESLint configuration
- ✅ Prettier formatting
- ✅ Type checking
- ✅ Security auditing

### Performance
- ✅ Lazy loading
- ✅ Tree shaking
- ✅ Bundle analysis
- ✅ Cache optimization

## 🤝 مشارکت

1. Fork کنید
2. Branch جدید ایجاد کنید (`git checkout -b feature/amazing-feature`)
3. تغییرات را commit کنید (`git commit -m 'Add amazing feature'`)
4. Push کنید (`git push origin feature/amazing-feature`)
5. Pull Request ایجاد کنید

## 📄 لایسنس

این پروژه تحت لایسنس MIT منتشر شده است.

## 📞 پشتیبانی

برای سوالات و مشکلات:
- Issue در GitHub ایجاد کنید
- با تیم توسعه تماس بگیرید

---

**ساجد** - سیستم مدیریت عملیات نظامی پیشرفته 🇮🇷 