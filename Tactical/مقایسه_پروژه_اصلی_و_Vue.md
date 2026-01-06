# 📊 مقایسه پروژه اصلی (React) و پروژه Vue

## 🎯 خلاصه وضعیت

### ✅ **چیزهایی که در Vue کار می‌کنند:**
- ✅ ساختار پایه پروژه
- ✅ Map component (با مشکلات جزئی)
- ✅ Project component (ساده‌شده)
- ✅ ProjectList component (ساده‌شده)
- ✅ Services initialization (ناقص)
- ✅ Routing با Vue Router
- ✅ Polyfills برای browser environment

### ❌ **چیزهایی که در Vue کم هستند:**

---

## 🔍 مقایسه دقیق Services

### **پروژه اصلی (React) - Project-services.js:**

```javascript
// ✅ موجود در Vue
services.emitter = emitter
services.sessionStore = sessionStore
services.undo = undo
services.selection = selection
services.store = store
services.preferencesStore = preferencesStore
services.tileLayerStore = tileLayerStore
services.projectStore = projectStore

// ❌ موجود نیست در Vue
services.ipcRenderer = ipcRenderer
services.dragAndDrop = dragAndDrop
services.documentStore = documentStore
services.searchIndex = searchIndex
services.featureStore = featureStore
services.spatialIndex = spatialIndex
services.osdDriver = osdDriver
services.clipboard = clipboard
services.coordinatesFormat = coordinatesFormat
services.optionStore = optionStore
services.kbarActions = new KBarActions({...})
services.replicationProvider = MatrixClient({...})
services.signals = {}
services.commandRegistry = commandRegistry
services.locator = () => services
```

### **پروژه Vue - projectServices.js:**

```javascript
// ✅ موجود
services.emitter = emitter
services.projectStore = projectStore
services.preferencesStore = preferencesStore
services.sessionStore = sessionStore
services.store = store
services.tileLayerStore = tileLayerStore
services.undo = undo (Mock)
services.selection = selection (Mock)
services.jsonDB = jsonDB
services.wkbDB = wkbDB

// ❌ موجود نیست
// همه چیزهای بالا که در React موجود است
```

---

## 🧩 مقایسه Components

### **پروژه اصلی (React) - Project.js:**

```jsx
export const Project = () => {
  return (
    <div className="site-container">
      { toolbar }              // ✅ Toolbar
      <div className="content">
        <div id='map-container'>
          <Map/>                // ✅ Map
        </div>
        <div className="map-overlay">
          { sidebar }           // ❌ Sidebar (کم است)
          <OSD/>                // ❌ OSD (کم است)
          { propertiesPanel }   // ❌ Properties (کم است)
        </div>
        <KBar/>                // ❌ KBar (کم است)
        <Replication />        // ❌ Replication (کم است)
      </div>
    </div>
  )
}
```

### **پروژه Vue - Project.vue:**

```vue
<template>
  <div class="project-container">
    <div class="toolbar">      // ⚠️ Toolbar ساده (بدون کامپوننت)
      <button>بازگشت</button>
    </div>
    <div v-if="loading">...</div>
    <div v-else-if="error">...</div>
    <div v-else>
      <Map />                  // ✅ Map
    </div>
  </div>
</template>
```

**تفاوت‌ها:**
- ❌ Toolbar component کامل نیست
- ❌ Sidebar component نیست
- ❌ OSD component نیست
- ❌ Properties panel نیست
- ❌ KBar component نیست
- ❌ Replication component نیست

---

## 🔧 مقایسه Hooks/Composables

### **پروژه اصلی (React) - hooks.js:**

```javascript
// ✅ موجود
export const useServices = () => React.useContext(ServiceContext)
export const useMemento = (key, defaultValue) => { ... }
export const useDebounce = (value, delay) => { ... }
export const useList = (options = {}) => { ... }
export const useEmitter = key => { ... }
```

### **پروژه Vue - composables/:**

```javascript
// ✅ موجود
export function useServices() { ... }

// ❌ موجود نیست
// useMemento - باید تبدیل شود
// useDebounce - باید تبدیل شود
// useList - باید تبدیل شود
// useEmitter - باید تبدیل شود
```

---

## 🗂️ مقایسه ساختار فایل‌ها

### **پروژه اصلی:**

```
src/renderer/components/
├── App.js                    ✅
├── Project.js                ✅ (کامل)
├── ProjectList.js            ✅ (کامل)
├── Map.js                    ✅
├── Toolbar.js                ✅
├── KBar.js                   ✅
├── OSD.js                    ✅
├── Sidebar/                  ✅
├── Properties/               ✅
├── Print/                    ✅
├── ProjectList/              ✅
└── collaboration/            ✅
```

### **پروژه Vue:**

```
src/components/
├── App.vue                   ✅
├── Project.vue               ⚠️ (ساده‌شده)
├── ProjectList.vue           ⚠️ (ساده‌شده)
├── Map.vue                   ✅
├── Toolbar.js                ❌ (کپی شده اما استفاده نشده)
├── KBar.js                   ❌ (کپی شده اما استفاده نشده)
├── OSD.js                    ❌ (کپی شده اما استفاده نشده)
├── Sidebar/                  ❌ (کپی نشده)
├── Properties/               ⚠️ (کپی شده اما استفاده نشده)
├── Print/                    ✅ (کپی شده)
├── ProjectList/              ⚠️ (کپی شده اما استفاده نشده)
└── collaboration/            ⚠️ (ساده‌شده)
```

---

## 🐛 مشکلات اجرا

### **1. Services ناقص:**

**مشکل:** بسیاری از services در Vue initialize نمی‌شوند:
- `featureStore` - برای نمایش features روی map
- `searchIndex` - برای جستجو
- `spatialIndex` - برای spatial queries
- `documentStore` - برای مدیریت documents
- `optionStore` - برای options
- `osdDriver` - برای OSD overlay
- `clipboard` - برای copy/paste
- `coordinatesFormat` - برای فرمت coordinates
- `kbarActions` - برای KBar commands
- `commandRegistry` - برای command handling
- `replicationProvider` - برای replication

**تأثیر:** Map ممکن است initialize شود اما features نمایش داده نشوند.

### **2. Components ناقص:**

**مشکل:** بسیاری از components در Vue وجود ندارند:
- `Toolbar` - toolbar کامل نیست
- `Sidebar` - sidebar نیست
- `OSD` - overlay display نیست
- `Properties` - properties panel نیست
- `KBar` - command palette نیست
- `Replication` - replication UI نیست

**تأثیر:** UI ناقص است و بسیاری از قابلیت‌ها در دسترس نیست.

### **3. Hooks/Composables ناقص:**

**مشکل:** بسیاری از hooks در Vue تبدیل نشده‌اند:
- `useMemento` - برای state persistence
- `useDebounce` - برای debouncing
- `useList` - برای list management
- `useEmitter` - برای event handling

**تأثیر:** State management ناقص است.

### **4. Bootstrap ناقص:**

**مشکل:** در پروژه اصلی، چندین bootstrap انجام می‌شود:
```javascript
await schema.bootstrap()
await tileLayerStore.bootstrap()
await searchIndex.bootstrap()
await spatialIndex.bootstrap()
```

**در Vue:** فقط `tileLayerStore.bootstrap()` انجام می‌شود.

**تأثیر:** Schema و indexes initialize نمی‌شوند.

---

## 📋 لیست کارهای باقی‌مانده

### **اولویت بالا (برای اجرای Map):**

1. ✅ **TileLayerStore** - انجام شده
2. ❌ **FeatureStore** - باید اضافه شود
3. ❌ **SpatialIndex** - باید اضافه شود
4. ❌ **Schema bootstrap** - باید اضافه شود
5. ❌ **vectorSources** - باید بررسی شود که همه services را دارد

### **اولویت متوسط (برای UI کامل):**

6. ❌ **Toolbar component** - باید تبدیل شود
7. ❌ **Sidebar component** - باید تبدیل شود
8. ❌ **OSD component** - باید تبدیل شود
9. ❌ **Properties panel** - باید تبدیل شود
10. ❌ **KBar component** - باید تبدیل شود

### **اولویت پایین (برای قابلیت‌های پیشرفته):**

11. ❌ **SearchIndex** - برای جستجو
12. ❌ **DocumentStore** - برای documents
13. ❌ **OptionStore** - برای options
14. ❌ **Clipboard** - برای copy/paste
15. ❌ **CommandRegistry** - برای commands
16. ❌ **Replication** - برای collaboration

---

## 🎯 درصد تطابق

### **Services:**
- موجود: 8/21 = **38%**
- ناقص: 13/21 = **62%**

### **Components:**
- موجود: 4/10 = **40%**
- ناقص: 6/10 = **60%**

### **Hooks/Composables:**
- موجود: 1/5 = **20%**
- ناقص: 4/5 = **80%**

### **کل پروژه:**
- **تطابق کلی: ~35%**

---

## 🔧 راه‌حل‌های پیشنهادی

### **1. اضافه کردن Services ضروری:**

```javascript
// در projectServices.js
import { FeatureStore } from '../store/FeatureStore.js'
import { SpatialIndex } from '../store/SpatialIndex.js'
import Schema from '../store/schema/Schema.js'

// Initialize
const spatialIndex = new SpatialIndex(wkbDB)
const featureStore = new FeatureStore(store)

const schema = new Schema(db, {
  ids: 'KEY-ONLY',
  tags: 'SEPARATE',
  // ...
})

// Bootstrap
await schema.bootstrap()
await spatialIndex.bootstrap()

services.featureStore = featureStore
services.spatialIndex = spatialIndex
```

### **2. تبدیل Components:**

```vue
<!-- Project.vue -->
<template>
  <div class="site-container">
    <Toolbar v-if="toolbarShowing" />
    <div class="content">
      <div id='map-container'>
        <Map />
      </div>
      <div class="map-overlay">
        <Sidebar v-if="sidebarShowing" />
        <OSD />
        <Properties v-if="properties" :scope="properties" />
      </div>
      <KBar />
    </div>
  </div>
</template>
```

### **3. تبدیل Hooks:**

```javascript
// composables/useMemento.js
export function useMemento(key, defaultValue) {
  const { preferencesStore } = useServices()
  const value = ref(defaultValue)
  
  watch(() => preferencesStore.get(key), (newVal) => {
    value.value = newVal ?? defaultValue
  })
  
  const put = async (newValue) => {
    await preferencesStore.put(key, newValue)
  }
  
  return [value, put]
}
```

---

## 📝 نتیجه‌گیری

**وضعیت فعلی:**
- ✅ ساختار پایه کار می‌کند
- ⚠️ Map initialize می‌شود اما features نمایش داده نمی‌شوند
- ❌ UI ناقص است
- ❌ بسیاری از قابلیت‌ها در دسترس نیست

**برای اجرای کامل:**
1. اضافه کردن Services ضروری (FeatureStore, SpatialIndex, Schema)
2. تبدیل Components اصلی (Toolbar, Sidebar, OSD, Properties)
3. تبدیل Hooks به Composables
4. اضافه کردن Bootstrap کامل

**زمان تخمینی:** 2-3 روز برای MVP کامل

