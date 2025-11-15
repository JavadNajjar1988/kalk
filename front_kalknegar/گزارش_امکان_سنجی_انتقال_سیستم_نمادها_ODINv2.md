# گزارش امکان‌سنجی انتقال سیستم تولید و رسم نمادهای ODINv2 به front_kalknegar

## 📋 خلاصه اجرایی

**وضعیت کلی**: ✅ **امکان‌پذیر با کار متوسط**

پروژه `front_kalknegar` از نظر تکنولوژی‌های پایه با ODINv2 سازگاری خوبی دارد، اما نیاز به نصب چند وابستگی اضافی و ایجاد adapter برای سازگاری با Vue 3 دارد.

---

## ✅ نقاط قوت و سازگاری

### 1. کتابخانه‌های مشترک موجود

| کتابخانه | ODINv2 | front_kalknegar | وضعیت |
|----------|--------|-----------------|-------|
| **OpenLayers** | ^10.6.1 | ^10.6.1 (dev) | ✅ **سازگار کامل** |
| **@syncpoint/signs** | ^1.1.0 | ^1.1.0 | ✅ **موجود** |
| **JSTS** | ^2.12.1 | ^2.7.1 (via @turf/jsts) | ⚠️ **نسخه متفاوت** |
| **Ramda** | ^0.31.3 | ^0.30.1 (via @turf/turf) | ⚠️ **نسخه متفاوت** |
| **TypeScript** | ❌ | ✅ | ✅ **مزیت** |

### 2. معماری مشابه

- هر دو از **OpenLayers** برای نقشه استفاده می‌کنند
- هر دو از **@syncpoint/signs** برای تولید نمادها استفاده می‌کنند
- هر دو از **Vite** برای build استفاده می‌کنند

---

## ⚠️ چالش‌ها و نیازمندی‌ها

### 1. وابستگی‌های مفقود

#### الف) @syncpoint/signal
- **وضعیت**: ❌ در package.json نیست
- **نیاز**: برای reactive programming در سیستم استایل
- **راه حل**: 
  ```bash
  npm install @syncpoint/signal
  ```
- **جایگزین**: می‌توان از RxJS یا Vue reactivity استفاده کرد

#### ب) JSTS مستقیم
- **وضعیت**: ⚠️ فقط از طریق @turf/jsts موجود است
- **نیاز**: ODINv2 از JSTS مستقیم استفاده می‌کند
- **راه حل**:
  ```bash
  npm install jsts@^2.12.1
  ```

#### ج) Ramda مستقیم
- **وضعیت**: ⚠️ فقط از طریق @turf/turf موجود است
- **نیاز**: ODINv2 از Ramda مستقیم استفاده می‌کند
- **راه حل**:
  ```bash
  npm install ramda@^0.31.3
  ```

#### د) Proj4
- **وضعیت**: ❌ در package.json نیست
- **نیاز**: برای تبدیل سیستم‌های مختصات
- **راه حل**:
  ```bash
  npm install proj4@^2.19.10
  ```

### 2. تفاوت‌های معماری

#### الف) React vs Vue
- **ODINv2**: از React استفاده می‌کند
- **front_kalknegar**: از Vue 3 استفاده می‌کند
- **تأثیر**: کدهای UI component نیاز به بازنویسی ندارند (فقط منطق استایل)
- **راه حل**: سیستم استایل ODINv2 مستقل از React است و می‌تواند مستقیماً استفاده شود

#### ب) Signal Pattern
- **ODINv2**: از `@syncpoint/signal` برای reactive state استفاده می‌کند
- **front_kalknegar**: از Vue reactivity استفاده می‌کند
- **راه حل**: 
  - گزینه 1: نصب @syncpoint/signal (ساده‌تر)
  - گزینه 2: تبدیل به Vue reactivity (نیاز به کار بیشتر)

### 3. ساختار Feature

#### مشکل
ODINv2 انتظار دارد feature یک property `$` داشته باشد که signals را نگه می‌دارد:

```javascript
feature.$ = {
  properties: Signal.of(...),
  geometry: Signal.of(...),
  // ...
}
```

#### راه حل
ایجاد یک adapter function:

```typescript
// src/geo/odinStyleAdapter.ts
import Signal from '@syncpoint/signal'
import Feature from 'ol/Feature'
import type { FeatureLike } from 'ol/Feature'

export function adaptFeatureForOdinStyle(
  feature: FeatureLike,
  options: {
    resolution?: number
    globalStyle?: Record<string, any>
    layerStyle?: Record<string, any>
    featureStyle?: Record<string, any>
    selectionMode?: string | null
  } = {}
) {
  const $: any = {
    properties: Signal.of(feature.getProperties()),
    geometry: Signal.of(feature.getGeometry()),
    globalStyle: Signal.of(options.globalStyle || {}),
    layerStyle: Signal.of(options.layerStyle || {}),
    featureStyle: Signal.of(options.featureStyle || {}),
    selectionMode: Signal.of(options.selectionMode || null),
    centerResolution: Signal.of(options.resolution || 1)
  }
  
  ;(feature as any).$ = $
  return feature
}
```

---

## 📦 فایل‌های لازم برای انتقال

### ساختار پیشنهادی:

```
front_kalknegar/
├── src/
│   ├── geo/
│   │   ├── odinStyles/              # پوشه جدید
│   │   │   ├── index.ts            # نقطه ورود
│   │   │   ├── adapter.ts          # adapter برای Vue
│   │   │   │
│   │   │   ├── symbology/          # از ODINv2
│   │   │   │   ├── 2525c.ts
│   │   │   │   ├── 2525c.json
│   │   │   │   └── symbol.ts
│   │   │   │
│   │   │   ├── style/              # از ODINv2
│   │   │   │   ├── styles.ts
│   │   │   │   ├── styleFactory.ts
│   │   │   │   ├── styleRegistry.ts
│   │   │   │   ├── graphics.ts
│   │   │   │   ├── symbol.ts
│   │   │   │   ├── linestring.ts
│   │   │   │   ├── polygon.ts
│   │   │   │   ├── multipoint.ts
│   │   │   │   └── ...
│   │   │   │
│   │   │   └── ts/                 # از ODINv2
│   │   │       ├── index.ts
│   │   │       ├── library.ts
│   │   │       └── parser.ts
│   │   │
│   │   └── featureStyles.ts        # ادغام با کد موجود
```

---

## 🔧 مراحل پیاده‌سازی

### مرحله 1: نصب وابستگی‌ها

```bash
cd front_kalknegar
npm install @syncpoint/signal@^1.3.0
npm install jsts@^2.12.1
npm install ramda@^0.31.3
npm install proj4@^2.19.10
```

### مرحله 2: کپی فایل‌های ODINv2

```bash
# کپی پوشه symbology
cp -r ODINv2-main/src/renderer/symbology front_kalknegar/src/geo/odinStyles/

# کپی پوشه ol/style
cp -r ODINv2-main/src/renderer/ol/style front_kalknegar/src/geo/odinStyles/

# کپی پوشه ol/ts
cp -r ODINv2-main/src/renderer/ol/ts front_kalknegar/src/geo/odinStyles/

# کپی model/geometry.js
cp ODINv2-main/src/renderer/model/geometry.js front_kalknegar/src/geo/odinStyles/geometry.ts
```

### مرحله 3: تبدیل JavaScript به TypeScript

- تبدیل فایل‌های `.js` به `.ts`
- اضافه کردن type definitions
- تبدیل imports به ES modules

### مرحله 4: ایجاد Adapter

```typescript
// src/geo/odinStyles/adapter.ts
import Signal from '@syncpoint/signal'
import type { FeatureLike } from 'ol/Feature'
import createStyles from './style/styles'

export interface OdinStyleOptions {
  resolution?: number
  globalStyle?: Record<string, any>
  layerStyle?: Record<string, any>
  featureStyle?: Record<string, any>
  selectionMode?: string | null
}

export function createOdinStyle(
  feature: FeatureLike,
  options: OdinStyleOptions = {}
) {
  // ایجاد $ property
  const $: any = {
    properties: Signal.of(feature.getProperties()),
    geometry: Signal.of(feature.getGeometry()),
    globalStyle: Signal.of(options.globalStyle || {}),
    layerStyle: Signal.of(options.layerStyle || {}),
    featureStyle: Signal.of(options.featureStyle || {}),
    selectionMode: Signal.of(options.selectionMode || null),
    centerResolution: Signal.of(options.resolution || 1)
  }
  
  ;(feature as any).$ = $
  
  // دریافت استایل‌ها
  const styleSignal = createStyles(feature)
  
  // تبدیل signal به style array
  return styleSignal
}
```

### مرحله 5: ادغام با featureStyles.ts موجود

```typescript
// src/geo/featureStyles.ts
import { createOdinStyle } from './odinStyles/adapter'
import { Style } from 'ol/style'

export function useFeatureStyles(geo: TGeo) {
  // ... کد موجود ...
  
  function scenarioFeatureStyle(
    feature: FeatureLike,
    resolution: number,
    overrideLimitVisibility = false,
  ) {
    // استفاده از ODINv2 styles برای tactical graphics
    if (isTacticalGraphic(feature)) {
      const styleSignal = createOdinStyle(feature, {
        resolution,
        globalStyle: getGlobalStyle(),
        layerStyle: getLayerStyle(feature),
        featureStyle: getFeatureStyle(feature)
      })
      
      // تبدیل signal به OpenLayers Style
      // (نیاز به subscription دارد)
      return convertSignalToStyle(styleSignal)
    }
    
    // استفاده از کد موجود برای سایر موارد
    // ...
  }
}
```

---

## 📊 مقایسه سیستم‌های موجود

### سیستم فعلی front_kalknegar

```typescript
// src/geo/unitStyles.ts
export function createUnitStyle(unit: NUnit, symbolOptions: UnitSymbolOptions): Style {
  const milSymbol = symbolGenerator(sidc, {
    size: settingsStore.mapIconSize,
    uniqueDesignation,
    // ...
  })
  
  return new Style({
    image: new Icon({
      img: milSymbol.asCanvas(),
      // ...
    })
  })
}
```

**ویژگی‌ها**:
- ✅ ساده و مستقیم
- ✅ فقط برای نمادهای نقطه‌ای (units)
- ❌ پشتیبانی محدود از tactical graphics
- ❌ بدون پشتیبانی از نمادهای خطی/چندوجهی پیچیده

### سیستم ODINv2

**ویژگی‌ها**:
- ✅ پشتیبانی کامل از تمام انواع نمادها
- ✅ نمادهای خطی پیچیده (fence، arrow، etc.)
- ✅ نمادهای چندوجهی (strong point، encirclement، etc.)
- ✅ نمادهای چندنقطه‌ای (fan، circle، etc.)
- ✅ صاف‌سازی و بهینه‌سازی خودکار
- ⚠️ پیچیده‌تر و نیاز به reactive programming

---

## 🎯 پیشنهادات

### گزینه 1: ادغام کامل (پیشنهادی)

**مزایا**:
- ✅ استفاده از تمام قابلیت‌های ODINv2
- ✅ پشتیبانی کامل از tactical graphics
- ✅ یکپارچگی در سیستم استایل

**معایب**:
- ⚠️ نیاز به کار بیشتر
- ⚠️ پیچیدگی بیشتر

**زمان تخمینی**: 3-5 روز کاری

### گزینه 2: استفاده انتخابی

**استراتژی**:
- استفاده از ODINv2 فقط برای tactical graphics پیچیده
- نگه داشتن سیستم موجود برای units

**مزایا**:
- ✅ تغییرات کمتر
- ✅ ریسک کمتر

**معایب**:
- ⚠️ دو سیستم موازی
- ⚠️ نگهداری سخت‌تر

**زمان تخمینی**: 1-2 روز کاری

### گزینه 3: استفاده فقط برای Landing Page

**استراتژی**:
- استفاده از ODINv2 فقط در صفحه Landing Page
- برای نمایش نمونه‌های نمادها

**مزایا**:
- ✅ تغییرات بسیار کم
- ✅ ریسک بسیار کم
- ✅ نمایش قابلیت‌ها

**معایب**:
- ⚠️ استفاده محدود

**زمان تخمینی**: 0.5-1 روز کاری

---

## ⚡ پیاده‌سازی سریع برای Landing Page

### مرحله 1: نصب وابستگی‌ها

```bash
npm install @syncpoint/signal jsts ramda proj4
```

### مرحله 2: ایجاد کامپوننت ساده

```vue
<!-- src/components/OdinSymbolDemo.vue -->
<template>
  <div class="map-container">
    <div ref="mapContainer" class="w-full h-96"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Map from 'ol/Map'
import View from 'ol/View'
import { Tile as TileLayer } from 'ol/layer'
import { OSM } from 'ol/source'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Feature } from 'ol'
import { Point, LineString, Polygon } from 'ol/geom'
import { createOdinStyle } from '@/geo/odinStyles/adapter'

const mapContainer = ref<HTMLElement>()

onMounted(() => {
  const map = new Map({
    target: mapContainer.value!,
    layers: [
      new TileLayer({
        source: new OSM()
      })
    ],
    view: new View({
      center: [0, 0],
      zoom: 2
    })
  })
  
  // ایجاد نمونه‌های نماد
  const features = [
    // Point symbol
    new Feature({
      geometry: new Point([0, 0]),
      sidc: 'G*F*LT----'
    }),
    // LineString symbol
    new Feature({
      geometry: new LineString([[10, 10], [20, 20]]),
      sidc: 'G*T*A-----'
    }),
    // Polygon symbol
    new Feature({
      geometry: new Polygon([[[-10, -10], [10, -10], [10, 10], [-10, 10], [-10, -10]]]),
      sidc: 'G*M*SP----'
    })
  ]
  
  // اعمال استایل ODINv2
  features.forEach(feature => {
    const styleSignal = createOdinStyle(feature, {
      resolution: map.getView().getResolution() || 1
    })
    
    // تبدیل signal به style
    styleSignal.subscribe(styles => {
      // تبدیل به OpenLayers Style
      // ...
    })
  })
  
  const vectorLayer = new VectorLayer({
    source: new VectorSource({
      features
    })
  })
  
  map.addLayer(vectorLayer)
})
</script>
```

---

## 📝 چک‌لیست پیاده‌سازی

### پیش‌نیازها
- [ ] نصب @syncpoint/signal
- [ ] نصب jsts@^2.12.1
- [ ] نصب ramda@^0.31.3
- [ ] نصب proj4@^2.19.10

### انتقال فایل‌ها
- [ ] کپی پوشه symbology
- [ ] کپی پوشه ol/style
- [ ] کپی پوشه ol/ts
- [ ] کپی model/geometry.js

### تبدیل و سازگاری
- [ ] تبدیل .js به .ts
- [ ] اضافه کردن type definitions
- [ ] ایجاد adapter برای Vue
- [ ] تست imports

### ادغام
- [ ] ادغام با featureStyles.ts
- [ ] تست نمادهای نقطه‌ای
- [ ] تست نمادهای خطی
- [ ] تست نمادهای چندوجهی
- [ ] تست نمادهای چندنقطه‌ای

### تست و بهینه‌سازی
- [ ] تست عملکرد
- [ ] بهینه‌سازی bundle size
- [ ] مستندسازی

---

## 🚨 نکات مهم

1. **حق نشر**: مطمئن شوید که مجوز استفاده از کد ODINv2 را دارید (AGPLv3)

2. **نسخه‌ها**: 
   - JSTS در front_kalknegar نسخه 2.7.1 است (از طریق turf)
   - ODINv2 از نسخه 2.12.1 استفاده می‌کند
   - ممکن است نیاز به بررسی سازگاری باشد

3. **Bundle Size**: 
   - اضافه کردن ODINv2 styles ممکن است bundle size را افزایش دهد
   - پیشنهاد: استفاده از code splitting

4. **Performance**:
   - سیستم ODINv2 از reactive programming استفاده می‌کند
   - ممکن است نیاز به بهینه‌سازی برای Vue باشد

---

## ✅ نتیجه‌گیری

**امکان‌پذیری**: ✅ **بله، امکان‌پذیر است**

**سطح دشواری**: ⭐⭐⭐ (متوسط)

**زمان تخمینی**: 
- برای Landing Page: 0.5-1 روز
- برای ادغام کامل: 3-5 روز

**پیشنهاد**: شروع با گزینه 3 (استفاده در Landing Page) و سپس گسترش به سایر بخش‌ها

---

## 📚 منابع

- [ODINv2 Repository](https://github.com/syncpoint/ODINv2)
- [OpenLayers Documentation](https://openlayers.org/)
- [JSTS Documentation](https://github.com/bjornharrtell/jsts)
- [@syncpoint/signs](https://www.npmjs.com/package/@syncpoint/signs)

