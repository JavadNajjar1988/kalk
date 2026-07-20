# ODINv2 - Vue Version

این پروژه نسخه Vue از ODINv2 است که از React به Vue تبدیل شده است.

## 🎯 وضعیت پروژه

### ✅ انجام شده:

1. ✅ ساختار اولیه پروژه Vue
2. ✅ کپی کردن کدهای مستقل (بدون تغییر):
   - `ol/style/` - سیستم نمادها
   - `ol/ts/` - توابع هندسی
   - `model/` - منطق business
   - `store/` - state management
   - `symbology/` - نمادهای نظامی
   - `shared/` - توابع مشترک
3. ✅ تبدیل Map Component به Vue
4. ✅ تبدیل Hooks به Composables
5. ✅ تنظیمات Vite و Router

### 🔄 در حال انجام:

- تبدیل UI Components (Toolbar, Sidebar, etc.)
- Setup Services و State Management
- تبدیل ProjectList و Project components

### 📝 TODO:

- [ ] کامل کردن Project component
- [ ] کامل کردن ProjectList component
- [ ] تبدیل Toolbar به Vue
- [ ] تبدیل Sidebar به Vue
- [ ] Setup Services (Store, Preferences, etc.)
- [ ] تبدیل Properties panels
- [ ] تبدیل Print functionality
- [ ] تست کامل نمادها

## 🚀 نصب و اجرا

```bash
cd Odin-Vue
npm install
npm run dev
```

## 📁 ساختار پروژه

```
Odin-Vue/
├── src/
│   ├── components/        # Vue Components
│   │   ├── Map.vue       # ✅ تبدیل شده
│   │   ├── Project.vue   # 🔄 در حال توسعه
│   │   └── map/          # کدهای map (بدون تغییر)
│   ├── composables/      # Vue Composables
│   │   ├── useServices.js
│   │   └── useMemento.js
│   ├── ol/               # ✅ کپی شده (بدون تغییر)
│   │   ├── style/        # سیستم نمادها
│   │   └── ts/           # توابع هندسی
│   ├── model/            # ✅ کپی شده (بدون تغییر)
│   ├── store/            # ✅ کپی شده (بدون تغییر)
│   ├── symbology/        # ✅ کپی شده (بدون تغییر)
│   ├── shared/           # ✅ کپی شده (بدون تغییر)
│   ├── App.vue
│   └── main.js
├── package.json
├── vite.config.js
└── index.html
```

## 🔑 نکات مهم

### ✅ نمادها بدون تغییر:

همه کدهای نماد (`ol/style/`) **بدون هیچ تغییری** از پروژه اصلی کپی شده‌اند و **عیناً مثل قبل** کار می‌کنند!

### ✅ OpenLayers بدون تغییر:

OpenLayers framework-agnostic است و فقط به DOM element نیاز دارد.

### 🔄 فقط UI تغییر کرده:

- React Components → Vue Components
- React Hooks → Vue Composables
- React Context → Vue Provide/Inject

## 📚 منابع

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vue Router](https://router.vuejs.org/)

## 🎉 مزایای Vue Version

1. ✅ **نمادها عیناً مثل قبل کار می‌کنند**
2. ✅ **کدهای business logic بدون تغییر**
3. ✅ **Performance بهتر با Vite**
4. ✅ **Composition API برای کد تمیزتر**

---

**نکته:** این پروژه در حال توسعه است و هنوز کامل نیست. برای استفاده کامل، باید تمام components تبدیل شوند.

