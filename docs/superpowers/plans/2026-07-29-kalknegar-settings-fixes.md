# Kalknegar Settings Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** اصلاح منبع نقشه پایه، قالب‌بندی و پیش‌نمایش زمان، ماندگاری ترجیحات و متن‌های آزمایشی پنل تنظیمات کالک‌نگار.

**Architecture:** داده سناریو منبع نقشه پایه سناریوی موجود می‌ماند و یک تابع کوچک مقدار اولیه نمای نقشه را انتخاب می‌کند. قالب‌بندی زمان در یک تابع تست‌پذیر مبتنی بر `Intl.DateTimeFormat` متمرکز می‌شود. ترجیحات عمومی با الگوی فعلی `useLocalStorage` ذخیره خواهند شد.

**Tech Stack:** Vue 3، Pinia 3، VueUse، TypeScript 5.8، Vitest 3، jsdom

## Global Constraints

- شناسه‌ها و کلیدهای فعلی `localStorage` جز دو کلید تازه `measurementUnit` و `showToolbar` تغییر نکنند.
- نقشه پایه سناریوی موجود با ترجیح محلی کاربر بازنویسی نشود.
- خروجی فارسی زمان با رقم‌های فارسی باقی بماند.
- بازطراحی بصری پنل و تغییر تنظیمات ویرایشگر چارت خارج از دامنه است.

---

### Task 1: همگام‌سازی امن نقشه پایه

**Files:**
- Create: `front_kalknegar/src/modules/scenarioeditor/scenarioBasemap.ts`
- Create: `front_kalknegar/src/modules/scenarioeditor/scenarioBasemap.test.ts`
- Modify: `front_kalknegar/src/modules/scenarioeditor/ScenarioEditor.vue:302-304,463-468`

**Interfaces:**
- Consumes: `scenarioBaseMapId: unknown` و `fallbackBaseMapId: string`
- Produces: `resolveInitialBaseMapId(scenarioBaseMapId, fallbackBaseMapId): string`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { resolveInitialBaseMapId } from "./scenarioBasemap";

describe("resolveInitialBaseMapId", () => {
  it("keeps the base map stored in an existing scenario", () => {
    expect(resolveInitialBaseMapId("esriWorldImagery", "osm")).toBe("esriWorldImagery");
  });

  it("uses the user default only when the scenario has no usable base map", () => {
    expect(resolveInitialBaseMapId("  ", "openTopoMap")).toBe("openTopoMap");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/modules/scenarioeditor/scenarioBasemap.test.ts`

Expected: FAIL because `scenarioBasemap.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
export function resolveInitialBaseMapId(
  scenarioBaseMapId: unknown,
  fallbackBaseMapId: string,
): string {
  return typeof scenarioBaseMapId === "string" && scenarioBaseMapId.trim()
    ? scenarioBaseMapId.trim()
    : fallbackBaseMapId;
}
```

در `ScenarioEditor.vue` مقدار اولیه به این شکل اعمال شود و بلوک `store.update` حذف شود:

```ts
mapStore.baseLayerName = resolveInitialBaseMapId(
  state.mapSettings.baseMapId,
  mapStore.baseLayerName,
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/modules/scenarioeditor/scenarioBasemap.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add front_kalknegar/src/modules/scenarioeditor/scenarioBasemap.ts front_kalknegar/src/modules/scenarioeditor/scenarioBasemap.test.ts front_kalknegar/src/modules/scenarioeditor/ScenarioEditor.vue
git commit -m "fix: preserve scenario basemap on open"
```

### Task 2: قالب‌بندی واقعی زمان و تاریخ

**Files:**
- Create: `front_kalknegar/src/stores/timeFormatStore.test.ts`
- Modify: `front_kalknegar/src/stores/timeFormatStore.ts:72-100`

**Interfaces:**
- Consumes: `timeZone: string`، `settings: TimeFormatSettings` و گزینه `dateOnly`
- Produces: `createFormatter(timeZone, settings, options): { format(value: number): string }`

- [ ] **Step 1: Write failing formatter tests**

```ts
import { describe, expect, it } from "vitest";
import { createFormatter, type TimeFormatSettings } from "./timeFormatStore";

const settings: TimeFormatSettings = {
  timeFormat: "local",
  locale: "en-US",
  dateStyle: "short",
  timeStyle: "short",
};

describe("createFormatter", () => {
  it("applies the requested time zone", () => {
    const value = Date.UTC(2026, 0, 1, 12, 0, 0);
    expect(createFormatter("UTC", settings).format(value)).not.toBe(
      createFormatter("America/New_York", settings).format(value),
    );
  });

  it("applies locale and requested date/time styles", () => {
    const value = Date.UTC(2026, 0, 1, 12, 0, 0);
    const actual = createFormatter("UTC", settings).format(value);
    const expected = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      dateStyle: "short",
      timeStyle: "short",
    }).format(value);
    expect(actual).toBe(expected);
  });

  it("falls back safely for invalid locale and time zone values", () => {
    expect(() =>
      createFormatter("invalid-zone", { ...settings, locale: "invalid_locale" }).format(0),
    ).not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- --run src/stores/timeFormatStore.test.ts`

Expected: FAIL because `createFormatter` is not exported and the existing implementation ignores locale/time zone.

- [ ] **Step 3: Implement the formatter**

`createFormatter` را export کنید. گزینه‌های `Intl.DateTimeFormat` را از تنظیمات بسازید؛ در حالت `dateOnly` فقط `dateStyle` ارسال شود. ساخت formatter ابتدا با locale/time zone انتخابی امتحان شود و در صورت `RangeError` با `fa-IR` و `UTC` تکرار شود.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit -- --run src/stores/timeFormatStore.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add front_kalknegar/src/stores/timeFormatStore.ts front_kalknegar/src/stores/timeFormatStore.test.ts
git commit -m "fix: apply time format preferences"
```

### Task 3: پیش‌نمایش واکنشی زمان

**Files:**
- Create: `front_kalknegar/src/components/TimeDateSettingsPanel.test.ts`
- Modify: `front_kalknegar/src/components/TimeDateSettingsPanel.vue:12-25`

**Interfaces:**
- Consumes: `store.state.currentTime`
- Produces: پیش‌نمایش‌های محاسبه‌شده‌ای که با تغییر زمان سناریو تازه می‌شوند.

- [ ] **Step 1: Write the failing regression test**

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("TimeDateSettingsPanel", () => {
  it("reads current scenario time reactively", () => {
    const component = readFileSync(resolve(__dirname, "TimeDateSettingsPanel.vue"), "utf8");
    expect(component).toContain("const currentTime = computed(() => store.state.currentTime)");
    expect(component).toContain("format(currentTime.value)");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --run src/components/TimeDateSettingsPanel.test.ts`

Expected: FAIL because the component currently copies `currentTime` once.

- [ ] **Step 3: Make current time reactive**

```ts
const currentTime = computed(() => store.state.currentTime);
```

هر دو formatter باید `currentTime.value` را دریافت کنند.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- --run src/components/TimeDateSettingsPanel.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add front_kalknegar/src/components/TimeDateSettingsPanel.vue front_kalknegar/src/components/TimeDateSettingsPanel.test.ts
git commit -m "fix: refresh time settings preview"
```

### Task 4: ماندگاری ترجیحات نمای نقشه

**Files:**
- Create: `front_kalknegar/src/stores/settingsPersistence.test.ts`
- Modify: `front_kalknegar/src/stores/geoStore.ts:97-106`
- Modify: `front_kalknegar/src/stores/uiStore.ts:21-25`

**Interfaces:**
- Produces: `measurementUnit` روی کلید `measurementUnit` و `showToolbar` روی کلید `showToolbar`

- [ ] **Step 1: Write failing persistence tests**

```ts
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useMeasurementsStore } from "./geoStore";
import { useUiStore } from "./uiStore";

describe("settings persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it("persists the measurement unit", () => {
    useMeasurementsStore().measurementUnit = "nautical";
    expect(localStorage.getItem("measurementUnit")).toBe("nautical");
  });

  it("persists toolbar visibility", () => {
    useUiStore().showToolbar = false;
    expect(localStorage.getItem("showToolbar")).toBe("false");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- --run src/stores/settingsPersistence.test.ts`

Expected: FAIL because both fields are plain in-memory values.

- [ ] **Step 3: Persist both fields**

```ts
measurementUnit: useLocalStorage<MeasurementUnit>("measurementUnit", "metric"),
showToolbar: useLocalStorage("showToolbar", true),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit -- --run src/stores/settingsPersistence.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add front_kalknegar/src/stores/geoStore.ts front_kalknegar/src/stores/uiStore.ts front_kalknegar/src/stores/settingsPersistence.test.ts
git commit -m "fix: persist map view preferences"
```

### Task 5: پاک‌سازی متن پنل و آزمون نهایی

**Files:**
- Create: `front_kalknegar/src/components/settingsPanelCopy.test.ts`
- Modify: `front_kalknegar/src/components/LayersPanel.vue:36-39,44-56,93-100`
- Modify: `front_kalknegar/src/components/TimeDateSettingsDetails.vue:27-29,47`
- Modify: `front_kalknegar/src/stores/timeFormatStore.ts:28-33`

**Interfaces:**
- Produces: رابط فارسی بدون بلوک اشکال‌زدایی عمومی.

- [ ] **Step 1: Write failing copy/cleanup tests**

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("settings panel copy", () => {
  it("does not expose the map debug block", () => {
    const source = readFileSync(resolve(__dirname, "LayersPanel.vue"), "utf8");
    expect(source).not.toContain("For debugging:");
  });

  it("uses Persian labels in time settings", () => {
    const source = readFileSync(resolve(__dirname, "TimeDateSettingsDetails.vue"), "utf8");
    expect(source).toContain("زبان مرورگر");
    expect(source).toContain("پیش‌نمایش");
    expect(source).not.toContain("Browser locale is");
    expect(source).not.toContain("Preview:");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- --run src/components/settingsPanelCopy.test.ts`

Expected: FAIL on the current English/debug text.

- [ ] **Step 3: Clean up the components**

بلوک debug و محاسبه/importهای بدون مصرف `mapView` حذف شوند. عبارت‌های زمان به «زبان مرورگر» و «پیش‌نمایش» تغییر کنند و برچسب‌های `Full/Long/Medium/Short` به «کامل/بلند/متوسط/کوتاه» تبدیل شوند.

- [ ] **Step 4: Run focused and full verification**

Run:

```bash
npm run test:unit -- --run src/modules/scenarioeditor/scenarioBasemap.test.ts src/stores/timeFormatStore.test.ts src/components/TimeDateSettingsPanel.test.ts src/stores/settingsPersistence.test.ts src/components/settingsPanelCopy.test.ts
npm run type-check
npm run test:unit -- --run
npm run build-only
git diff --check
```

Expected: همه دستورها با exit code صفر تمام شوند.

- [ ] **Step 5: Commit**

```bash
git add front_kalknegar/src/components/LayersPanel.vue front_kalknegar/src/components/TimeDateSettingsDetails.vue front_kalknegar/src/stores/timeFormatStore.ts front_kalknegar/src/components/settingsPanelCopy.test.ts
git commit -m "fix: clean up settings panel copy"
```
