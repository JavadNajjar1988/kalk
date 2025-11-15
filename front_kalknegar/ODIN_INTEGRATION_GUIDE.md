# راهنمای ادغام سیستم نمادهای ODINv2 در کالک‌نگار

## ✅ مراحل انجام شده

### 1. نصب وابستگی‌ها
```bash
npm install @syncpoint/signal@^1.3.0 jsts@^2.12.1 ramda@^0.31.3 proj4@^2.19.10
```

✅ **انجام شد**

### 2. ایجاد صفحه نمایش
- ✅ فایل `src/views/OdinSymbolsDemo.vue` ایجاد شد
- ✅ Route به `src/router/index.ts` اضافه شد
- ✅ نام route به `src/router/names.ts` اضافه شد
- ✅ دکمه به صفحه Landing Page اضافه شد

### 3. آدرس دسترسی
```
http://localhost:5173/odin-symbols-demo
```

---

## 🔄 مراحل بعدی (باید انجام شود)

### مرحله 1: کپی فایل‌های ODINv2

```bash
# از ریشه پروژه اصلی
cd C:\Users\AI\Documents\GitHub\kalk

# کپی symbology
xcopy /E /I "ODINv2-main\src\renderer\symbology" "front_kalknegar\src\geo\odinStyles\symbology"

# کپی ol/style
xcopy /E /I "ODINv2-main\src\renderer\ol\style" "front_kalknegar\src\geo\odinStyles\style"

# کپی ol/ts
xcopy /E /I "ODINv2-main\src\renderer\ol\ts" "front_kalknegar\src\geo\odinStyles\ts"

# کپی model/geometry.js
copy "ODINv2-main\src\renderer\model\geometry.js" "front_kalknegar\src\geo\odinStyles\geometry.ts"

# کپی shared/Math.js (برای ثابت‌های ریاضی)
copy "ODINv2-main\src\shared\Math.js" "front_kalknegar\src\geo\odinStyles\Math.ts"
```

### مرحله 2: تبدیل JavaScript به TypeScript

تمام فایل‌های `.js` را به `.ts` تبدیل کنید و:
- Type definitions اضافه کنید
- `require` را به `import` تبدیل کنید
- `module.exports` را به `export` تبدیل کنید

### مرحله 3: ایجاد Adapter

فایل `src/geo/odinStyles/adapter.ts` را ایجاد کنید:

```typescript
import Signal from '@syncpoint/signal'
import type { FeatureLike } from 'ol/Feature'
import type { Style } from 'ol/style'
import createStyles from './style/styles'

export interface OdinStyleOptions {
  resolution?: number
  globalStyle?: Record<string, any>
  layerStyle?: Record<string, any>
  featureStyle?: Record<string, any>
  selectionMode?: string | null
}

/**
 * تبدیل Feature به ساختار مورد نیاز ODINv2 و دریافت استایل
 */
export function createOdinStyle(
  feature: FeatureLike,
  options: OdinStyleOptions = {}
): any {
  // ایجاد $ property برای feature
  const $: any = {
    properties: Signal.of(feature.getProperties()),
    geometry: Signal.of(feature.getGeometry()),
    globalStyle: Signal.of(options.globalStyle || getDefaultGlobalStyle()),
    layerStyle: Signal.of(options.layerStyle || {}),
    featureStyle: Signal.of(options.featureStyle || {}),
    selectionMode: Signal.of(options.selectionMode || null),
    centerResolution: Signal.of(options.resolution || 1)
  }
  
  // اضافه کردن $ به feature
  ;(feature as any).$ = $
  
  // دریافت استایل‌ها از سیستم ODINv2
  return createStyles(feature)
}

/**
 * استایل پیش‌فرض سراسری
 */
function getDefaultGlobalStyle() {
  return {
    'line-color': 'black',
    'line-width': 2,
    'line-cap': 'round',
    'line-join': 'round',
    'fill-color': 'rgba(255, 255, 255, 0.4)',
    'text-color': 'black',
    'text-font': '12px sans-serif',
    'text-halo-color': 'white',
    'text-halo-width': 2,
    'color-scheme': 'medium',
    'symbol-size': 60,
    'icon-scale': 0.5
  }
}

/**
 * تبدیل Signal استایل به آرایه‌ای از OpenLayers Styles
 */
export function convertSignalToStyles(styleSignal: any): Promise<Style[]> {
  return new Promise((resolve) => {
    // Subscribe به signal و دریافت استایل‌ها
    const subscription = styleSignal.subscribe((styles: any[]) => {
      // تبدیل به OpenLayers styles
      const olStyles = styles.map(style => {
        // در اینجا باید style properties را به ol/style/Style تبدیل کنید
        // این بخش در مرحله بعدی تکمیل می‌شود
        return style
      })
      
      resolve(olStyles)
      subscription() // unsubscribe
    })
  })
}
```

### مرحله 4: به‌روزرسانی OdinSymbolsDemo.vue

در فایل `src/views/OdinSymbolsDemo.vue`، تابع `loadSymbols` را به‌روزرسانی کنید:

```typescript
import { createOdinStyle, convertSignalToStyles } from '@/geo/odinStyles/adapter'

async function loadSymbols(category: string) {
  if (!vectorSource.value) return

  vectorSource.value.clear()

  const symbols = sampleSymbols[category as keyof typeof sampleSymbols]
  if (!symbols) return

  for (const symbolData of symbols) {
    let geometry
    
    if (category === 'point') {
      geometry = new Point(fromLonLat(symbolData.coords))
    } else if (category === 'line') {
      geometry = new LineString(symbolData.coords.map((c: number[]) => fromLonLat(c)))
    } else if (category === 'polygon') {
      geometry = new Polygon([symbolData.coords[0].map((c: number[]) => fromLonLat(c))])
    } else if (category === 'multipoint') {
      geometry = new MultiPoint(symbolData.coords.map((c: number[]) => fromLonLat(c)))
    }

    const feature = new Feature({
      geometry,
      sidc: symbolData.sidc,
      name: symbolData.name
    })

    // اعمال استایل ODINv2
    try {
      const styleSignal = createOdinStyle(feature, { 
        resolution: map.value?.getView().getResolution() || 1 
      })
      
      const olStyles = await convertSignalToStyles(styleSignal)
      feature.setStyle(olStyles)
    } catch (error) {
      console.error('Error creating ODIN style:', error)
    }

    vectorSource.value?.addFeature(feature)
  }

  // Fit view
  const extent = vectorSource.value.getExtent()
  map.value?.getView().fit(extent, {
    padding: [50, 50, 50, 50],
    duration: 1000
  })
}
```

---

## 📝 ساختار نهایی پروژه

```
front_kalknegar/
├── src/
│   ├── geo/
│   │   ├── odinStyles/                 # سیستم جدید ODINv2
│   │   │   ├── adapter.ts             # Adapter اصلی
│   │   │   ├── Math.ts                # ثابت‌های ریاضی
│   │   │   ├── geometry.ts            # توابع هندسی
│   │   │   │
│   │   │   ├── symbology/             # از ODINv2
│   │   │   │   ├── 2525c.ts
│   │   │   │   ├── 2525c.json
│   │   │   │   └── symbol.ts
│   │   │   │
│   │   │   ├── style/                 # از ODINv2
│   │   │   │   ├── styles.ts
│   │   │   │   ├── styleFactory.ts
│   │   │   │   ├── styleRegistry.ts
│   │   │   │   ├── graphics.ts
│   │   │   │   ├── symbol.ts
│   │   │   │   ├── linestring.ts
│   │   │   │   ├── polygon.ts
│   │   │   │   ├── multipoint.ts
│   │   │   │   ├── corridor.ts
│   │   │   │   ├── _*.ts              # Helper functions
│   │   │   │   │
│   │   │   │   ├── linestring-styles/
│   │   │   │   ├── polygon-styles/
│   │   │   │   ├── multipoint-styles/
│   │   │   │   ├── corridor-styles/
│   │   │   │   └── resources/
│   │   │   │
│   │   │   └── ts/                    # از ODINv2
│   │   │       ├── index.ts
│   │   │       ├── library.ts
│   │   │       └── parser.ts
│   │   │
│   │   ├── featureStyles.ts           # کد موجود
│   │   └── unitStyles.ts              # کد موجود
│   │
│   └── views/
│       └── OdinSymbolsDemo.vue        # صفحه جدید ✅
```

---

## 🧪 تست

بعد از تکمیل مراحل:

1. اجرای سرور توسعه:
```bash
cd front_kalknegar
npm run dev
```

2. باز کردن مرورگر:
```
http://localhost:5173/odin-symbols-demo
```

3. بررسی موارد زیر:
   - [ ] نقشه به درستی لود می‌شود
   - [ ] دکمه‌های دسته‌بندی کار می‌کنند
   - [ ] نمادها روی نقشه نمایش داده می‌شوند
   - [ ] استایل‌ها به درستی اعمال می‌شوند
   - [ ] خطایی در console نیست

---

## 🐛 رفع اشکالات احتمالی

### خطا: Module not found

```typescript
// اگر خطای "Cannot find module" دریافت کردید
// مطمئن شوید که path aliases در vite.config.ts تنظیم شده است

// vite.config.ts
resolve: {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
    '@odin': fileURLToPath(new URL('./src/geo/odinStyles', import.meta.url))
  }
}
```

### خطا: Type errors

```bash
# اگر خطای TypeScript دریافت کردید
# فایل tsconfig.json را بررسی کنید
npm run type-check
```

### مشکل با Signal

```typescript
// اگر Signal کار نمی‌کند، مطمئن شوید که:
import Signal from '@syncpoint/signal'

// نه:
import { Signal } from '@syncpoint/signal'
```

---

## 📚 منابع مفید

- [ODINv2 Source](https://github.com/syncpoint/ODINv2)
- [OpenLayers Documentation](https://openlayers.org/)
- [@syncpoint/signal](https://www.npmjs.com/package/@syncpoint/signal)
- [JSTS](https://github.com/bjornharrtell/jsts)

---

## ⏱️ زمان تخمینی

- مرحله 1 (کپی فایل‌ها): 30 دقیقه
- مرحله 2 (تبدیل به TypeScript): 2-3 ساعت
- مرحله 3 (ایجاد Adapter): 1-2 ساعت
- مرحله 4 (تست و رفع اشکال): 1-2 ساعت

**جمع کل**: 5-8 ساعت کاری (1 روز)

---

## ✅ چک‌لیست نهایی

- [ ] وابستگی‌ها نصب شدند
- [ ] فایل‌های ODINv2 کپی شدند
- [ ] فایل‌ها به TypeScript تبدیل شدند
- [ ] Adapter ایجاد شد
- [ ] OdinSymbolsDemo.vue به‌روزرسانی شد
- [ ] تست نمادهای نقطه‌ای
- [ ] تست نمادهای خطی
- [ ] تست نمادهای چندوجهی
- [ ] تست نمادهای چندنقطه‌ای
- [ ] عملکرد بررسی شد
- [ ] مستندسازی تکمیل شد

---

**نکته**: این یک نسخه اولیه است. برای نسخه کامل، نیاز به تکمیل تبدیل Signal to OpenLayers Style دارید.

